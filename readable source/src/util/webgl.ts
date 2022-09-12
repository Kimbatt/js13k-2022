
export function CreateWebglCanvas(appendCanvas = false, canvas: HTMLCanvasElement = document.createElement("canvas"))
{
    const gl = canvas.getContext("webgl2")!;

    if (appendCanvas)
    {
        document.body.appendChild(canvas);
        canvas.style.border = "2px solid red";
    }

    const vertexShader = `#version 300 es
in vec2 aVertexPosition;
uniform float uAspect;
out vec2 vPixelCoord;
void main()
{
    vPixelCoord = (aVertexPosition + vec2(1)) * 0.5;
    gl_Position = vec4(aVertexPosition, 0, 1);
}`;

    function LogShader(shaderSource: string)
    {
        const lines = shaderSource.split("\n");
        const padCount = Math.log10(lines.length + 1) | 0 + 4;
        console.error("\n" + lines.map((line, idx) => (idx + 1).toString().padEnd(padCount, " ") + line).join("\n"));
    }

    function CreateShader(shaderType: number, shaderSource: string)
    {
        const shaderObj = gl.createShader(shaderType);
        if (!shaderObj)
        {
            throw new Error("Cannot create shader object");
        }

        gl.shaderSource(shaderObj, shaderSource);
        gl.compileShader(shaderObj);

        const shaderError = gl.getShaderInfoLog(shaderObj);
        if (shaderError && shaderError.length !== 0)
        {
            console.error(shaderError);
            LogShader(shaderSource);
            throw new Error(`Error compiling ${shaderType === gl.VERTEX_SHADER ? "vertex" : "fragment"} shader`);
        }

        return shaderObj;
    }

    const vertShaderObj = CreateShader(gl.VERTEX_SHADER, vertexShader);

    const vertexBuffer = gl.createBuffer()!;
    const vertexPositions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexPositions, gl.STATIC_DRAW);

    const framebuffer = gl.createFramebuffer()!;

    function DrawWithShader(shaderFunctions: string[], shaderMainImage: string, width: number, height: number,
        inputTextures: WebGLTexture[], resultTexture: WebGLTexture)
    {
        // size setup
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);

        // shader and program setup
        const fragmentShaderSource = `#version 300 es
precision highp float;
in vec2 vPixelCoord;
out vec4 outColor;

uniform float uAspect;
const vec2 pixelSize = vec2(${1 / width}, ${1 / height});

${inputTextures.map((_, idx) => `uniform sampler2D t${idx};`).join("\n")}

${shaderFunctions.join("\n")}

void main()
{
${shaderMainImage}
}`;

        const program = gl.createProgram()!;
        const fragShaderObj = CreateShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

        gl.attachShader(program, vertShaderObj);
        gl.attachShader(program, fragShaderObj);
        gl.linkProgram(program);

        const success = gl.getProgramParameter(program, gl.LINK_STATUS) as boolean;

        const programInfo = gl.getProgramInfoLog(program);
        if (programInfo && programInfo.length !== 0)
        {
            if (success)
            {
                console.warn(programInfo);
            }
            else
            {
                console.error(programInfo);
                throw new Error("Error linking program");
            }
        }

        gl.useProgram(program);

        // setup attributes and uniforms
        const vertexLocation = gl.getAttribLocation(program, "aVertexPosition");
        gl.uniform1f(gl.getUniformLocation(program, "uAspect"), width / height);

        // textures
        inputTextures.forEach((tex, idx) =>
        {
            gl.activeTexture(gl.TEXTURE0 + idx);
            gl.bindTexture(gl.TEXTURE_2D, tex);
            const loc = gl.getUniformLocation(program, "t" + idx);
            gl.uniform1i(loc, idx);
        });

        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, resultTexture, 0);

        // draw
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.enableVertexAttribArray(vertexLocation);
        gl.vertexAttribPointer(vertexLocation, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexPositions.length / 2);

        // cleanup
        gl.deleteShader(fragShaderObj);
        gl.deleteProgram(program);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        gl.bindTexture(gl.TEXTURE_2D, resultTexture);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    function CreateTexture(width: number, height: number)
    {
        const tex = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB10_A2, width, height, 0, gl.RGBA, gl.UNSIGNED_INT_2_10_10_10_REV, null);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

        // only needed for non power of 2 textures
        // {
        //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        // }

        const ext = gl.getExtension("EXT_texture_filter_anisotropic");
        ext && gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(16, gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));

        return tex;
    }

    function DeleteTexture(texture: WebGLTexture)
    {
        gl.deleteTexture(texture);
    }

    // for debug
    function GetTexturePixels(texture: WebGLTexture, width: number, height: number, pixels?: Uint8ClampedArray)
    {
        pixels ??= new Uint8ClampedArray(width * height * 4);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        return pixels;
    }

    async function TextureToImage(texture: WebGLTexture, width: number, height: number)
    {
        DrawTexture(texture, width, height);
        const dataUrl = canvas.toDataURL();

        return await new Promise<HTMLImageElement>((resolve, reject) =>
        {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = dataUrl;
        });
    }

    const debugDrawVertexShader = `attribute vec2 aVertexPosition;
varying vec2 vPixelCoord;
void main()
{
    vPixelCoord = (aVertexPosition + vec2(1.0)) * 0.5;
    gl_Position = vec4(aVertexPosition, 0.0, 1.0);
}`;

    const debugDrawFragmentShader = `precision highp float;
varying vec2 vPixelCoord;
uniform sampler2D tex;

void main()
{
    gl_FragColor = texture2D(tex, vPixelCoord);
}`;

    const debugDrawProgram = gl.createProgram()!;
    gl.attachShader(debugDrawProgram, CreateShader(gl.VERTEX_SHADER, debugDrawVertexShader));
    gl.attachShader(debugDrawProgram, CreateShader(gl.FRAGMENT_SHADER, debugDrawFragmentShader));
    gl.linkProgram(debugDrawProgram);

    const debugDrawVertexLocation = gl.getAttribLocation(debugDrawProgram, "aVertexPosition");

    function DrawTexture(texture: WebGLTexture, width: number, height: number)
    {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);

        gl.useProgram(debugDrawProgram);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);


        // draw
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.enableVertexAttribArray(debugDrawVertexLocation);
        gl.vertexAttribPointer(debugDrawVertexLocation, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexPositions.length / 2);
    }

    return { DrawWithShader, CreateTexture, DeleteTexture, GetTexturePixels, DrawTexture, TextureToImage, canvas };
}
