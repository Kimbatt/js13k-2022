import { Matrix4x4 } from "../util/linear.js";
import { CreateWebglProgram } from "../util/webgl-utils.js";
import { CreateBoxGeometry, Geometry } from "./geometry.js";
import { Renderable } from "./renderable.js";
import { DirectionalLight, RenderMode, ViewMatrices } from "./scene.js";

let skyboxProgram: ReturnType<typeof CreateWebglProgram> | null = null;
function GetOrCreateSkyboxProgram(gl: WebGL2RenderingContext)
{
    if (skyboxProgram === null)
    {
        const vertexShaderSource = `#version 300 es

        layout (location = 0)
        in vec3 aVertexPosition;

        out vec3 vDirection;

        uniform mat4 viewProjectionMatrix;

        void main()
        {
            vDirection = aVertexPosition;
            gl_Position = (mat3(viewProjectionMatrix) * vDirection).xyzz;
        }

        `;

        const fragmentShaderSource = `#version 300 es

        precision highp float;

        in vec3 vDirection;
        out vec4 fragColor;

        uniform vec3 sunPos; // must be normalized


        // https://www.shadertoy.com/view/4tVSRt

        const float coeff = 0.2;
        const vec3 totalSkyLight = vec3(1.0, 0.2, 0.0);
        const vec3 sunL = vec3(1, 0.9, 0.8); // sun color

        vec3 mie(float dist)
        {
            return max(exp(-pow(dist, 0.3)) * sunL - 0.4, 0.0);
        }


        vec3 getSky(vec3 dir)
        {
            float sunDistance = distance(dir, sunPos) * 2.0;

            float scatterMult = min(sunDistance, 1.0);
            float sun = 1.0 - smoothstep(0.01, 0.011, scatterMult);

            float dist = max(dir.y + 0.2, 0.001);
            dist = (coeff * mix(scatterMult, 1.0, dist)) / dist;

            vec3 mieScatter = mie(sunDistance);

            vec3 color = dist * totalSkyLight;

            // color = max(color, 0.0);

            color = max(
                mix(pow(color, 1.0 - color), color / (2.0 * color + 0.5 - color), clamp(sunPos.y * 2.0, 0.0, 1.0)),
                0.0
            ) + sun + mieScatter;

            color *= pow(1.0 - scatterMult, 10.0) * 8.0 + 1.0;

            float underscatter = abs(sunPos.y * 0.5 - 0.5);

            return mix(color, vec3(0.0), min(underscatter, 1.0));
        }


        void main()
        {
            fragColor = vec4(getSky(normalize(vDirection)), 1);
        }

        `;

        skyboxProgram = CreateWebglProgram(gl, vertexShaderSource, fragmentShaderSource, "viewProjectionMatrix", "sunPos");
    }

    return skyboxProgram;
}

export class Skybox extends Renderable
{
    private program: WebGLProgram;
    private uniforms: Map<string, WebGLUniformLocation>;

    constructor(gl: WebGL2RenderingContext)
    {
        super(gl, CreateBoxGeometry(), 0);
        const { program, uniformLocations } = GetOrCreateSkyboxProgram(gl);
        this.program = program;
        this.uniforms = uniformLocations;
        this.renderOrder = 1000;
    }

    public render(mode: RenderMode, viewMatrices: ViewMatrices, _worldMatrix: Matrix4x4, light: DirectionalLight): void
    {
        if (mode !== RenderMode.Normal)
        {
            return;
        }

        this.gl.useProgram(this.program);
        this.gl.bindVertexArray(this.vao);

        this.gl.uniformMatrix4fv(this.uniforms.get("viewProjectionMatrix")!, false, viewMatrices.viewProjectionMatrix);
        this.gl.uniform3fv(this.uniforms.get("sunPos")!, light.transform.position.clone().normalize());

        this.gl.cullFace(this.gl.FRONT);
        this.gl.depthFunc(this.gl.LEQUAL);

        this.gl.drawElements(this.gl.TRIANGLES, this.triangleCount, this.gl.UNSIGNED_INT, 0);

        this.gl.cullFace(this.gl.BACK);
        this.gl.depthFunc(this.gl.LESS);

        this.gl.bindVertexArray(null);
    }
}
