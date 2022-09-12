import { BoxCollider, Collider, SphereCollider } from "../scenegraph/physics.js";
import { CreateBoxGeometry, CreateExtrudedGeometryConvex, CreateSphereGeometry } from "../scenegraph/geometry.js";
import { Material } from "../scenegraph/material.js";
import { Mesh } from "../scenegraph/mesh.js";
import { Camera, Scene, SceneNode } from "../scenegraph/scene.js";
import { Skybox } from "../scenegraph/skybox.js";
import { Quaternion, Vector3 } from "../util/linear.js";
import { CreateWebglCanvas } from "../util/webgl.js";
import { CreateSawBlade } from "./saw-object.js";
import { Clamp, Lerp, Smoothstep } from "../util/math.js";
import { PlasticTexture } from "../texture-generator/impl/plastic.js";
import { DirtTexture } from "../texture-generator/impl/dirt.js";
import { Lava } from "./lava.js";
import { MetalTexture } from "../texture-generator/impl/metal.js";
import { CanvasDrawingToWebglTexture, ImageToWebglTexture } from "../texture-generator/image-texture.js";
import { Sprite } from "../scenegraph/sprite.js";
import { CreateSpikeObject } from "./spike-object.js";
import { Renderable } from "../scenegraph/renderable.js";
import { Mulberry32 } from "../util/util.js";

const canvas = document.createElement("canvas");

document.body.appendChild(canvas);
canvas.style.position = "absolute";
canvas.style.top = "0px";
canvas.style.left = "0px";

const gl = canvas.getContext("webgl2")!;
const scene = new Scene(gl);

scene.add(new Skybox(gl));

const up = new Vector3(0, 1, 0);

const ca = CreateWebglCanvas(false, canvas);
const plasticTexture = PlasticTexture(ca, 2048, 2048, 15, 0.5, 1, [1, 1, 1]);
// const dirtTexture = DirtTexture(ca, 1024, 1024, 20, 0.1, 0.4, [1, 1, 1]);
// const metalTexture = MetalTexture(ca, 1024, 1024, 20, 0, 0.6, [1, 1, 1]);

class CollidableBox extends BoxCollider
{
    public mesh: Mesh;

    constructor(size: Vector3, material: Material)
    {
        super(gl, new Vector3(), new Quaternion(), size);
        this.mesh = new Mesh(gl, CreateBoxGeometry(...size), material);
        this.add(this.mesh);
    }
}

class CollidableSphere extends SphereCollider
{
    public mesh: Mesh;

    constructor(radius: number, material: Material)
    {
        super(gl, new Vector3(), radius);
        this.mesh = new Mesh(gl, CreateSphereGeometry(radius, 24 * 3, 16 * 3), material);
        this.add(this.mesh);
    }
}

class Trigger
{
    public checkCollision: () => void;
    public enabled = true;
    public collider: Collider;

    constructor(collider: Collider, onTriggerEnter: (trigger: Trigger, dir: Vector3) => void)
    {
        this.collider = collider;
        this.checkCollision = () =>
        {
            if (!this.enabled)
            {
                return;
            }

            const dir = collider.resolveCollision(player.transform.position, playerRadius);
            dir && onTriggerEnter(this, dir);
        };
    }

    public setEnabled(on: boolean)
    {
        this.enabled = on;
        this.collider.visible = on;
    }
}

function HexToColor(hex: string)
{
    const r = Number.parseInt(hex.substring(0, 2), 16) / 255;
    const g = Number.parseInt(hex.substring(2, 4), 16) / 255;
    const b = Number.parseInt(hex.substring(4, 6), 16) / 255;

    return { r, g, b, a: 1 };
}

const solidMaterial: Material = { ...HexToColor("D65647"), textureScale: new Vector3(0.2, 0.2, 0.2) };
const solidSphereMaterial: Material = { ...HexToColor("388DCC"), textureScale: new Vector3(0.2, 0.2, 0.2) };
const elevatorMaterial: Material = { ...HexToColor("ADE617"), textureScale: new Vector3(0.2, 0.2, 0.2) };
const tiltingBlockMaterial: Material = { ...HexToColor("2C5599"), textureScale: new Vector3(0.2, 0.2, 0.2) };
const movingBlockMaterial: Material = { ...HexToColor("E62000"), textureScale: new Vector3(0.2, 0.2, 0.2) };
const trampolineMaterial: Material = { ...HexToColor("1764E6"), textureScale: new Vector3(0.2, 0.2, 0.2), roughness: 0.18 };

const stoneMaterial: Material = { r: 1, g: 1, b: 1, a: 1, textureScale: new Vector3(0.4, 0.4, 0.4) };

interface LevelObject
{
    object: SceneNode;
    onUpdate: ((obj: SceneNode) => void)[];
}

function CreateSimpleCollidableBox(sx: number, sy: number, sz: number, px: number, py: number, pz: number,
    rx: number, ry: number, rz: number, ra: number, material: Material): LevelObject
{
    const box = new CollidableBox(new Vector3(sx, sy, sz), material);
    box.transform.position.setValues(px, py, pz);
    box.transform.rotation.setFromAxisAngle(rx, ry, rz, ra);

    colliders.push(box);

    box.mesh.setTexture(0, plasticTexture.albedo);
    box.mesh.setTexture(1, plasticTexture.normalMap);
    box.mesh.setTexture(2, plasticTexture.roughness);

    const obj: LevelObject = {
        object: box,
        onUpdate: []
    };
    currentLevelObjects.push(obj);
    return obj;
}

function CreateSimpleCollidableSphere(radius: number, px: number, py: number, pz: number, material: Material): LevelObject
{
    const sphere = new CollidableSphere(radius, material);
    sphere.transform.position.setValues(px, py, pz);

    colliders.push(sphere);

    sphere.mesh.setTexture(0, plasticTexture.albedo);
    sphere.mesh.setTexture(1, plasticTexture.normalMap);
    sphere.mesh.setTexture(2, plasticTexture.roughness);

    const obj: LevelObject = {
        object: sphere,
        onUpdate: []
    };
    currentLevelObjects.push(obj);
    return obj;
}

