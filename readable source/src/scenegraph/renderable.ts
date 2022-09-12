import { Geometry } from "./geometry.js";
import { SceneNode } from "./scene.js";

export class Renderable extends SceneNode
{
    public vao: WebGLVertexArrayObject;
    public triangleCount: number;

    private vertexBuffer: WebGLBuffer;
    private indexBuffer: WebGLBuffer;

    constructor(gl: WebGL2RenderingContext, geometry: Geometry, positionLoc: number, normalLoc?: number)
    {
        super(gl);

        this.vao = gl.createVertexArray()!;
        gl.bindVertexArray(this.vao);

        // setup buffers

        this.vertexBuffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, geometry.vertices, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(positionLoc);
        gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);

        this.indexBuffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.triangles, gl.STATIC_DRAW);

        if (geometry.normals && normalLoc !== undefined)
        {
            const normalBuffer = gl.createBuffer()!;
            gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, geometry.normals, gl.STATIC_DRAW);
            gl.enableVertexAttribArray(normalLoc);
            gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, true, 0, 0);
        }

        gl.bindVertexArray(null);

        this.triangleCount = geometry.triangles.length;
    }

    public dispose()
    {
        super.dispose();
        this.gl.deleteBuffer(this.vertexBuffer);
        this.gl.deleteBuffer(this.indexBuffer);
    }
}
