
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d")!;

function DrawImageToCanvas(gl: WebGL2RenderingContext, w: number, h: number, drawFn: () => void)
{
    canvas.width = w;
    canvas.height = h;
    drawFn();

    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

    const ext = gl.getExtension("EXT_texture_filter_anisotropic");
    ext && gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(16, gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.generateMipmap(gl.TEXTURE_2D);

    return tex;
}

export async function ImageToWebglTexture(gl: WebGL2RenderingContext, w: number, h: number, imgSrc: string)
{
    return await new Promise<WebGLTexture>(resolve =>
    {
        const img = new Image();
        img.onload = () => resolve(DrawImageToCanvas(gl, w, h, () => ctx.drawImage(img, 0, 0, w, h)));
        img.src = imgSrc;
    });
}

export function CanvasDrawingToWebglTexture(gl: WebGL2RenderingContext, w: number, h: number,
    fn: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => void)
{
    return DrawImageToCanvas(gl, w, h, () => fn(canvas, ctx));
}
