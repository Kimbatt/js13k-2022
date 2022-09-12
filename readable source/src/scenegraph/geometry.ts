import { Vector2 } from "../util/linear.js";

export interface Geometry
{
    vertices: Float32Array;
    triangles: Uint32Array;
    normals: Float32Array;
}

export function JoinGeometries(...geometries: Geometry[]): Geometry
{
    const vertices: number[] = [];
    const triangles: number[] = [];
    const normals: number[] = [];

    for (const geometry of geometries)
    {
        const startIndex = vertices.length / 3;
        vertices.push(...geometry.vertices);
        normals.push(...geometry.normals);
        triangles.push(...geometry.triangles.map(tri => tri + startIndex));
    }

    return { vertices: new Float32Array(vertices), triangles: new Uint32Array(triangles), normals: new Float32Array(normals) };
}

export function CreateBoxGeometry(width = 1, height = 1, depth = 1): Geometry
{
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const halfDepth = depth / 2;

    const vertices = new Float32Array([
        // back
        -halfWidth, -halfHeight, -halfDepth,
        halfWidth, -halfHeight, -halfDepth,
        -halfWidth, halfHeight, -halfDepth,
        halfWidth, halfHeight, -halfDepth,

        // front
        halfWidth, -halfHeight, halfDepth,
        -halfWidth, -halfHeight, halfDepth,
        halfWidth, halfHeight, halfDepth,
        -halfWidth, halfHeight, halfDepth,

        // bottom
        halfWidth, -halfHeight, -halfDepth,
        -halfWidth, -halfHeight, -halfDepth,
        halfWidth, -halfHeight, halfDepth,
        -halfWidth, -halfHeight, halfDepth,

        // top
        -halfWidth, halfHeight, -halfDepth,
        halfWidth, halfHeight, -halfDepth,
        -halfWidth, halfHeight, halfDepth,
        halfWidth, halfHeight, halfDepth,

        // left
        -halfWidth, -halfHeight, -halfDepth,
        -halfWidth, halfHeight, -halfDepth,
        -halfWidth, -halfHeight, halfDepth,
        -halfWidth, halfHeight, halfDepth,

        // right
        halfWidth, halfHeight, -halfDepth,
        halfWidth, -halfHeight, -halfDepth,
        halfWidth, halfHeight, halfDepth,
        halfWidth, -halfHeight, halfDepth,
    ]);

    const triangles = new Uint32Array([
        0,
        0 + 3,
        0 + 1,
        0,
        0 + 2,
        0 + 3,

        4,
        4 + 3,
        4 + 1,
        4,
        4 + 2,
        4 + 3,

        8,
        8 + 3,
        8 + 1,
        8,
        8 + 2,
        8 + 3,

        12,
        12 + 3,
        12 + 1,
        12,
        12 + 2,
        12 + 3,

        16,
        16 + 3,
        16 + 1,
        16,
        16 + 2,
        16 + 3,

        20,
        20 + 3,
        20 + 1,
        20,
        20 + 2,
        20 + 3,
    ]);

    const normals = new Float32Array([
        // front
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,

        // back
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,

        // bottom
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,

        // top
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,

        // left
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,

        // right
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
    ]);

    return { vertices, triangles, normals };
}

export function CreateSphereGeometry(radius = 1, horizontalSubdivisions = 16, verticalSubdivisions = 24): Geometry
{
    // just convert normals to vertices later by multiplying with the radius
    const normals: number[] = [];
    const triangles: number[] = [];

    // note: the geometry is not closed, and contains degenerate triangles at the poles
    // but this allows the code to be smaller, and it doesn't affect the rendering anyways

    // TODO: make sure this works properly

    for (let i = 0; i < horizontalSubdivisions; ++i)
    {
        const angleY = -Math.PI / 2 + Math.PI * i / (horizontalSubdivisions - 1);
        const yCoord = Math.sin(-angleY);
        const yMultiplier = Math.cos(-angleY);

        for (let j = 0; j < verticalSubdivisions; ++j)
        {
            const angleXZ = 2 * Math.PI * j / (verticalSubdivisions - 1);
            normals.push(Math.cos(angleXZ) * yMultiplier, yCoord, Math.sin(angleXZ) * yMultiplier);
        }
    }

    // triangles
    for (let i = 0; i < horizontalSubdivisions; ++i)
    {
        const startIndex = i * verticalSubdivisions;
        const nextRowStartIndex = startIndex + verticalSubdivisions;

        for (let j = 0; j < verticalSubdivisions; ++j)
        {
            triangles.push(
                startIndex + j,
                startIndex + j + 1,
                nextRowStartIndex + j + 1,

                startIndex + j,
                nextRowStartIndex + j + 1,
                nextRowStartIndex + j
            );
        }
    }

    const normalsF32 = new Float32Array(normals);
    return { vertices: normalsF32.map(n => n * radius), triangles: new Uint32Array(triangles), normals: normalsF32 };
}

