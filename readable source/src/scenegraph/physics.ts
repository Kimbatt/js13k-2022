import { Matrix4x4, Quaternion, Vector3 } from "../util/linear.js";
import { SceneNode } from "./scene.js";

// no parenting is allowed for any phyisics related nodes (or at least local transform must be equal to world transform)
// otherwise stuff will break

export abstract class Collider extends SceneNode
{
    protected matrixInverse = new Matrix4x4(); // world to local

    constructor(gl: WebGL2RenderingContext)
    {
        super(gl);
    }

    // recalculates matrix which is
    public updateMatrix()
    {
        this.matrixInverse = this.worldToLocalMatrix();
    }

    // return null if there is no collision
    // otherwise return an offset vector which resolves the collision
    public abstract resolveCollision(point: Vector3, radius: number): Vector3 | null;
}

export class BoxCollider extends Collider
{
    private extents: Vector3;

    constructor(gl: WebGL2RenderingContext, center: Vector3, rotation: Quaternion, size: Vector3)
    {
        super(gl);
        this.transform.position.copyFrom(center);
        this.transform.rotation.copyFrom(rotation);
        this.updateMatrix();

        this.extents = size.clone().divScalar(2);
    }

    public resolveCollision(point: Vector3, radius: number)
    {
        const pointLocalSpace = point.clone().applyMatrix4x4(this.matrixInverse);

        let minPenetrationDepth = Infinity;
        const minPenetrationResolveDirection = new Vector3();

        for (let i = 0; i < 6; ++i)
        {
            const axis = i / 2 | 0;
            const sign = (i & 1) * 2 - 1;
            const penetrationDepth = this.extents[axis] - pointLocalSpace[axis] * sign + radius;
            if (penetrationDepth <= 0)
            {
                return null;
            }

            if (penetrationDepth < minPenetrationDepth)
            {
                minPenetrationDepth = penetrationDepth;
                // TODO?: offset in the actual minimum distance direction (with >0 radius, near corners/edges)
                minPenetrationResolveDirection.setScalar(0);
                minPenetrationResolveDirection[axis] = penetrationDepth * sign;
            }
        }

        return minPenetrationResolveDirection.applyQuaternion(this.transform.rotation);
    }
}

export class SphereCollider extends Collider
{
    private radius: number;

    constructor(gl: WebGL2RenderingContext, position: Vector3, radius: number)
    {
        super(gl);
        this.transform.position.copyFrom(position);
        this.updateMatrix();

        this.radius = radius;
    }

    public resolveCollision(point: Vector3, radius: number): Vector3 | null
    {
        const worldDirection = point.clone().sub(this.transform.position);
        const distance = worldDirection.length;
        return (distance < this.radius + radius) ? worldDirection.safeNormalize().mulScalar(this.radius + radius - distance) : null;
    }
}
