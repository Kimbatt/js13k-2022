import { Geometry, JoinGeometries } from "../scenegraph/geometry.js";
import { Material } from "../scenegraph/material.js";
import { Mesh } from "../scenegraph/mesh.js";
import { Vector3 } from "../util/linear.js";

export function CreateSpikeObject(countX: number, countY: number, gl: WebGL2RenderingContext,
    albedo: WebGLTexture | null, normalMap: WebGLTexture | null, roughnessMap: WebGLTexture | null): Mesh
{
    const material: Material = {
        r: 1,
        g: 1,
        b: 1,
        a: 1,
        metallic: 0.8,
        roughness: 0.3,
        textureScale: new Vector3().setScalar(1)
    };

    const spikeRadius = 0.2;
    const spikeHeight = 2;

    const radiusSegments = 8;

    const vertices: number[] = [];
    const normals: number[] = [];

    for (let i = 0; i <= radiusSegments; ++i)
    {
        const angle = 2 * Math.PI * i / radiusSegments;
        const x = Math.sin(angle);
        const y = Math.cos(angle);
        vertices.push(
            x * spikeRadius, -spikeHeight / 2, y * spikeRadius,
            0, spikeHeight / 2, 0 // also add an extra vertex for normal
        );

        normals.push(x, 0, y, x, 0, y);
    }

    const triangles: number[] = [];
    for (let i = 0; i < radiusSegments; ++i)
    {
        triangles.push(i * 2 + 2, i * 2 + 1, i * 2);
    }

    const geometry: Geometry = {
        vertices: new Float32Array(vertices),
        triangles: new Uint32Array(triangles),
        normals: new Float32Array(normals)
    };

    const geometries: Geometry[] = [];
    for (let i = 0; i < countX; ++i)
    {
        const offsetX = (i * 2 + 1 - countX) * spikeRadius;
        for (let j = 0; j < countY; ++j)
        {
            const offsetY = (j * 2 + 1 - countY) * spikeRadius;

            // @ts-ignore
            const currentGeometry: Geometry = structuredClone(geometry);
            for (let k = 0; k < currentGeometry.vertices.length; k += 3)
            {
                currentGeometry.vertices[k] += offsetX;
                currentGeometry.vertices[k + 2] += offsetY;
            }

            geometries.push(currentGeometry);
        }
    }

    const mesh = new Mesh(gl, JoinGeometries(...geometries), material);
    mesh.setTexture(0, albedo);
    mesh.setTexture(1, normalMap);
    mesh.setTexture(2, roughnessMap);
    return mesh;
}
