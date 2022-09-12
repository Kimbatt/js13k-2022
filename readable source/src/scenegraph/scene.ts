import { Matrix4x4, Quaternion, Vector3 } from "../util/linear.js";
import { GetOrCreateShadowProgram } from "./material.js";
import { Transform } from "./transform.js";

export const enum RenderMode
{
    Normal, Shadow
}

export interface ViewMatrices
{
    viewMatrix: Matrix4x4;
    viewProjectionMatrix: Matrix4x4;
    cameraPosition: Vector3;
    playerPosition: Vector3;
}

export class SceneNode
{
    public gl: WebGL2RenderingContext;
    public children = new Set<SceneNode>();
    protected parent: SceneNode | null = null;
    public transform = new Transform();

    public visible = true;
    public renderOrder = 0;

    constructor(gl: WebGL2RenderingContext)
    {
        this.gl = gl;
    }

    public add(node: SceneNode)
    {
        this.children.add(node);
        node.parent = this;
    }

    public remove(node: SceneNode)
    {
        this.children.delete(node);
        node.parent = null;
    }

    public setParent(parent?: SceneNode)
    {
        this.parent?.remove(this);
        parent?.add(this);
    }

    public traverse(callback: (node: SceneNode) => void)
    {
        callback(this);
        this.children.forEach(callback);
    }

    public localToWorldMatrix(): Matrix4x4
    {
        const mat = this.transform.matrix();
        return this.parent?.localToWorldMatrix().clone().multiply(mat) ?? mat.clone();
    }

    public worldToLocalMatrix(): Matrix4x4
    {
        // TODO: test this to make sure this is correct
        // seems to work without parents, but not tested with parents
        const mat = this.transform.matrixInverse();
        return this.parent?.worldToLocalMatrix().clone().preMultiply(mat) ?? mat.clone();
    }

    public get worldPosition()
    {
        return this.transform.position.clone().applyMatrix4x4(this.localToWorldMatrix());
    }

    public render(_mode: RenderMode, _viewMatrices: ViewMatrices, _worldMatrix: Matrix4x4, _light: DirectionalLight) { }

    public dispose() { }
}

export class Camera extends SceneNode
{
    public projectionMatrix = new Matrix4x4();

    public setProjectionMatrixPerspecive(fov = 75, aspect = 1, near = 0.01, far = 100)
    {
        //                          to radian, x0.5
        const top = near * Math.tan(0.00872664626 * fov);
        const height = 2 * top;
        const width = aspect * height;
        const left = width / -2;
        this.projectionMatrix.makePerspective(left, left + width, top, top - height, near, far);
    }

    public setProjectionMatrixOrthographic(width = 4, height = 4, near = 0.01, far = 100)
    {
        const dx = width / 2;
        const dy = height / 2;
        this.projectionMatrix.makeOrthographic(-dx, dx, dy, -dy, near, far);
    }
}

export class DirectionalLight extends Camera
{
    public depthFrameBuffer: WebGLFramebuffer;
    public depthTexture: WebGLTexture;
    public depthMVP = new Matrix4x4();
    public resolution: number;
    public worldMatLocation: WebGLUniformLocation;
    public target = new Vector3();

    constructor(gl: WebGL2RenderingContext, size: number)
    {
        super(gl);

        this.resolution = Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE), 2048);

        const near = -150;
        const far = 150;
        this.setProjectionMatrixOrthographic(size, size, near, far);

        this.depthFrameBuffer = gl.createFramebuffer()!;
        this.depthTexture = gl.createTexture()!;

        gl.bindTexture(gl.TEXTURE_2D, this.depthTexture);
        // use DEPTH_STENCIL for higher depth precision
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH24_STENCIL8, this.resolution, this.resolution, 0, gl.DEPTH_STENCIL, gl.UNSIGNED_INT_24_8, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.depthFrameBuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.TEXTURE_2D, this.depthTexture, 0);

        this.worldMatLocation = GetOrCreateShadowProgram(gl).uniformLocations.get("worldMat")!;
    }

    public prepare(camera: Camera, centerDistanceFromCamer: number)
    {
        const lightDirection = this.transform.position.clone().sub(this.target).normalize();

        const frustumCenter = new Vector3(0, 0, -centerDistanceFromCamer).applyMatrix4x4(camera.localToWorldMatrix());
        const lightView = new Matrix4x4().lookAt(frustumCenter.clone().add(lightDirection), frustumCenter, new Vector3(0, 1, 0));

        this.depthMVP.copy(this.projectionMatrix).multiply(lightView);
        const shadowProgram = GetOrCreateShadowProgram(this.gl);
        this.gl.useProgram(shadowProgram.program);
        this.gl.uniformMatrix4fv(shadowProgram.uniformLocations.get("depthMVP")!, false, this.depthMVP);
    }
}

export class Scene extends SceneNode
{
    public light: DirectionalLight;
    public playerPosition = new Vector3();

    constructor(gl: WebGL2RenderingContext)
    {
        super(gl);

        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);

        this.light = new DirectionalLight(gl, 70);
        this.light.transform.position.setValues(0, 1, 1);
    }

    public renderScene(camera: Camera)
    {
        // shadow maps first
        this.gl.viewport(0, 0, this.light.resolution, this.light.resolution);
        // this.gl.cullFace(this.gl.FRONT);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.light.depthFrameBuffer);
        this.gl.clear(this.gl.DEPTH_BUFFER_BIT);
        this.light.prepare(camera, 35);
        this.renderSceneInternal(this.light, RenderMode.Shadow, this.light);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        // this.gl.cullFace(this.gl.BACK);

        // normal render
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        this.gl.clearColor(0, 0, 0, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.renderSceneInternal(camera, RenderMode.Normal, this.light);
    }

    private renderSceneInternal(camera: Camera, mode: RenderMode, light: DirectionalLight)
    {
        const viewMatrix = camera.worldToLocalMatrix();
        const viewProjectionMatrix = camera.projectionMatrix.clone().multiply(viewMatrix);

        const viewMatrices: ViewMatrices = { viewMatrix, viewProjectionMatrix, cameraPosition: camera.worldPosition, playerPosition: this.playerPosition };

        const renderNode = (node: SceneNode, worldMatrix: Matrix4x4) =>
        {
            if (!node.visible)
            {
                return;
            }

            const currentWorldMatrix = worldMatrix.clone().multiply(node.transform.matrix());
            node.render(mode, viewMatrices, currentWorldMatrix, light);
            [...node.children]
                .sort((a, b) => a.renderOrder - b.renderOrder)
                .forEach(c => renderNode(c, currentWorldMatrix));
        };

        renderNode(this, this.localToWorldMatrix());
    }
}
