import { Matrix3x3Invert, Matrix3x3Multiply, Matrix4x4Compose, Matrix4x4Multiply, PointQuaternionMultiply, QuaternionMultiply } from "../wasm-interface.js";
import { Lerp } from "./math.js";
import { FixedLengthArray } from "./util.js";

abstract class VectorBase<Length extends number> extends Float32Array
{
    constructor(len: Length, elements?: FixedLengthArray<number, Length> | VectorBase<Length>)
    {
        super(len);
        this.set(elements ?? []);
    }

    public abstract get new(): this;
    public clone = () => this.new.set(this);

    public set(array: ArrayLike<number>, offset?: number | undefined)
    {
        super.set(array, offset);
        return this;
    }

    public copyFrom = (other: VectorBase<Length>) => this.set(other);

    public setValues = (...vals: FixedLengthArray<number, Length>) => this.set(vals);

    public setScalar(num: number)
    {
        for (let i = 0; i < super.length; ++i)
        {
            this[i] = num;
        }

        return this;
    }

    public add(other: VectorBase<Length>)
    {
        for (let i = 0; i < super.length; ++i)
        {
            this[i] += other[i];
        }

        return this;
    }

    public sub(other: VectorBase<Length>)
    {
        for (let i = 0; i < super.length; ++i)
        {
            this[i] -= other[i];
        }

        return this;
    }

    public mul(other: VectorBase<Length>)
    {
        for (let i = 0; i < super.length; ++i)
        {
            this[i] *= other[i];
        }

        return this;
    }

    public div(other: VectorBase<Length>)
    {
        for (let i = 0; i < super.length; ++i)
        {
            this[i] /= other[i];
        }

        return this;
    }

    public addScalar(other: number)
    {
        for (let i = 0; i < super.length; ++i)
        {
            this[i] += other;
        }

        return this;
    }

    public subScalar(other: number)
    {
        for (let i = 0; i < super.length; ++i)
        {
            this[i] -= other;
        }

        return this;
    }

    public mulScalar(other: number)
    {
        for (let i = 0; i < super.length; ++i)
        {
            this[i] *= other;
        }

        return this;
    }

    public divScalar(other: number)
    {
        for (let i = 0; i < super.length; ++i)
        {
            this[i] /= other;
        }

        return this;
    }

    public dot = (other: VectorBase<Length>): number => this.new.copyFrom(this).mul(other).csum;

    public get lengthSqr()
    {
        return this.dot(this);
    }

    public get length()
    {
        return Math.sqrt(this.lengthSqr);
    }

    public distanceSqr = (other: VectorBase<Length>) => this.new.copyFrom(this).sub(other).lengthSqr;

    public distance = (other: VectorBase<Length>) => this.new.copyFrom(this).sub(other).length;

    // component sum
    public get csum()
    {
        let l = 0;
        for (let i = 0; i < super.length; ++i)
        {
            l += this[i];
        }

        return l;
    }

    public normalize = () => this.divScalar(this.length);

    public safeNormalize()
    {
        const len = this.length;
        return len > 1e-9 ? this.divScalar(len) : this.setScalar(0);
    }

    public lerpVectors(a: VectorBase<Length>, b: VectorBase<Length>, t: number)
    {
        for (let i = 0; i < super.length; ++i)
        {
            this[i] = Lerp(a[i], b[i], t);
        }

        return this;
    }

    public lerp = (other: VectorBase<Length>, t: number) => this.lerpVectors(this, other, t);
}

export class Vector4 extends VectorBase<4>
{
    constructor(x = 0, y = 0, z = 0, w = 0)
    {
        super(4, [x, y, z, w]);
    }

    // @ts-ignore
    public get new()
    {
        return new Vector4();
    }

    get x()
    {
        return this[0];
    }

    set x(v)
    {
        this[0] = v;
    }

    get y()
    {
        return this[1];
    }

    set y(v)
    {
        this[1] = v;
    }

    get z()
    {
        return this[2];
    }

    set z(v)
    {
        this[2] = v;
    }

    get w()
    {
        return this[3];
    }

    set w(v)
    {
        this[3] = v;
    }
}

export class Vector3 extends VectorBase<3>
{
    constructor(x = 0, y = 0, z = 0)
    {
        super(3, [x, y, z]);
    }

    // @ts-ignore
    public get new()
    {
        return new Vector3();
    }

    get x()
    {
        return this[0];
    }

    set x(v)
    {
        this[0] = v;
    }

    get y()
    {
        return this[1];
    }

    set y(v)
    {
        this[1] = v;
    }

