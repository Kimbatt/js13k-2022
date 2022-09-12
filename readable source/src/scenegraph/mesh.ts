import { Matrix4x4 } from "../util/linear.js";
import { Clamp } from "../util/math.js";
import { Geometry } from "./geometry.js";
import { GetOrCreateShadowProgram, GetOrCreateStandardMaterial, Material } from "./material.js";
import { Renderable } from "./renderable.js";
import { DirectionalLight, RenderMode, ViewMatrices } from "./scene.js";


export class Mesh extends Renderable
{
    private program: WebGLProgram;
    private shadowProgram: WebGLProgram;
    private uniforms: Map<string, WebGLUniformLocation>;
    public material: Material;
    private textures = new Map<number, WebGLTexture>();
    public castShadows = true;

    constructor(gl: WebGL2RenderingContext, geometry: Geometry, material: Material)
    {
        const positionLoc = 0;  // from shader
        const normalLoc = 1;    // same

        super(gl, geometry, positionLoc, normalLoc);

        const { program, uniformLocations } = GetOrCreateStandardMaterial(gl);
        this.program = program;
        this.uniforms = uniformLocations;

        gl.useProgram(program);

        this.material = { ...material };

        // shadows
        this.shadowProgram = GetOrCreateShadowProgram(gl).program;
    }

    private prepareMaterial()
    {
        this.gl.uniform1i(this.uniforms.get("albedo")!, 0);
        this.gl.uniform1i(this.uniforms.get("normalMap")!, 1);
        this.gl.uniform1i(this.uniforms.get("roughnessMap")!, 2);

        this.gl.uniform1i(this.uniforms.get("hasAlbedo")!, 0);
        this.gl.uniform1i(this.uniforms.get("hasNormalMap")!, 0);
        this.gl.uniform1i(this.uniforms.get("hasRoughnessMap")!, 0);

        this.gl.uniform1f(this.uniforms.get("sharpness")!, 1);
        this.gl.uniform3f(this.uniforms.get("scale")!, 1, 1, 1);
        this.gl.uniform3f(this.uniforms.get("offset")!, 0, 0, 0);
        this.gl.uniform1f(this.uniforms.get("lightIntensity")!, 0.5);

        for (let i = 0; i < 8; ++i)
        {
            this.gl.activeTexture(this.gl.TEXTURE0 + i);
            this.gl.bindTexture(this.gl.TEXTURE_2D, null);
        }

        const { material } = this;
        if (material)
        {
            this.gl.uniform4f(this.uniforms.get("baseColor")!, material.r, material.g, material.b, material.a);
            this.gl.uniform1f(this.uniforms.get("metallic")!, material.metallic ?? 0);

            const coeff = 0.2;
            const eps = 1e-5;
            const roughness = 1.0 + coeff - coeff / Clamp(material.roughness ?? 0.5, eps, 1.0 - eps);

            this.gl.uniform1f(this.uniforms.get("roughness")!, roughness);

            this.gl.uniform1f(this.uniforms.get("sharpness")!, material.textureBlendSharpness ?? 1);
            material.textureScale && this.gl.uniform3fv(this.uniforms.get("scale")!, material.textureScale);
            material.textureOffset && this.gl.uniform3fv(this.uniforms.get("offset")!, material.textureOffset);

            for (const data of this.textures)
            {
                const [slot, tex] = data;
                this.gl.activeTexture(this.gl.TEXTURE0 + slot);
                this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
                this.gl.uniform1i(this.uniforms.get(["hasAlbedo", "hasNormalMap", "hasRoughnessMap"][slot])!, tex ? 1 : 0);
            }
        }
    }

    public setTexture(slot: number, tex: WebGLTexture | null)
    {
        if (tex)
        {
            this.textures.set(slot, tex);
        }
        else
        {
            this.textures.delete(slot);
        }
    }

    public render(mode: RenderMode, viewMatrices: ViewMatrices, worldMatrix: Matrix4x4, light: DirectionalLight)
    {
        if (mode === RenderMode.Shadow && !this.castShadows)
        {
            return;
        }

        const { viewMatrix, viewProjectionMatrix } = viewMatrices;

        this.gl.useProgram(mode === RenderMode.Normal ? this.program : this.shadowProgram);
        this.gl.bindVertexArray(this.vao);

        if (mode === RenderMode.Normal)
        {
            const worldViewMatrix = viewMatrix.clone().multiply(worldMatrix);
            const worldViewProjectionMatrix = viewProjectionMatrix.clone().multiply(worldMatrix);
            const worldViewNormalMatrix = worldViewMatrix.topLeft3x3().invert() /* .transpose() */;
            const worldNormalMatrix = worldMatrix.topLeft3x3().invert() /* .transpose() */;

            this.gl.uniformMatrix4fv(this.uniforms.get("worldViewMat")!, false, worldViewMatrix);
            this.gl.uniformMatrix4fv(this.uniforms.get("worldViewProjMat")!, false, worldViewProjectionMatrix);
            this.gl.uniformMatrix3fv(this.uniforms.get("worldViewNormalMat")!, true, worldViewNormalMatrix);
            this.gl.uniformMatrix4fv(this.uniforms.get("worldMat")!, false, worldMatrix);
            this.gl.uniformMatrix3fv(this.uniforms.get("worldNormalMat")!, true, worldNormalMatrix);
            this.gl.uniform3fv(this.uniforms.get("lightPos")!,
                light.transform.position.clone()
                    .add(viewMatrices.cameraPosition)
                    .applyMatrix4x4(light.transform.matrix().preMultiply(viewMatrix))
                    .normalize()
            );
            this.gl.uniform3fv(this.uniforms.get("lightPosWorld")!, light.transform.position.clone().normalize());

            this.prepareMaterial();

            this.gl.activeTexture(this.gl.TEXTURE3);
            this.gl.bindTexture(this.gl.TEXTURE_2D, light.depthTexture);

            this.gl.uniformMatrix4fv(this.uniforms.get("shadowMVP")!, false, light.depthMVP);
            this.gl.uniform3fv(this.uniforms.get("playerPosition")!, viewMatrices.playerPosition);
        }
        else
        {
            this.gl.activeTexture(this.gl.TEXTURE0);
            this.gl.bindTexture(this.gl.TEXTURE_2D, null);
            this.gl.uniformMatrix4fv(light.worldMatLocation, false, worldMatrix);
        }

        this.gl.drawElements(this.gl.TRIANGLES, this.triangleCount, this.gl.UNSIGNED_INT, 0);

        this.gl.bindVertexArray(null);
    }
}
