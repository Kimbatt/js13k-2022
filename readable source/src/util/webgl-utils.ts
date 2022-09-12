
export function CreateWebglProgram(gl: WebGL2RenderingContext, vertexShaderSource: string, fragmentShaderSource: string, ...uniforms: string[])
{
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

    const vertShaderObj = CreateShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragShaderObj = CreateShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

    const program = gl.createProgram()!;

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

    // gl.useProgram(program);

    const uniformLocations = new Map<string, WebGLUniformLocation>();
    uniforms.forEach(u => uniformLocations.set(u, gl.getUniformLocation(program, u)!));

    return { program, uniformLocations };
}