    get z()
    {
        return this[2];
    }

    set z(v)
    {
        this[2] = v;
    }

    public crossVectors = (a: this, b: this) => this.setValues(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);

    public cross = (other: this) => this.crossVectors(this, other);

    public setFromMatrixPosition = (mat: Matrix4x4) => this.set(mat.subarray(12, 15));

    public setFromMatrixColumn = (mat: Matrix4x4, col: number) => this.set(mat.subarray(col * 4, (col + 1) * 4));

    public applyQuaternion(q: Quaternion)
    {
        PointQuaternionMultiply(this, q, this);
        return this;
    }

    public applyMatrix4x4(mat: Matrix4x4)
    {
        const x = this.x, y = this.y, z = this.z;

        const iw = mat[3] * x + mat[7] * y + mat[11] * z + mat[15];
        this.x = (mat[0] * x + mat[4] * y + mat[8] * z + mat[12]) / iw;
        this.y = (mat[1] * x + mat[5] * y + mat[9] * z + mat[13]) / iw;
        this.z = (mat[2] * x + mat[6] * y + mat[10] * z + mat[14]) / iw;

        return this;
    }
}

export class Vector2 extends VectorBase<2>
{
    constructor(x = 0, y = 0)
    {
        super(2, [x, y]);
    }

    // @ts-ignore
    public get new()
    {
        return new Vector2();
    }

    get x()
    {
        return this[0];
    }

    set x(v)
    {
        this[0] = v;
    }

    get y()
    {
        return this[1];
    }

    set y(v)
    {
        this[1] = v;
    }
}

// https://github.com/mrdoob/three.js/blob/dev/src/math/Quaternion.js
export class Quaternion extends Vector4
{
    constructor(x = 0, y = 0, z = 0, w = 1)
    {
        super(x, y, z, w);
    }

    public get new(): Quaternion
    {
        return new Quaternion();
    }

    public setFromAxisAngle(x: number, y: number, z: number, angle: number)
    {
        const half = angle / 2;
        const s = Math.sin(half);

        return this.setValues(x * s, y * s, z * s, Math.cos(half));
    }

    public invert()
    {
        this.w = -this.w;
        return this;
    }

    public setFromEulerXYZ(x: number, y: number, z: number)
    {
        const c1 = Math.cos(x / 2);
        const c2 = Math.cos(y / 2);
        const c3 = Math.cos(z / 2);

        const s1 = Math.sin(x / 2);
        const s2 = Math.sin(y / 2);
        const s3 = Math.sin(z / 2);

        return this.setValues(
            s1 * c2 * c3 + c1 * s2 * s3,
            c1 * s2 * c3 - s1 * c2 * s3,
            c1 * c2 * s3 + s1 * s2 * c3,
            c1 * c2 * c3 - s1 * s2 * s3
        );
    }

    public multiplyQuaternions(a: Quaternion, b: Quaternion)
    {
        QuaternionMultiply(a, b, this);
        return this;
    }

    public multiply = (other: this) => this.multiplyQuaternions(this, other);

    public premultiply = (other: this) => this.multiplyQuaternions(other, this);

    public setFromRotationMatrix(mat: Matrix4x4)
    {
        const
            m11 = mat[0], m12 = mat[4], m13 = mat[8],
            m21 = mat[1], m22 = mat[5], m23 = mat[9],
            m31 = mat[2], m32 = mat[6], m33 = mat[10],
            trace = m11 + m22 + m33;

        if (trace > 0)
        {
            const s = 0.5 / Math.sqrt(trace + 1.0);
            return this.setValues((m32 - m23) * s, (m13 - m31) * s, (m21 - m12) * s, 0.25 / s);
        }
        else if (m11 > m22 && m11 > m33)
        {
            const s = 2.0 * Math.sqrt(1.0 + m11 - m22 - m33);
            return this.setValues(0.25 * s, (m12 + m21) / s, (m13 + m31) / s, (m32 - m23) / s);
        }
        else if (m22 > m33)
        {
            const s = 2.0 * Math.sqrt(1.0 + m22 - m11 - m33);
            return this.setValues((m12 + m21) / s, 0.25 * s, (m23 + m32) / s, (m13 - m31) / s);
        }
        else
        {
            const s = 2.0 * Math.sqrt(1.0 + m33 - m11 - m22);
            return this.setValues((m13 + m31) / s, (m23 + m32) / s, 0.25 * s, (m21 - m12) / s);
        }
    }

