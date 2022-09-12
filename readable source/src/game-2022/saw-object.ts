import { CreateExtrudedGeometryConvex, Geometry, JoinGeometries } from "../scenegraph/geometry.js";
import { Material } from "../scenegraph/material.js";
import { Mesh } from "../scenegraph/mesh.js";
import { Quaternion, Vector3 } from "../util/linear.js";

export function CreateSawBlade(size: number, gl: WebGL2RenderingContext,
    albedo: WebGLTexture | null, normalMap: WebGLTexture | null, roughnessMap: WebGLTexture | null)
{
    const material: Material = {
        r: 1,
        g: 1,
        b: 1,
        a: 1,
        metallic: 0.8,
        roughness: 0.3,
        textureScale: new Vector3().setScalar(0.5)
    };

    const radius = 0.4;
    const discSegments = 24;
    const discThickness = 0.2 / size;
    const numTeeth = 8;
    const toothThickness = 0.04 / size;
    const toothInset = 0.1;

    const discOutline: number[] = [];
    for (let i = 0; i < discSegments; ++i)
    {
        const angle = 2 * Math.PI * i / discSegments;
        const x = Math.sin(angle);
        const y = Math.cos(angle);
        discOutline.push(x * radius, y * radius);
    }

    const discGeometry = CreateExtrudedGeometryConvex(discOutline, discThickness);
    const toothGeometry = CreateExtrudedGeometryConvex([
        -0.2, 0,
        0.1, 0.4,
        0.3, 0.4,
        0.2, 0.2,
        0.2, 0
    ], toothThickness);

    discGeometry.vertices = discGeometry.vertices.map(v => v * size)
    toothGeometry.vertices = toothGeometry.vertices.map(v => v * size)

    const toothGeometries: Geometry[] = [];

    for (let i = 0; i < numTeeth; ++i)
    {
        const angle = 2 * Math.PI * i / numTeeth;
        const x = Math.sin(angle);
        const y = Math.cos(angle);
        const rotation = new Quaternion().setFromAxisAngle(0, 0, -1, angle);
        const position = new Vector3(x * (radius - toothInset), y * (radius - toothInset), 0).mulScalar(size);

        // @ts-ignore
        const tooth: Geometry = structuredClone(toothGeometry);
        for (let i = 0; i < tooth.vertices.length; i += 3)
        {
            const normal = new Vector3(...tooth.normals.subarray(i, i + 3))
                .applyQuaternion(rotation);
            const vertex = new Vector3(...tooth.vertices.subarray(i, i + 3))
                .applyQuaternion(rotation)
                .add(position);
            tooth.normals.set(normal, i);
            tooth.vertices.set(vertex, i);
        }

        toothGeometries.push(tooth);
    }

    const discObject = new Mesh(gl, JoinGeometries(discGeometry, ...toothGeometries), material);
    discObject.setTexture(0, albedo);
    discObject.setTexture(1, normalMap);
    discObject.setTexture(2, roughnessMap);

    return discObject;
}