function CreateSawBladeLevelObject(sawSize: number = 3, px: number, py: number, pz: number, angle: number): LevelObject
{
    const sawCollider = new CollidableBox(new Vector3(sawSize, sawSize, 0.2), solidMaterial);
    sawCollider.mesh.visible = false;

    const saw = CreateSawBlade(sawSize * 0.68, gl, null, null, null);

    sawCollider.add(saw);
    sawCollider.transform.position.setValues(px, py, pz);
    sawCollider.transform.rotation.setFromAxisAngle(0, 1, 0, angle);

    const trigger = new Trigger(sawCollider, _ => Restart(RestartReason.SawBlade));
    triggers.push(trigger);

    const obj: LevelObject = {
        object: sawCollider,
        onUpdate: [() => saw.transform.rotation.setFromAxisAngle(0, 0, 1, physicsTime * -10)]
    };
    currentLevelObjects.push(obj);
    return obj;
}

function CreateSpikesLevelObject(countX: number, countY: number, px: number, py: number, pz: number, speed = 2, timeOffset = 0): LevelObject
{
    const collider = new CollidableBox(new Vector3(0.4 * countX, 1.2, 0.4 * countY), solidMaterial);
    collider.mesh.visible = false;

    const spikeMesh = CreateSpikeObject(countX, countY, gl, null, null, null);
    collider.add(spikeMesh);
    collider.transform.position.setValues(px, py, pz);

    const trigger = new Trigger(collider, _ => Restart(RestartReason.Spikes));
    triggers.push(trigger);

    const obj: LevelObject = {
        object: collider,
        onUpdate: []
    };
    Elevator(obj, py - 1.9, py - 0.1, speed, timeOffset);
    currentLevelObjects.push(obj);
    return obj;
}

function CreateTrampolineLevelObject(sx: number, sy: number, sz: number, px: number, py: number, pz: number, material: Material): LevelObject
{
    const box = new CollidableBox(new Vector3(sx, sy, sz), material);
    box.transform.position.setValues(px, py, pz);

    // box.mesh.setTexture(0, plasticTexture.albedo);
    // box.mesh.setTexture(1, plasticTexture.normalMap);
    // box.mesh.setTexture(2, plasticTexture.roughness);

    const trigger = new Trigger(box, Trampoline);
    triggers.push(trigger);

    const obj: LevelObject = {
        object: box,
        onUpdate: [() => box.transform.position.y = py + (1.0 - (Math.sin(physicsTime * 10) * 0.5 + 0.5)) ** 10 * 0.3]
    };
    currentLevelObjects.push(obj);
    return obj;
}

function CreatePowerup(px: number, py: number, pz: number, spriteImage: WebGLTexture, onPickup: () => void): LevelObject
{
    const collider = new SphereCollider(gl, new Vector3(px, py, pz), 0.8);
    collider.renderOrder = 2000;
    const sprite = new Sprite(gl, spriteImage);
    collider.add(sprite);

    triggers.push(new Trigger(collider, trigger => { trigger.setEnabled(false); onPickup(); }));

    const obj: LevelObject = {
        object: collider,
        onUpdate: [() =>
        {
            sprite.transform.rotation.setFromAxisAngle(0, 1, 0, physicsTime * 2);
            sprite.transform.position.y = Math.sin(physicsTime * 3) * 0.1;
        }]
    };
    currentLevelObjects.push(obj);
    return obj;
}

function CreateFinishObject(px: number, py: number, pz: number, angle: number)
{
    const finishWidth = 8;
    const finishHeight = 6;

    const finishMaterial: Material = { r: 0.5, g: 0.3, b: 0.3, a: 1 };

    const borderThickness = 0.3;
    const leftSide = new Mesh(gl, CreateBoxGeometry(borderThickness, finishHeight, borderThickness), finishMaterial);
    const rightSide = new Mesh(gl, CreateBoxGeometry(borderThickness, finishHeight, borderThickness), finishMaterial);
    const top = new Mesh(gl, CreateBoxGeometry(finishWidth - borderThickness, borderThickness, borderThickness), finishMaterial);

    leftSide.transform.position.setValues(-finishWidth / 2, 0, 0);
    rightSide.transform.position.setValues(finishWidth / 2, 0, 0);
    top.transform.position.y = finishHeight / 2 - borderThickness / 2;

    const collider = new BoxCollider(gl, new Vector3(px, py + finishHeight / 2, pz), new Quaternion().setFromAxisAngle(0, 1, 0, angle), new Vector3(finishWidth, finishHeight, 0.01));
    collider.renderOrder = 2000;

    const portal = new Lava(gl, CreateBoxGeometry(finishWidth, finishHeight - borderThickness / 2, 0.01));
    portal.hueShift = 1;
    portal.transform.position.y = -borderThickness / 2;
    collider.add(portal);
    collider.add(leftSide);
    collider.add(rightSide);
    collider.add(top);

    triggers.push(new Trigger(collider, FinishLevel));

    const obj: LevelObject = {
        object: collider,
        onUpdate: []
    };
    currentLevelObjects.push(obj);
    return obj;
}

let currentLevelObjects: LevelObject[] = [];
let colliders: Collider[] = [];
let triggers: Trigger[] = [];

function CreateLevel(levelCreatorFn: () => void)
{
    DestroyLevel();
    levelCreatorFn();
    currentLevelObjects.forEach(obj => scene.add(obj.object));
    currentLevelObjects.forEach(obj => UpdateMatrixForColliders(obj.object));
    Restart(RestartReason.LevelChange);
}

function DestroyLevel()
{
    const destroy = (obj: SceneNode) =>
    {
        scene.remove(obj);
        obj.dispose();
    };

    currentLevelObjects.map(obj => obj.object).forEach(obj => obj.traverse(destroy));
    currentLevelObjects = [];
    colliders = [];
    triggers = [];
}

// note that svgs are flipped, because in webgl y is up, and in svg y is down
// and it's easier to just flip the svgs than to flip them in the shader
const arrowUpSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24px' height='24px' viewBox='0 0 24 24' stroke-width='1' stroke='red' fill='none' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='9'/%3E%3Cpath d='M8 13l4 4m4-4l-4 4M8 8l4 4m4-4l-4 4' stroke='%230f0'/%3E%3C/svg%3E";
const lightningSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24px' height='24px' viewBox='0 0 24 24' stroke-width='1' stroke='red' fill='none' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='9'/%3E%3Cpath fill='%230f0' d='M16 18h-5l-2-6h2L9 6l6 7h-2z'/%3E%3C/svg%3E";