    public setFromUnitVectors(from: Vector3, to: Vector3)
    {
        const r = from.dot(to) + 1;

        if (r < Number.EPSILON)
        {
            if (Math.abs(from.x) > Math.abs(from.z))
            {
                this.setValues(-from.y, from.x, 0, 0);
            }
            else
            {
                this.setValues(0, -from.z, from.y, 0);
            }
        }
        else
        {
            this.setValues(
                from.y * to.z - from.z * to.y,
                from.z * to.x - from.x * to.z,
                from.x * to.y - from.y * to.x,
                r
            );
        }

        return this.normalize();
    }
}

// https://github.com/mrdoob/three.js/blob/dev/src/math/Matrix3.js
export class Matrix3x3 extends Float32Array
{
    constructor(elements?: FixedLengthArray<number, 9> | Matrix3x3)
    {
        super(9);
        this.set(elements ?? [
            1, 0, 0,
            0, 1, 0,
            0, 0, 1
        ]);
    }

    public clone = () => new Matrix3x3(this);

    public set(array: FixedLengthArray<number, 9> | Matrix3x3, offset?: number | undefined)
    {
        super.set(array, offset);
        return this;
    }

    public copy(other: Matrix3x3)
    {
        return this.set(other);
    }

    public multiply(other: Matrix3x3)
    {
        return this.multiplyMatrices(this, other);
    }

    public multiplyMatrices(a: Matrix3x3, b: Matrix3x3)
    {
        Matrix3x3Multiply(a, b, this);
        return this;
    }

    public invert()
    {
        Matrix3x3Invert(this, this);
        return this;
    }

    // TODO: is this needed? already handled by gl.uniformMatrix4fv
    // public transpose()
    // {
    //     let tmp;

    //     tmp = this[1];
    //     this[1] = this[3];
    //     this[3] = tmp;

    //     tmp = this[2];
    //     this[2] = this[6];
    //     this[6] = tmp;

    //     tmp = this[5];
    //     this[5] = this[7];
    //     this[7] = tmp;

    //     return this;
    // }
}

