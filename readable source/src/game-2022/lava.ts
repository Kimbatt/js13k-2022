import { CreateBoxGeometry, Geometry } from "../scenegraph/geometry.js";
import { Renderable } from "../scenegraph/renderable.js";
import { DirectionalLight, RenderMode, ViewMatrices } from "../scenegraph/scene.js";
import { FBM } from "../texture-generator/noise/fbm.js";
import { Matrix4x4 } from "../util/linear.js";
import { ShaderUtils } from "../util/shader-utils.js";
import { CreateWebglProgram } from "../util/webgl-utils.js";

let lavaProgram: ReturnType<typeof CreateWebglProgram> | null = null;
function GetOrCreateLavaProgram(gl: WebGL2RenderingContext)
{
    if (lavaProgram === null)
    {
        const vertexShaderSource = `#version 300 es

        layout (location = 0)
        in vec4 aVertexPosition;

        out vec2 vertexPosition;
        out vec4 shadowPos;

        uniform mat4 viewProjectionMatrix;
        uniform mat4 worldMat;
        uniform mat4 shadowMVP;

        void main()
        {
            vertexPosition = aVertexPosition.xy;
            vertexPosition.y += aVertexPosition.z;
            shadowPos = shadowMVP * worldMat * aVertexPosition * 0.5 + 0.5;
            gl_Position = viewProjectionMatrix * worldMat * aVertexPosition;
        }

        `;

        const fragmentShaderSource = `#version 300 es

        precision highp float;
        precision highp sampler2DShadow;

        uniform float uTime;
        uniform sampler2DShadow depthMap;
        uniform bool hueShift;

        in vec2 vertexPosition;
        in vec4 shadowPos;

        out vec4 fragColor;

        ${ShaderUtils}

        ${FBM}

        // lava shader from https://www.shadertoy.com/view/4lXfR7

        vec3 magmaFunc(vec3 color, vec2 uv, float detail, float power, float colorMul, float glowRate, float noiseAmount)
        {
            vec3 rockColor = vec3(0.1 + abs(sin(uTime)) * 0.03, 0.02, 0.02);
            uv *= detail;
            float minDistance = 1.0;

            vec2 cell = floor(uv);
            vec2 frac = fract(uv);
            float noiseOffset = noise(uv) * noiseAmount;

            for (int i = -1; i <= 1; ++i)
            {
                for (int j = -1; j <= 1; ++j)
                {
                    vec2 cellDir = vec2(i, j);
                    vec2 randPoint = hash2(cell + cellDir) + noiseOffset;
                    randPoint = 0.5 + 0.5 * sin(uTime * 0.35 + 6.2831 * randPoint);
                    minDistance = min(minDistance, length(cellDir + randPoint - frac));
                }
            }

            float powAdd = noise(uv * 0.1 + uTime * 0.2 * glowRate) - 0.8;
            powAdd *= 6.0;
            vec3 outColor = vec3(color * pow(minDistance, power + powAdd * 0.95) * colorMul);
            outColor = mix(rockColor, outColor, minDistance);
            return outColor;
        }

        void main()
        {
            vec2 uv = vertexPosition * 0.1;
            fragColor = vec4(0, 0, 0, 1);
            fragColor.rgb += magmaFunc(vec3(1.5, 0.4, 0), uv, 3.0, 2.5, 1.15, 0.5, 0.5);
            fragColor.rgb += magmaFunc(vec3(1.5, 0, 0),   uv, 6.0, 3.0, 0.4,  0.3, 0.0);
            fragColor.rgb += magmaFunc(vec3(1.2, 0.4, 0), uv, 8.0, 4.0, 0.2,  0.6, 0.5);

            if (hueShift)
            {
                fragColor = fragColor.grbr;
            }
            else
            {
                float shadowLightValue = 0.0;
                vec3 shadowPosLightSpace = shadowPos.xyz / shadowPos.w;
                vec2 uvDistanceFromCenter = abs(vec2(0.5) - shadowPosLightSpace.xy);

                if (shadowPosLightSpace.z > 1.0 || uvDistanceFromCenter.x > 0.5 || uvDistanceFromCenter.y > 0.5)
                {
                    // if the coordinate is outside the shadowmap, then it's in light
                    shadowLightValue = 1.0;
                }
                else
                {
                    shadowLightValue = texture(depthMap, shadowPosLightSpace) * 0.5 + 0.5;
                }

                fragColor.rgb = min(fragColor.rgb, vec3(1)) * shadowLightValue;
            }
        }

        `;

        lavaProgram = CreateWebglProgram(gl, vertexShaderSource, fragmentShaderSource,
            "viewProjectionMatrix", "worldMat", "uTime", "shadowMVP", "depthMap", "hueShift"
        );
    }

    return lavaProgram;
}

export class Lava extends Renderable
{
    private program: WebGLProgram;
    private uniforms: Map<string, WebGLUniformLocation>;
    public hueShift = 0;

    constructor(gl: WebGL2RenderingContext, geometry: Geometry)
    {
        super(gl, geometry, 0);
        const { program, uniformLocations } = GetOrCreateLavaProgram(gl);
        this.program = program;
        this.uniforms = uniformLocations;
        this.renderOrder = 500;
    }

    public render(mode: RenderMode, viewMatrices: ViewMatrices, worldMatrix: Matrix4x4, light: DirectionalLight): void
    {
        if (mode !== RenderMode.Normal)
        {
            return;
        }

        this.gl.useProgram(this.program);
        this.gl.bindVertexArray(this.vao);

        this.gl.uniformMatrix4fv(this.uniforms.get("viewProjectionMatrix")!, false, viewMatrices.viewProjectionMatrix);
        this.gl.uniformMatrix4fv(this.uniforms.get("worldMat")!, false, worldMatrix);
        this.gl.uniform1f(this.uniforms.get("uTime")!, performance.now() / 1000);
        this.gl.uniform1i(this.uniforms.get("depthMap")!, 0);

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, light.depthTexture);

        this.gl.uniformMatrix4fv(this.uniforms.get("shadowMVP")!, false, light.depthMVP);
        this.gl.uniform1i(this.uniforms.get("hueShift")!, this.hueShift);

        this.hueShift && (this.gl.enable(this.gl.BLEND), this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA));

        this.gl.drawElements(this.gl.TRIANGLES, this.triangleCount, this.gl.UNSIGNED_INT, 0);

        this.gl.bindVertexArray(null);
        this.hueShift && this.gl.disable(this.gl.BLEND);
    }
}