const lightningTexture = await ImageToWebglTexture(gl, 256, 256, lightningSvg);
const arrowUpTexture = await ImageToWebglTexture(gl, 256, 256, arrowUpSvg);

const playerStartingPosition = new Vector3();
let playerStartingRotation = 0;
const lightPositionForLevel = new Vector3();

function Level0()
{
    playerStartingPosition.setValues(0, 1, 0);
    playerStartingRotation = 0;

    // ground
    CreateSimpleCollidableBox(
        20, 1, 20,
        0, -0.6, 0,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableSphere(2, 4, 0.5, 4, stoneMaterial);

    // horizontal moving box
    const box1 = CreateSimpleCollidableBox(
        2, 1, 2,
        3, 1, 0,
        0, 0, 0, 0,
        { ...solidMaterial, r: 0, g: 0, b: 1 }
    );
    box1.onUpdate.push(() => box1.object.transform.position.x = Math.sin(physicsTime * 2) * 2 + 1);

    // vertical moving box
    const box2 = CreateSimpleCollidableBox(
        2, 1, 2,
        2, 0, 1,
        0, 0, 0, 0,
        { ...solidMaterial, r: 0, g: 1, b: 1 }
    );
    box2.onUpdate.push(() => box2.object.transform.position.y = Math.sin(physicsTime * 2) * 3 + 1);

    // spinning box
    const box3 = CreateSimpleCollidableBox(
        10, 10, 1,
        10, 4, 1,
        0, 0, 0, 0,
        { ...solidMaterial, r: 1, g: 0, b: 1 }
    );
    box3.onUpdate.push(() => box3.object.transform.rotation.setFromAxisAngle(1, 0, 0, physicsTime * 4 + Math.sin(physicsTime) * 4 + Math.PI / 2));

    CreateTrampolineLevelObject(2, 1, 2, -2, 0, -2, { ...solidMaterial, r: 1, g: 1, b: 1 });

    CreateSawBladeLevelObject(3,
        0, 2, -2,
        0
    );

    CreatePowerup(-5, 1, -5, lightningTexture, SpeedBoost);
    CreatePowerup(-5, 1, -3, arrowUpTexture, HighJump);

    CreateSpikesLevelObject(10, 10, -5, 0.9, 5);

    CreateFinishObject(0, -0.1, -8, 0);
}

function Elevator(object: LevelObject, min: number, max: number, speed: number, timeOffset = 0, axis = 1)
{
    object.onUpdate.push(() => object.object.transform.position[axis] = Lerp(min, max, Smoothstep(-0.8, 0.8, Math.cos(timeOffset + physicsTime * speed))));
}

function TiltingBlock(object: LevelObject, maxAngle: number, speed: number, axis: number, smoothness = 0.8, timeOffset = 0)
{
    const x = axis === 0 ? 1 : 0;
    const y = axis === 1 ? 1 : 0;
    const z = axis === 2 ? 1 : 0;
    object.onUpdate.push(() => object.object.transform.rotation.setFromAxisAngle(x, y, z,
        Lerp(-maxAngle, maxAngle, Smoothstep(-smoothness, smoothness, Math.cos(timeOffset + physicsTime * speed)))
    ));
}

function Level1()
{
    playerStartingPosition.setValues(0, 30, 0);
    playerStartingRotation = 0;
    lightPositionForLevel.setValues(1, 3, -3);

    CreateSimpleCollidableBox(
        10, 10, 10,
        0, 0, -2,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        3, 10, 3,
        0, 0, -10,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        3, 10, 3,
        4, 0, -14,
        0, 1, 0, Math.PI / 4,
        solidMaterial
    );

    Elevator(CreateSimpleCollidableBox(
        3, 20, 3,
        8, 0, -16,
        0, 0, 0, 0,
        elevatorMaterial
    ), -5, 0, 1);

    CreateSimpleCollidableBox(
        11, 1, 3,
        17, 11, -16,
        0, 0, 1, 0.2,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        2, 20, 1,
        17, 1, -16,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableSphere(
        5,
        28, 2, -16,
        solidMaterial
    );

    CreateSimpleCollidableSphere(
        5,
        28, 9, -16,
        solidSphereMaterial
    );

    CreateSimpleCollidableBox(
        10, 10, 10,
        41, 2, -15,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        2, 10, 2,
        44, 0, -6,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        2, 10, 2,
        44, 0, -1,
        0, 1, 0, Math.PI / 4,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        2, 10, 2,
        47, 0, 3,
        0, 1, 0, Math.PI / 4,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        2, 10, 2,
        41, 0, 3,
        0, 1, 0, Math.PI / 4,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        12, 10, 10,
        44, 1, 9,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateFinishObject(44, 6, 10, 0);
}

function Level3()
{
    playerStartingPosition.setValues(0, 30, 0);
    playerStartingRotation = 0;
    lightPositionForLevel.setValues(1, 3, -3);

    CreateSimpleCollidableBox(
        10, 10, 10,
        0, 0, -2,
        0, 0, 0, 0,
        solidMaterial
    );

    Elevator(CreateSimpleCollidableBox(
        5, 10, 2,
        0, 0, -5.9,
        0, 0, 0, 0,
        elevatorMaterial
    ), 0.01, 5, 3);

    CreateSimpleCollidableBox(
        4, 20, 11,
        0, 0, -18,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSpikesLevelObject(
        10, 5,
        0, 11, -18
    );
    CreateSpikesLevelObject(
        10, 5,
        0, 11, -20,
        2, -1
    );
    CreateSpikesLevelObject(
        10, 5,
        0, 11, -22,
        2, -2
    );

    CreateSimpleCollidableSphere(
        1.2,
        0, 8, -27,
        solidSphereMaterial
    );
    CreateSimpleCollidableSphere(
        1.2,
        0, 8, -31,
        solidSphereMaterial
    );
    CreateSimpleCollidableSphere(
        1.2,
        0, 8, -35,
        solidSphereMaterial
    );
    CreateSimpleCollidableBox(
        1, 15, 1,
        0, 0, -27,
        0, 0, 0, 0,
        solidMaterial
    );
    CreateSimpleCollidableBox(
        1, 15, 1,
        0, 0, -31,
        0, 0, 0, 0,
        solidMaterial
    );
    CreateSimpleCollidableBox(
        1, 15, 1,
        0, 0, -35,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        12, 10, 20,
        0, 0, -50,
        0, 0, 0, 0,
        solidMaterial
    );

    for (let i = 0; i < 10; ++i)
    {
        Elevator(CreateSawBladeLevelObject(
            3,
            0, 5, -50 - i,
            0
        ), -5, 5, 3, -i / 2, 0);
    }

    CreateSimpleCollidableBox(
        10, 1, 10,
        -5, 3, -68,
        0, 0, 1, -0.4,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        10, 5, 20,
        0, -1.5, -80,
        1, 0, 0, 0.2,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        11, 5, 20,
        0, 1, -102,
        0, 0, 0, 0,
        solidMaterial
    );

    for (let i = 0; i < 27; ++i)
    {
        CreateSpikesLevelObject(
            1, 10,
            i * 0.4 - 5.2, 4.5, -97,
            2, i / 3
        );
    }

    CreateFinishObject(0, 3.5, -108, 0);
}

function Level2()
{
    playerStartingPosition.setValues(0, 30, 0);
    playerStartingRotation = 0;
    lightPositionForLevel.setValues(1, 3, -3);

    CreateSimpleCollidableBox(
        10, 10, 10,
        0, 0, -2,
        0, 0, 0, 0,
        solidMaterial
    );

    TiltingBlock(CreateSimpleCollidableBox(
        10, 1, 10,
        0, 5, -14,
        0, 0, 0, 0,
        tiltingBlockMaterial
    ), 0.5, 1, 0, 0.8, -1);

    TiltingBlock(CreateSimpleCollidableBox(
        10, 1, 10,
        0, 15, -14,
        0, 0, 0, 0,
        tiltingBlockMaterial
    ), 0.5, 1, 0, 0.8, -1);

    CreateSimpleCollidableBox(
        0.5, 32, 0.5,
        -5.25, 0, -14,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        0.5, 32, 0.5,
        5.25, 0, -14,
        0, 0, 0, 0,
        solidMaterial
    );

    TiltingBlock(CreateSimpleCollidableBox(
        10, 1, 10,
        0, 10, -24,
        0, 0, 0, 0,
        tiltingBlockMaterial
    ), 0.5, 1, 0, 0.8, -1);

    CreateSimpleCollidableBox(
        0.5, 22, 0.5,
        -5.25, 0, -24,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        0.5, 22, 0.5,
        5.25, 0, -24,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        5, 35, 5,
        10, 0, -8,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        2, 20, 5,
        23, 0, -8,
        0, 0, 1, 0.6,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        2, 20, 5,
        26, 0, -8,
        0, 0, 1, 0.9,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        2, 20, 5,
        30, 0, -8,
        0, 0, 1, 1.2,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        20, 3, 5,
        35, 0, -8,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateTrampolineLevelObject(
        3, 1, 3,
        43, 1.2, -8,
        trampolineMaterial
    );

    const block = CreateSimpleCollidableBox(
        8, 1, 4,
        53, 5, -8,
        0, 0, 0, 0,
        tiltingBlockMaterial
    );

    const side1 = new Mesh(gl, CreateBoxGeometry(8.01, 1.01, 0.3), { r: 0, g: 1, b: 0, a: 1 });
    const side2 = new Mesh(gl, CreateBoxGeometry(8.01, 1.01, 0.3), { r: 0, g: 1, b: 0, a: 1 });
    block.object.add(side1);
    block.object.add(side2);
    side1.transform.position.z = -2.01 + 0.3 / 2;
    side2.transform.position.z = 2.01 - 0.3 / 2;


    TiltingBlock(block, 0.5, 2, 0, 0.2);

    CreateSimpleCollidableBox(
        10, 20, 30,
        60, 0, -28,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        0.5, 0.5, 10,
        57.25, 5, -13,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        6, 5, 10.1,
        58, 12.5, -28,
        0, 0, 0, 0,
        solidMaterial
    );

    for (let i = 0; i < 5; ++i)
    {
        Elevator(CreateSimpleCollidableBox(
            4.5, 4, 2,
            0, 12, i * 2 - 32,
            0, 0, 0, 0,
            movingBlockMaterial
        ), 59, 63, 2, i * 0.5, 0);
    }

    CreateFinishObject(60, 10, -40, 0);
}

function Level4()
{
    playerStartingPosition.setValues(0, 30, 0);
    playerStartingRotation = 0;
    lightPositionForLevel.setValues(-3, 3, -1);

    CreateSimpleCollidableBox(
        10, 10, 20,
        0, 0, -5,
        0, 0, 0, 0,
        solidMaterial
    );

    CreatePowerup(0, 6, -10, arrowUpTexture, HighJump);

    CreateSimpleCollidableBox(
        10, 15, 10,
        0, 5, -25,
        0, 0, 0, 0,
        solidMaterial
    );

    const maxAngle = Math.PI / 2;
    const steps = 7;

    for (let i = 0; i <= steps; ++i)
    {
        const radius = 20;
        const angle = maxAngle * i / steps;
        const x = -Math.sin(maxAngle - angle) * radius;
        const y = -Math.cos(maxAngle - angle) * radius;

        const centerX = 20;
        const centerZ = -35;

        CreateSimpleCollidableSphere(
            1.5,
            centerX + x, 8 + i, centerZ + y,
            solidSphereMaterial
        );
        CreateSimpleCollidableBox(
            1, 15 + i, 1,
            centerX + x, 0 + i * 0.5, centerZ + y,
            0, 0, 0, 0,
            solidMaterial
        );
    }

    Elevator(CreateSimpleCollidableBox(
        1, 30, 1,
        25, 0, -55,
        0, 0, 0, 0,
        elevatorMaterial
    ), 0, 10, 1);

    CreateSimpleCollidableBox(
        10, 50, 10,
        32, 0, -50,
        0, 0, 0, 0,
        solidMaterial
    );
    CreateSimpleCollidableBox(
        30, 40, 5,
        55, 0, -50,
        0, 0, 0, 0,
        solidMaterial
    );

    CreatePowerup(45, 21, -50, lightningTexture, SpeedBoost);
    CreatePowerup(65, 21, -50, lightningTexture, SpeedBoost);

    CreateSimpleCollidableBox(
        10, 35, 5,
        85, 0, -50,
        0, 0, 0, 0,
        solidMaterial
    );

    CreatePowerup(85, 35 / 2 + 1, -50, lightningTexture, SpeedBoost);

    CreateSimpleCollidableBox(
        10, 30, 10,
        100, 0, -40,
        0, 1, 0, Math.PI / 4,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        5, 25, 10,
        100, 0, -20,
        0, 0, 0, 0,
        solidMaterial
    );

    CreatePowerup(100, 25 / 2 + 1, -20, lightningTexture, SpeedBoost);
    CreateSimpleCollidableBox(
        5, 30, 1,
        100, 15, -14,
        1, 0, 0, 0.6,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        10, 25, 30,
        100, 0, 35,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateFinishObject(100, 12.5, 48, 0);
}

function Level5()
{
    playerStartingPosition.setValues(0, 30, 0);
    playerStartingRotation = 0;
    lightPositionForLevel.setValues(1, 3, -3);

    CreateSimpleCollidableBox(
        10, 10, 20,
        0, 0, -5,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        40, 10, 10,
        0, 0, -60,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        20, 10, 11,
        0, 0, -102,
        0, 0, 0, 0,
        solidMaterial
    );

    const createSphere = (px: number, py: number, pz: number, r: number, addSphere = true, rot = 0) =>
    {
        addSphere && CreateSimpleCollidableSphere(
            r,
            px, py, pz,
            solidSphereMaterial
        );
        CreateSimpleCollidableBox(
            1, 15, 1,
            px, py - 7.5, pz,
            0, 1, 0, rot,
            solidMaterial
        );
    };

    let minX = -20;
    let maxX = 20;
    let minY = 2;
    let maxY = 5;
    let minZ = -55;
    let maxZ = -18;
    let minR = 1.2;
    let maxR = 1.8;

    let count = 40;

    let rng = Mulberry32(4);
    for (let i = 0; i < count; ++i)
    {
        createSphere(Lerp(minX, maxX, rng()), Lerp(minY, maxY, rng()), Lerp(minZ, maxZ, rng()), Lerp(minR, maxR, rng()));
    }

    minX = -10;
    maxX = 10;
    maxZ = -65;
    minZ = -95;
    minY = 3;
    rng = Mulberry32(6);
    for (let i = 0; i < count; ++i)
    {
        createSphere(Lerp(minX, maxX, rng()), Lerp(minY, maxY, rng()), Lerp(minZ, maxZ, rng()), 1, false, rng() * Math.PI);
    }

    CreateFinishObject(0, 5, -105, 0);
}

function Level7()
{
    playerStartingPosition.setValues(0, 30, 0);
    playerStartingRotation = 0;
    lightPositionForLevel.setValues(-3, 3, -1);

    CreateSimpleCollidableBox(
        10, 5, 35,
        0, 0, -15,
        0, 0, 0, 0,
        solidMaterial
    );

    for (let i = 0; i < 10; ++i)
    {
        Elevator(CreateSawBladeLevelObject(
            1.5,
            i - 4.5, 2.5, 0,
            Math.PI / -2
        ), -25, -15, 3, i, 2);
    }

    CreateSimpleCollidableBox(
        10, 2, 20,
        0, -1, -45,
        1, 0, 0, 0.2,
        solidMaterial
    );

    CreatePowerup(0, 2, -52, arrowUpTexture, HighJump);

    CreateSimpleCollidableBox(
        5, 20, 5,
        0, 0, -60,
        0, 0, 0, 0,
        solidMaterial
    );
    CreateSimpleCollidableBox(
        5, 35, 5,
        0, 0, -72,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        5, 50, 5,
        10, 0, -72,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        10, 40, 5,
        20, 0, -72,
        0, 0, 0, 0,
        solidMaterial
    );

    CreatePowerup(20, 21, -72, lightningTexture, SpeedBoost);

    CreateSimpleCollidableBox(
        5, 35, 5,
        37, 0, -65,
        0, 1, 0, -0.3,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        5, 30, 5,
        45, 0, -50,
        0, 1, 0, 1,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        5, 25, 5,
        55, 0, -40,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        5, 20, 5,
        55, 0, -25,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateTrampolineLevelObject(
        4.99, 0.5, 4.99,
        55, 10, -25,
        trampolineMaterial
    );

    CreateSimpleCollidableBox(
        10, 20, 5,
        55, 0, -12,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateFinishObject(55, 10, -10, 0);
}

function Level6()
{
    playerStartingPosition.setValues(0, 30, 0);
    playerStartingRotation = 0;
    lightPositionForLevel.setValues(1, 3, 3);

    CreateSimpleCollidableBox(
        10, 5, 30,
        0, 0, -10,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        10, 1, 10,
        0, 7, -20,
        0, 0, 0, 0,
        tiltingBlockMaterial
    ).onUpdate.push(obj => obj.transform.rotation.setFromAxisAngle(0, 0, 1, physicsTime));

    CreateSimpleCollidableBox(
        10, 1, 10,
        8, 14, -20,
        0, 0, 0, 0,
        tiltingBlockMaterial
    ).onUpdate.push(obj => obj.transform.rotation.setFromAxisAngle(0, 0, 1, -physicsTime + Math.PI / 2));

    CreateSimpleCollidableBox(
        10, 1, 10,
        0, 21, -20,
        0, 0, 0, 0,
        tiltingBlockMaterial
    ).onUpdate.push(obj => obj.transform.rotation.setFromAxisAngle(0, 0, 1, physicsTime));

    CreateSimpleCollidableBox(
        0.5, 50, 0.5,
        0, 0, -25.25,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        0.5, 50, 0.5,
        0, 0, -14.75,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        0.5, 30, 0.5,
        8, 0, -25.25,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        0.5, 30, 0.5,
        8, 0, -14.75,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        10, 1, 10,
        -10, 25, -20,
        0, 0, 0, 0,
        solidMaterial
    );
    CreateSimpleCollidableBox(
        1, 50, 1,
        -10, 0, -20,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        40, 50, 10,
        -36, 0, -20,
        0, 0, 0, 0,
        solidMaterial
    );

    Elevator(CreateSimpleCollidableBox(
        10, 10, 10,
        -26, 30, 0,
        0, 0, 0, 0,
        movingBlockMaterial
    ), -24, -16, 1.2, 0, 2);

    Elevator(CreateSimpleCollidableBox(
        2, 10, 5,
        -50, 0, -20,
        0, 0, 0, 0,
        elevatorMaterial
    ), 20.01, 30, 3);

    CreateSimpleCollidableBox(
        1, 90, 10,
        -60, 0, -20,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        1, 70, 10,
        -70, 0, -20,
        0, 0, 0, 0,
        solidMaterial
    );

    for (let i = 0; i < 10; ++i)
    {
        CreateSawBladeLevelObject(
            3,
            -60, 45, -20 - 4.5 + i,
            0
        );

        CreateSawBladeLevelObject(
            3,
            -70, 35, -20 - 4.5 + i,
            0
        );
    }

    CreateSimpleCollidableBox(
        2, 60, 10,
        -65, 0, -20,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateTrampolineLevelObject(
        1.99, 0.5, 9.99,
        -65, 30, -20,
        trampolineMaterial
    );

    CreateSimpleCollidableBox(
        20, 50, 10,
        -85, 0, -20,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateFinishObject(-94, 25, -20, Math.PI / 2);
}

function Level8()
{
    playerStartingPosition.setValues(0, 30, -2);
    playerStartingRotation = Math.PI;
    lightPositionForLevel.setValues(3, 3, -1);

    CreateSimpleCollidableBox(
        10, 5, 20,
        0, 0, 5,
        0, 0, 0, 0,
        solidMaterial
    );

    Elevator(CreateSimpleCollidableBox(
        5, 10, 2,
        0, 0, 10,
        0, 0, 0, 0,
        elevatorMaterial
    ), -2.49, 7, 4);

    CreateSimpleCollidableBox(
        1, 50, 10,
        -5.5, 0, 10,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        1, 50, 10,
        5.5, 0, 10,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        12, 50, 1,
        0, 0, 15.5,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        12, 15, 1,
        0, 17.5, 4.5,
        0, 0, 0, 0,
        solidMaterial
    );

    for (let i = 0; i < 10; ++i)
    {
        Elevator(CreateSawBladeLevelObject(
            3,
            4.5 - i, 20, 0,
            Math.PI / 2
        ), 6, 14, 3.23, 0, 2);
    }

    Elevator(CreateSimpleCollidableBox(
        10, 0.3, 0.3,
        0, 20, 0,
        0, 0, 0, 0,
        elevatorMaterial
    ), 6, 14, 3.23, 0, 2);

    CreateSimpleCollidableBox(
        10, 40, 10,
        0, 0, 20,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        1, 80, 10,
        -5.5, 0, 35,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        1, 80, 10,
        5.5, 0, 35,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        12, 55, 1,
        0, 0, 29.5,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        12, 31, 1,
        0, 24.5, 40.5,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        10, 5, 80,
        0, 0, 70,
        0, 0, 0, 0,
        solidMaterial
    );

    CreatePowerup(0, 21, 24, arrowUpTexture, HighJump);

    Elevator(CreateSimpleCollidableBox(
        10, 0.3, 0.3,
        0, 25, 0,
        0, 0, 0, 0,
        elevatorMaterial
    ), 31, 39, 3.23, 0, 2);

    Elevator(CreateSimpleCollidableBox(
        0.3, 0.3, 10,
        0, 20, 35,
        0, 0, 0, 0,
        elevatorMaterial
    ), -4, 4, 3.23, 1, 0);

    Elevator(CreateSimpleCollidableBox(
        10, 0.3, 0.3,
        0, 15, 0,
        0, 0, 0, 0,
        elevatorMaterial
    ), 31, 39, 3.23, 2, 2);

    Elevator(CreateSimpleCollidableBox(
        0.3, 0.3, 10,
        0, 10, 35,
        0, 0, 0, 0,
        elevatorMaterial
    ), -4, 4, 3.23, 3, 0);

    for (let i = 0; i < 10; ++i)
    {
        Elevator(CreateSawBladeLevelObject(
            3,
            4.5 - i, 25, 0,
            Math.PI / 2
        ), 31, 39, 3.23, 0, 2);

        Elevator(CreateSawBladeLevelObject(
            3,
            0, 20, 39.5 - i,
            0
        ), -4, 4, 3.23, 1, 0);

        Elevator(CreateSawBladeLevelObject(
            3,
            4.5 - i, 15, 0,
            Math.PI / 2
        ), 31, 39, 3.23, 2, 2);

        Elevator(CreateSawBladeLevelObject(
            3,
            0, 10, 39.5 - i,
            0
        ), -4, 4, 3.23, 3, 0);
    }

    CreatePowerup(0, 3.5, 45, lightningTexture, SpeedBoost);

    for (let i = 0; i < 100; ++i)
    {
        CreateSpikesLevelObject(
            25, 1,
            0, 3.5, 50 + i * 0.4,
            10, -i / 3
        );
    }

    CreateFinishObject(0, 2.5, 108, 0);
}

const levels: (() => void)[] = [
    // Level0,
    Level1,
    Level2,
    Level3,
    Level4,
    Level5,
    Level6,
    Level7,
    Level8
];

let currentLevel = 0;

const lava = new Lava(gl, CreateBoxGeometry(1000, 1, 1000));
lava.transform.position.y = -1;
scene.add(lava);

function CheckLava()
{
    if (player.transform.position.y - playerRadius < lava.transform.position.y + 0.5)
    {
        Restart(RestartReason.Lava);
    }
}

const player = new Mesh(gl, { vertices: new Float32Array(), triangles: new Uint32Array(), normals: new Float32Array() }, solidMaterial);
scene.add(player);

const playerRadius = 0.4;

const camera = new Camera(gl);
camera.transform.position.y = 1.5;
// camera.transform.position.z = 0.05; // pull back the camera a bit
player.add(camera);

function Resize()
{
    const fov = 80;
    camera.setProjectionMatrixPerspecive(fov, (canvas.width = window.innerWidth) / (canvas.height = window.innerHeight), 0.1, 200);
}

Resize();
window.addEventListener("resize", Resize);

let left = 0;
let right = 0;
let forward = 0;
let backwards = 0;
let jump = 0;
window.addEventListener("keydown", ev =>
{
    switch (ev.code)
    {
        case "KeyW": forward = 1; break;
        case "KeyA": left = 1; break;
        case "KeyS": backwards = 1; break;
        case "KeyD": right = 1; break;
        case "Space": jump = 1; break;
    }
});

window.addEventListener("keyup", ev =>
{
    switch (ev.code)
    {
        case "KeyW": forward = 0; break;
        case "KeyA": left = 0; break;
        case "KeyS": backwards = 0; break;
        case "KeyD": right = 0; break;
        case "Space": jump = 0; break;
    }
});

let locked: Element | null = null;
canvas.addEventListener("click", _ =>
{
    canvas.requestPointerLock();
});

document.addEventListener("pointerlockchange", _ =>
{
    locked = document.pointerLockElement;
});

let pitch = 0;
let yaw = 0;

function UpdateCamera()
{
    player.transform.rotation.setFromAxisAngle(0, 1, 0, yaw);
    camera.transform.rotation.setFromAxisAngle(1, 0, 0, pitch);
}

window.addEventListener("mousemove", ev =>
{
    if (!locked)
    {
        return;
    }

    const sensitivity = 0.002;
    const { movementX, movementY } = ev;
    yaw -= movementX * sensitivity;
    pitch = Clamp(pitch - movementY * sensitivity, -Math.PI / 2, Math.PI / 2);

    UpdateCamera();
});

// if the fixed delta time is precisely equal to the framerate,
// then it'll start jittering on firefox, because of the timer resolution
// frame 0: 16.666 ms, which is < 16.66666666666666, so no physics frames are processed
// frame 1: 16.666 ms again, 33.332 in total, which is >= 16.66666666666666, so 1 physics frame is processed
//          we still have 16.665333333333333333 remaining
// frame 2: 16.668 ms, which is exactly 33.3333333333, so process 2 frames
// this keeps repeating, which means we don't update physics for 1 frame, then update it once next frame,
// then update it twice next frame (effectively having a weird 20fps and 40fps combination, which looks bad)
// to fix this, just make sure that the physics timer goes a little bit faster (or slower)
// by using 60.001 fps for physics, we'll only have 1 extra physics frame once every ~60000 rendered frames
// (this is all assuming 60 fps for rendering)
const fixedDeltaTime = 1 / 60.001;
const playerVelocity = new Vector3();
const gravity = -0.3;
let onGround = false;
const jumpVelocity = 0.1;
const highJumpVelocity = 0.3;

function Trampoline()
{
    playerVelocity.y = 0.3;
}

const enum PowerupType
{
    SpeedBoost, HighJump
}

let powerupType = PowerupType.SpeedBoost;
const powerupMaxDuration = 5;
let powerupDuration = 0;

const powerupContainer = document.getElementById("powerup-container")!;
const powerupBar = document.getElementById("powerup-bar")!;
const powerupTextElement = document.getElementById("powerup-text")!;
let powerupText = "";

function SpeedBoost()
{
    powerupDuration = powerupMaxDuration;
    powerupType = PowerupType.SpeedBoost;
    powerupText = "Speed boost";
    powerupContainer.style.opacity = "1";
}

function HighJump()
{
    powerupDuration = powerupMaxDuration;
    powerupType = PowerupType.HighJump;
    powerupText = "High jump";
    powerupContainer.style.opacity = "1";
}

function UpdateMatrixForColliders(node: SceneNode)
{
    node.traverse(child => child instanceof Collider && child.updateMatrix());
}

let prevMaxSpeed = 0;
function UpdatePhysics()
{
    const now = physicsTime;

    // call update, also update matrix if the object is dynamic
    currentLevelObjects.forEach(obj =>
    {
        obj.onUpdate.forEach(fn => fn(obj.object));
        obj.onUpdate.length > 0 && UpdateMatrixForColliders(obj.object);
    });

    lava.transform.position.y = now * 0.1 - 3;

    // powerups
    powerupDuration = Math.max(powerupDuration - fixedDeltaTime, 0);

    const hasSpeedBoost = powerupDuration > 0 && powerupType === PowerupType.SpeedBoost;
    const hasHighJump = powerupDuration > 0 && powerupType === PowerupType.HighJump;

    powerupContainer.style.opacity = powerupDuration > 0 ? "1" : "0";
    powerupBar.style.width = powerupDuration / powerupMaxDuration * 100 + "%";
    powerupTextElement.textContent = powerupText + " - " + powerupDuration.toFixed(1);

    // calculate force from inputs
    const maxSpeed = hasSpeedBoost ? 0.2 : 0.08;
    const currentMaxSpeed = Lerp(prevMaxSpeed, maxSpeed, 0.1);
    prevMaxSpeed = currentMaxSpeed;

    const speed = hasSpeedBoost ? 3 : 1;
    const airSpeed = speed / 8;

    const rightMovement = right - left;
    const forwardMovement = forward - backwards;

    const force = new Vector3(rightMovement, 0, -forwardMovement)
        .safeNormalize()
        .mulScalar(onGround ? speed : airSpeed)
        .applyQuaternion(player.transform.rotation)
        .mulScalar(fixedDeltaTime);

    playerVelocity.add(force);
    const prevY = playerVelocity.y;
    playerVelocity.y = 0;

    // limit speed and decelerate
    const currentSpeed = playerVelocity.length;

    // higher number = decelerate faster
    const decelerationRateOnGround = 10;
    const decelerationRateInAir = 1;
    const decelerationRate = onGround ? decelerationRateOnGround : decelerationRateInAir;

    playerVelocity.safeNormalize().mulScalar(Math.min(currentSpeed * (1 - fixedDeltaTime * decelerationRate), currentMaxSpeed));

    playerVelocity.y = Math.max(prevY + gravity * fixedDeltaTime, -0.5);

    if (jump && onGround)
    {
        onGround = false;
        playerVelocity.y = Math.max(playerVelocity.y, hasHighJump ? highJumpVelocity : jumpVelocity);
    }

    const prevPosition = player.transform.position.clone();
    player.transform.position.add(playerVelocity);

    let hasCollisionWithGround = false;

    for (const coll of colliders)
    {
        const offset = coll.resolveCollision(player.transform.position, playerRadius);
        if (offset)
        {
            player.transform.position.add(offset);

            if (offset.clone().normalize().dot(up) > 0.1)
            {
                // TODO?: don't slide when this is true, or maybe it's a feature?
                playerVelocity.y = Math.max(playerVelocity.y, 0);
                hasCollisionWithGround = true;
            }
        }
    }

    onGround = hasCollisionWithGround;

    // keep momentum
    playerVelocity.copyFrom(player.transform.position).sub(prevPosition);

    triggers.forEach(t => t.checkCollision());
    CheckLava();
}

let running = true;
let lastTime = 0;
let accumulatedTime = 0;
let physicsTime = 0;
const maxAccumulatedTime = fixedDeltaTime * 5;
function Render(now: number)
{
    requestAnimationFrame(Render);

    if (!running)
    {
        return;
    }

    // ms -> seconds
    now /= 1000;

    const delta = now - lastTime;
    lastTime = now;
    accumulatedTime = Math.min(accumulatedTime + delta, maxAccumulatedTime);
    while (accumulatedTime > fixedDeltaTime)
    {
        physicsTime += fixedDeltaTime;
        accumulatedTime -= fixedDeltaTime;
        UpdatePhysics();
    }

    scene.playerPosition.copyFrom(player.transform.position);
    running && scene.renderScene(camera);
}

requestAnimationFrame(Render);

const enum RestartReason
{
    ManualRestart,
    LevelChange,
    SawBlade,
    Spikes,
    Lava
}

const overlay = document.getElementById("overlay")!;
const deathText = document.getElementById("death-text")!;
const deathText2 = document.getElementById("inner")!;

let justStarted = true;
async function Restart(reason: RestartReason)
{
    powerupContainer.style.opacity = "0";
    running = false;

    if (true) // debug
    {
        if (reason === RestartReason.Lava)
        {
            overlay.classList.add("lava");
        }
        else
        {
            overlay.classList.add("dead");
        }

        switch (reason)
        {
            case RestartReason.Lava:
                deathText.textContent = "You burned in lava";
                break;
            case RestartReason.SawBlade:
                deathText.textContent = "You were sliced by saw blades";
                break;
            case RestartReason.Spikes:
                deathText.textContent = "You were impaled by spikes";
                break;
            case RestartReason.LevelChange:
                deathText.textContent = "You survive... for now";
                break;
        }

        deathText.classList.add("visible");

        if (reason === RestartReason.LevelChange)
        {
            deathText2.style.display = "none";

            if (justStarted)
            {
                deathText.textContent = "Welcome to the Deadly™ Obstacle Course!\n\nAre you ready to die?\n\n\n(Click to begin)";

                while (!locked)
                {
                    await new Promise(requestAnimationFrame);
                }
            }
            else if (currentLevel === 4)
            {
                deathText.textContent = "Congratulations! You've completed...";
                deathText2.style.display = "";
                deathText2.textContent = "...the easy levels! Let's increase the difficulty a bit, shall we?\n\n\n(Click to continue)";

                await new Promise(res => setTimeout(res, 1500));
                deathText2.classList.add("visible");

                await new Promise<void>(resolve =>
                {
                    const clicked = () =>
                    {
                        window.removeEventListener("click", clicked);
                        resolve();
                    };
                    window.addEventListener("click", clicked);
                });

                justStarted = true; // to skip the waiting
            }
            else if (currentLevel === levels.length)
            {
                deathText.textContent = "Congratulations! You've completed all the levels!\n\nIt wasn't so hard, was it?";
                deathText2.style.display = "";
                deathText2.textContent = "Thanks for playing!";

                await new Promise(res => setTimeout(res, 2500));
                deathText2.classList.add("visible");

                await new Promise(_ => { }); // don't continue
            }
        }
        else
        {
            const texts = [
                "Anyways", "Try again", "Sigh", "Don't let this happen again", "Pathetic",
                "You can do better than this", "I expected more from you", "Again", "Try harder"
            ];
            deathText2.textContent = texts[Math.random() * texts.length | 0] + "...";
        }

        if (justStarted)
        {
            justStarted = false;
        }
        else
        {
            await new Promise(res => setTimeout(res, 1300));

            deathText2.classList.add("visible");
            // overlay.classList.remove("lava");
            // overlay.classList.add("dead");
            await new Promise(res => setTimeout(res, 1300));
        }

        deathText.classList.remove("visible");
        deathText2.classList.remove("visible");
        overlay.classList.remove("dead");
        overlay.classList.remove("lava");
        overlay.classList.add("respawn");

        await new Promise(res => setTimeout(res, 700));

        deathText2.style.display = "";
    }

    running = true;

    accumulatedTime = fixedDeltaTime + 0.001;
    physicsTime = -1.99;

    triggers.forEach(t => t.setEnabled(true));

    scene.light.transform.position.copyFrom(lightPositionForLevel);
    player.transform.position.copyFrom(playerStartingPosition);
    playerVelocity.setValues(0, -0.5, 0);
    pitch = 0;
    yaw = playerStartingRotation;
    prevMaxSpeed = 0;

    powerupDuration = 0;

    UpdateCamera();

    overlay.classList.remove("dead");
    overlay.classList.remove("respawn");
    deathText2.classList.remove("visible");
}

async function FinishLevel()
{
    ++currentLevel;
    if (currentLevel < levels.length - 1)
    {
        CreateLevel(levels[currentLevel]);
    }
    else
    {
        Restart(RestartReason.LevelChange);
    }
}

// window.addEventListener("keydown", ev =>
// {
//     if (ev.code === "ArrowLeft")
//     {
//         currentLevel = Math.max(0, currentLevel - 1);
//         CreateLevel(levels[currentLevel]);
//     }
//     if (ev.code === "ArrowRight")
//     {
//         currentLevel = Math.min(levels.length - 1, currentLevel + 1);
//         CreateLevel(levels[currentLevel]);
//     }
//     ev.code === "Enter" && Restart(RestartReason.ManualRestart);
// });

CreateLevel(levels[currentLevel]);