// https://github.com/mrdoob/three.js/blob/dev/src/math/Matrix4.js
export class Matrix4x4 extends Float32Array
{
    constructor(elements?: FixedLengthArray<number, 16> | Matrix4x4)
    {
        super(16);
        this.set(elements ?? [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    }

    public clone = () => new Matrix4x4(this);

    public set(array: FixedLengthArray<number, 16> | Matrix4x4, offset?: number | undefined)
    {
        super.set(array, offset);
        return this;
    }

    public copy(other: Matrix4x4)
    {
        return this.set(other);
    }

    public multiply(other: Matrix4x4)
    {
        return this.multiplyMatrices(this, other);
    }

    public preMultiply(other: Matrix4x4)
    {
        return this.multiplyMatrices(other, this);
    }

    public multiplyMatrices(a: Matrix4x4, b: Matrix4x4)
    {
        Matrix4x4Multiply(a, b, this);
        return this;
    }

    public invert()
    {
        const
            m11 = this[0], m21 = this[1], m31 = this[2], m41 = this[3],
            m12 = this[4], m22 = this[5], m32 = this[6], m42 = this[7],
            m13 = this[8], m23 = this[9], m33 = this[10], m43 = this[11],
            m14 = this[12], m24 = this[13], m34 = this[14], m44 = this[15],

            t1 = m23 * m34 * m42 - m24 * m33 * m42 + m24 * m32 * m43 - m22 * m34 * m43 - m23 * m32 * m44 + m22 * m33 * m44,
            t2 = m14 * m33 * m42 - m13 * m34 * m42 - m14 * m32 * m43 + m12 * m34 * m43 + m13 * m32 * m44 - m12 * m33 * m44,
            t3 = m13 * m24 * m42 - m14 * m23 * m42 + m14 * m22 * m43 - m12 * m24 * m43 - m13 * m22 * m44 + m12 * m23 * m44,
            t4 = m14 * m23 * m32 - m13 * m24 * m32 - m14 * m22 * m33 + m12 * m24 * m33 + m13 * m22 * m34 - m12 * m23 * m34;

        const det = m11 * t1 + m21 * t2 + m31 * t3 + m41 * t4;

        if (det === 0)
        {
            return this.set([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
        }

        const detInv = 1 / det;

        this[0] = detInv * t1;
        this[1] = detInv * (m24 * m33 * m41 - m23 * m34 * m41 - m24 * m31 * m43 + m21 * m34 * m43 + m23 * m31 * m44 - m21 * m33 * m44);
        this[2] = detInv * (m22 * m34 * m41 - m24 * m32 * m41 + m24 * m31 * m42 - m21 * m34 * m42 - m22 * m31 * m44 + m21 * m32 * m44);
        this[3] = detInv * (m23 * m32 * m41 - m22 * m33 * m41 - m23 * m31 * m42 + m21 * m33 * m42 + m22 * m31 * m43 - m21 * m32 * m43);

        this[4] = detInv * t2;
        this[5] = detInv * (m13 * m34 * m41 - m14 * m33 * m41 + m14 * m31 * m43 - m11 * m34 * m43 - m13 * m31 * m44 + m11 * m33 * m44);
        this[6] = detInv * (m14 * m32 * m41 - m12 * m34 * m41 - m14 * m31 * m42 + m11 * m34 * m42 + m12 * m31 * m44 - m11 * m32 * m44);
        this[7] = detInv * (m12 * m33 * m41 - m13 * m32 * m41 + m13 * m31 * m42 - m11 * m33 * m42 - m12 * m31 * m43 + m11 * m32 * m43);

        this[8] = detInv * t3;
        this[9] = detInv * (m14 * m23 * m41 - m13 * m24 * m41 - m14 * m21 * m43 + m11 * m24 * m43 + m13 * m21 * m44 - m11 * m23 * m44);
        this[10] = detInv * (m12 * m24 * m41 - m14 * m22 * m41 + m14 * m21 * m42 - m11 * m24 * m42 - m12 * m21 * m44 + m11 * m22 * m44);
        this[11] = detInv * (m13 * m22 * m41 - m12 * m23 * m41 - m13 * m21 * m42 + m11 * m23 * m42 + m12 * m21 * m43 - m11 * m22 * m43);

        this[12] = detInv * t4;
        this[13] = detInv * (m13 * m24 * m31 - m14 * m23 * m31 + m14 * m21 * m33 - m11 * m24 * m33 - m13 * m21 * m34 + m11 * m23 * m34);
        this[14] = detInv * (m14 * m22 * m31 - m12 * m24 * m31 - m14 * m21 * m32 + m11 * m24 * m32 + m12 * m21 * m34 - m11 * m22 * m34);
        this[15] = detInv * (m12 * m23 * m31 - m13 * m22 * m31 + m13 * m21 * m32 - m11 * m23 * m32 - m12 * m21 * m33 + m11 * m22 * m33);

        return this;
    }

    public compose(position: Vector3, quaternion: Quaternion, scale: Vector3)
    {
        Matrix4x4Compose(position, quaternion, scale, this);
        return this;
    }

    public makePerspective(left: number, right: number, top: number, bottom: number, near: number, far: number)
    {
        const te = this;
        const x = 2 * near / (right - left);
        const y = 2 * near / (top - bottom);

        const a = (right + left) / (right - left);
        const b = (top + bottom) / (top - bottom);
        const c = - (far + near) / (far - near);
        const d = - 2 * far * near / (far - near);

        te[0] = x; te[4] = 0; te[8] = a; te[12] = 0;
        te[1] = 0; te[5] = y; te[9] = b; te[13] = 0;
        te[2] = 0; te[6] = 0; te[10] = c; te[14] = d;
        te[3] = 0; te[7] = 0; te[11] = - 1; te[15] = 0;

        return this;
    }

    public makeOrthographic(left: number, right: number, top: number, bottom: number, near: number, far: number)
    {
        const te = this;
        const w = 1.0 / (right - left);
        const h = 1.0 / (top - bottom);
        const p = 1.0 / (far - near);

        const x = (right + left) * w;
        const y = (top + bottom) * h;
        const z = (far + near) * p;

        te[0] = 2 * w; te[4] = 0; te[8] = 0; te[12] = - x;
        te[1] = 0; te[5] = 2 * h; te[9] = 0; te[13] = - y;
        te[2] = 0; te[6] = 0; te[10] = - 2 * p; te[14] = - z;
        te[3] = 0; te[7] = 0; te[11] = 0; te[15] = 1;

        return this;
    }

    public lookAt(eye: Vector3, center: Vector3, up: Vector3)
    {
        const f = center.clone().sub(eye).normalize();
        const s = f.clone().cross(up).normalize();
        const u = s.clone().cross(f);

        return this.set([
            s.x, u.x, -f.x, 0,
            s.y, u.y, -f.y, 0,
            s.z, u.z, -f.z, 0,
            -eye.dot(s), -eye.dot(u), eye.dot(f), 1
        ]);
    }

    public topLeft3x3 = () => new Matrix3x3([this[0], this[1], this[2], this[4], this[5], this[6], this[8], this[9], this[10]]);
}
