import { Matrix3x3, Matrix4x4, Quaternion, Vector3 } from "./util/linear.js";

const wasmModule = await WebAssembly.instantiateStreaming(fetch("w.wasm"), {});

const wasm = wasmModule.instance.exports as any & WebAssembly.Exports;

export function Matrix4x4Multiply(a: Matrix4x4, b: Matrix4x4, target: Matrix4x4)
{
    target.set(wasm.m4m(...a, ...b));
}

export function Matrix4x4Compose(pos: Vector3, rot: Quaternion, scale: Vector3, target: Matrix4x4)
{
    target.set(wasm.m4c(...pos, ...rot, ...scale));
}

// unused
export function Matrix3x3Multiply(a: Matrix3x3, b: Matrix3x3, target: Matrix3x3)
{
    // target.set(wasm.m3m(...a, ...b));
}

export function Matrix3x3Invert(m: Matrix3x3, target: Matrix3x3)
{
    target.set(wasm.m3i(...m));
}

export function QuaternionMultiply(a: Quaternion, b: Quaternion, target: Quaternion)
{
    target.set(wasm.qm(...a, ...b));
}

export function PointQuaternionMultiply(p: Vector3, q: Quaternion, target: Vector3)
{
    target.set(wasm.pqm(...p, ...q));
}
