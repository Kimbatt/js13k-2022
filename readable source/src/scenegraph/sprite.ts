import { CreateBoxGeometry } from "../scenegraph/geometry.js";
import { Renderable } from "../scenegraph/renderable.js";
import { DirectionalLight, RenderMode, ViewMatrices } from "../scenegraph/scene.js";
import { Matrix4x4 } from "../util/linear.js";
import { CreateWebglProgram } from "../util/webgl-utils.js";
import { GetOrCreateShadowProgram } from "./material.js";

let spriteProgram: ReturnType<typeof CreateWebglProgram> | null = null;
function GetOrCreateSpriteProgram(gl: WebGL2RenderingContext)
{
    if (spriteProgram === null)
    {
        const vertexShaderSource = `#version 300 es

        layout (location = 0)
        in vec3 aVertexPosition;

        out vec2 uv;

        uniform mat4 viewProjectionMatrix;
        uniform mat4 worldMat;

        void main()
        {
            uv = aVertexPosition.xy + 0.5;
            gl_Position = viewProjectionMatrix * worldMat * vec4(aVertexPosition, 1);
        }

        `;

        const fragmentShaderSource = `#version 300 es

        precision highp float;

        in vec2 uv;

        out vec4 fragColor;

        uniform sampler2D tex;

        void main()
        {
            fragColor = texture(tex, uv);
            if (fragColor.a < 0.01) discard;
        }

        `;

        spriteProgram = CreateWebglProgram(gl, vertexShaderSource, fragmentShaderSource, "viewProjectionMatrix", "worldMat", "tex");
    }

    return spriteProgram;
}

export class Sprite extends Renderable
{
    private program: WebGLProgram;
    private uniforms: Map<string, WebGLUniformLocation>;
    private texture: WebGLTexture | null;
    private shadowProgram: ReturnType<typeof GetOrCreateShadowProgram>;

    constructor(gl: WebGL2RenderingContext, texture: WebGLTexture | null)
    {
        super(gl, CreateBoxGeometry(1, 1, 0.01), 0);
        const { program, uniformLocations } = GetOrCreateSpriteProgram(gl);
        this.program = program;
        this.uniforms = uniformLocations;
        this.texture = texture;
        this.renderOrder = 2000;

        this.shadowProgram = GetOrCreateShadowProgram(gl);
    }

    public setTexture(texture: WebGLTexture | null)
    {
        this.texture = texture;
    }

    public render(mode: RenderMode, viewMatrices: ViewMatrices, worldMatrix: Matrix4x4, light: DirectionalLight): void
    {
        this.gl.useProgram(mode === RenderMode.Normal ? this.program : this.shadowProgram.program);
        this.gl.bindVertexArray(this.vao);

        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        if (this.texture)
        {
            this.gl.activeTexture(this.gl.TEXTURE0);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        }

        if (mode === RenderMode.Normal)
        {
            this.gl.uniform1i(this.uniforms.get("tex")!, 0);
            this.gl.uniformMatrix4fv(this.uniforms.get("viewProjectionMatrix")!, false, viewMatrices.viewProjectionMatrix);
            this.gl.uniformMatrix4fv(this.uniforms.get("worldMat")!, false, worldMatrix);
        }
        else
        {
            this.gl.uniform1i(this.shadowProgram.uniformLocations.get("tex")!, 0);
            this.gl.uniformMatrix4fv(light.worldMatLocation, false, worldMatrix);
        }

        this.gl.drawElements(this.gl.TRIANGLES, this.triangleCount, this.gl.UNSIGNED_INT, 0);

        this.gl.bindVertexArray(null);
        this.gl.disable(this.gl.BLEND);
    }
}
