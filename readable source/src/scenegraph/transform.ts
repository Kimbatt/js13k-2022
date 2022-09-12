import { Matrix4x4, Quaternion, Vector3 } from "../util/linear.js";

export class Transform
{
    public position = new Vector3();
    public rotation = new Quaternion();
    public scale = new Vector3(1, 1, 1);

    public matrix = () => new Matrix4x4().compose(this.position, this.rotation, this.scale);

    public matrixInverse = () =>
    {
        const invRotation = this.rotation.clone().invert();
        return new Matrix4x4().compose(
            this.position.clone().mulScalar(-1).applyQuaternion(invRotation),
            invRotation,
            new Vector3(1, 1, 1).div(this.scale)
        );
    }
}