export function CreateCapsuleGeometry(radius = 1, height = 1, horizontalSubdivisions = 16, verticalSubdivisions = 24)
{
    // the capsule is on the y axis
    const vertices: number[] = [];
    const normals: number[] = [];
    const triangles: number[] = [];

    // note: the geometry is not closed, and contains degenerate triangles at the poles
    // but this allows the code to be smaller, and it doesn't affect the rendering anyways

    // TODO: make sure this works properly

    for (let i = 0; i <= horizontalSubdivisions / 2; ++i)
    {
        const angleY = -Math.PI / 2 + Math.PI * i / (horizontalSubdivisions - 1);
        const yCoord = Math.sin(-angleY);
        const yMultiplier = Math.cos(-angleY);

        for (let j = 0; j < verticalSubdivisions; ++j)
        {
            const angleXZ = 2 * Math.PI * j / (verticalSubdivisions - 1);
            const x = Math.cos(angleXZ) * yMultiplier;
            const y = yCoord;
            const z = Math.sin(angleXZ) * yMultiplier;
            normals.push(x, y, z);
            vertices.push(x * radius, y * radius + height / 2, z * radius);
        }
    }

    for (let i = horizontalSubdivisions / 2; i < horizontalSubdivisions; ++i)
    {
        const angleY = -Math.PI / 2 + Math.PI * i / (horizontalSubdivisions - 1);
        const yCoord = Math.sin(-angleY);
        const yMultiplier = Math.cos(-angleY);

        for (let j = 0; j < verticalSubdivisions; ++j)
        {
            const angleXZ = 2 * Math.PI * j / (verticalSubdivisions - 1);
            const x = Math.cos(angleXZ) * yMultiplier;
            const y = yCoord;
            const z = Math.sin(angleXZ) * yMultiplier;
            normals.push(x, y, z);
            vertices.push(x * radius, y * radius - height / 2, z * radius);
        }
    }

    // triangles
    for (let i = 0; i < horizontalSubdivisions + 1; ++i)
    {
        const startIndex = i * verticalSubdivisions;
        const nextRowStartIndex = startIndex + verticalSubdivisions;

        for (let j = 0; j < verticalSubdivisions; ++j)
        {
            triangles.push(
                startIndex + j,
                startIndex + j + 1,
                nextRowStartIndex + j + 1,

                startIndex + j,
                nextRowStartIndex + j + 1,
                nextRowStartIndex + j
            );
        }
    }

    return { vertices: new Float32Array(vertices), triangles: new Uint32Array(triangles), normals: new Float32Array(normals) };
}

export function CreatePlaneGeometry(width = 1, depth = 1)
{
    const halfWidth = width / 2;
    const halfDepth = depth / 2;

    const vertices = new Float32Array([
        // bottom
        halfWidth, 0, -halfDepth,
        -halfWidth, 0, -halfDepth,
        halfWidth, 0, halfDepth,
        -halfWidth, 0, halfDepth,

        // top
        -halfWidth, 0, -halfDepth,
        halfWidth, 0, -halfDepth,
        -halfWidth, 0, halfDepth,
        halfWidth, 0, halfDepth,
    ]);

    const triangles = new Uint32Array([
        0,
        0 + 3,
        0 + 1,
        0,
        0 + 2,
        0 + 3,

        4,
        4 + 3,
        4 + 1,
        4,
        4 + 2,
        4 + 3
    ]);

    const normals = new Float32Array([
        // bottom
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,

        // top
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0
    ]);

    return { vertices, triangles, normals };
}

export function CreateExtrudedGeometryConvex(polyline: number[], thickness: number)
{
    // triangulated from the first point in the polygon, so it's only guaranteed to work for convex polygons
    const vertices: number[] = [];
    const triangles: number[] = [];
    const normals: number[] = [];

    const points: Vector2[] = [];
    for (let i = 0; i < polyline.length; i += 2)
    {
        points.push(new Vector2(polyline[i], polyline[i + 1]));
    }

    // front and back
    for (const point of points)
    {
        vertices.push(point.x, point.y, thickness / -2);
        vertices.push(point.x, point.y, thickness / 2);
        normals.push(0, 0, -1);
        normals.push(0, 0, 1);
    }

    for (let i = 2; i < points.length; ++i)
    {
        const i1 = i - 1;
        triangles.push(
            0, i1 * 2, i * 2,
            1, i * 2 + 1, i1 * 2 + 1
        );
    }

    // sides
    let prev = points[points.length - 1];
    for (const point of points)
    {
        const idx = vertices.length / 3;
        vertices.push(
            prev.x, prev.y, thickness / 2,
            prev.x, prev.y, thickness / -2,
            point.x, point.y, thickness / 2,
            point.x, point.y, thickness / -2,
        );

        const normal = point.clone().sub(prev).normalize();
        const x = normal.x;
        normal.x = -normal.y;
        normal.y = x;
        prev = point;

        normals.push(normal.x, normal.y, 0);
        normals.push(normal.x, normal.y, 0);
        normals.push(normal.x, normal.y, 0);
        normals.push(normal.x, normal.y, 0);

        triangles.push(idx, idx + 3, idx + 1, idx, idx + 2, idx + 3);
    }

    return { vertices: new Float32Array(vertices), triangles: new Uint32Array(triangles), normals: new Float32Array(normals) };
}
