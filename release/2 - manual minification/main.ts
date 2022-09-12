
(async () =>
{

const canvas = document.createElement("canvas");

canvas.style.position = "absolute";
canvas.style.top = "0px";
canvas.style.left = "0px";

const gl = canvas.getContext("webgl2")!;

function NormalMapShader(intensity: number, invert = false)
{
    intensity = invert ? -intensity : intensity;
    return `
const vec3 off = vec3(-1, 1, 0);

float top = texture(t0, vPixelCoord + pixelSize * off.zy).x;
float bottom = texture(t0, vPixelCoord + pixelSize * off.zx).x;
float left = texture(t0, vPixelCoord + pixelSize * off.xz).x;
float right = texture(t0, vPixelCoord + pixelSize * off.yz).x;

vec3 normal = vec3(float(${intensity}) * (left - right), float(${intensity}) * (bottom - top), pixelSize.y * 100.0);
outColor = vec4(normalize(normal) * 0.5 + 0.5, 1);
`;
}


// https://iquilezles.org/www/articles/fbm/fbm.htm
// https://www.shadertoy.com/view/XdXGW8

const FBM = `
vec2 grad(ivec2 z)
{
int n = z.x + z.y * 11111;
n = (n << 13) ^ n;
n = (n * (n * n * 15731 + 789221) + 1376312589) >> 16;
return vec2(cos(float(n)), sin(float(n)));
}

float noise(vec2 p)
{
ivec2 i = ivec2(floor(p));
vec2 f = fract(p);
vec2 u = f * f * (3.0 - 2.0 * f);
ivec2 oi = ivec2(0, 1);
vec2 of = vec2(oi);
return mix(mix(dot(grad(i + oi.xx), f - of.xx),
dot(grad(i + oi.yx), f - of.yx), u.x),
mix(dot(grad(i + oi.xy), f - of.xy),
dot(grad(i + oi.yy), f - of.yy), u.x), u.y)
* 0.5 + 0.5;
}
float fbm(vec2 p, int numOctaves, float scale, float lacunarity)
{
float t = 0.0;
float z = 1.0;
for (int i = 0; i < numOctaves; ++i)
{
z *= 0.5;
t += z * noise(p * scale);
p = p * lacunarity;
}
return t / (1.0 - z);
}
`;



interface TextureCollection
{
    albedo: WebGLTexture;
    normalMap: WebGLTexture;
    roughness: WebGLTexture;
}

// x - cell color, y - distance to cell
const VoronoiGrayscale = `
vec2 voronoi(vec2 x, float w)
{
vec2 n = floor(x);
vec2 f = fract(x);
vec2 m = vec2(0.0, 8.0);
for (int j = -2; j <= 2; ++j)
for (int i = -2; i <= 2; ++i)
{
vec2 g = vec2(i, j);
vec2 o = hash2(n + g);
float d = length(g - f + o);
float col = 0.5 + 0.5 * sin(hash1(dot(n + g, vec2(7.0, 113.0))) * 2.5 + 5.0);
float h = smoothstep(0.0, 1.0, 0.5 + 0.5 * (m.y - d) / w);
m.y = mix(m.y, d, h) - h * (1.0 - h) * w / (1.0 + 3.0 * w); // distance
m.x = mix(m.x, col, h) - h * (1.0 - h) * w / (1.0 + 3.0 * w); // color
}

return m;
}
`;


const ShaderUtils = `
float hash1(float n)
{
return fract(sin(n) * 43758.5453);
}
vec2 hash2(vec2 p)
{
p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
return fract(sin(p)*43758.5453);
}
float saturate(float x)
{
return clamp(x, 0.0, 1.0);
}
float unlerp(float a, float b, float x)
{
return (x - a) / (b - a);
}
float remap(float from0, float from1, float to0, float to1, float x)
{
return mix(to0, to1, unlerp(from0, from1, x));
}
float sharpstep(float edge0, float edge1, float x)
{
return saturate(unlerp(edge0, edge1, x));
}
vec4 colorRamp2(vec4 colorA, float posA, vec4 colorB, float posB, float t)
{
return mix(colorA, colorB, sharpstep(posA, posB, t));
}
float valueRamp2(float colorA, float posA, float colorB, float posB, float t)
{
return mix(colorA, colorB, sharpstep(posA, posB, t));
}
`;

const edgeBlend = (fnName: string, blend = 0.2) => `
vec4 edgeBlend(vec2 uv)
{
const vec2 fadeWidth = vec2(${blend});
const vec2 scaling = 1.0 - fadeWidth;
vec2 offsetuv = uv * scaling;
vec2 blend = clamp((uv - scaling) / fadeWidth, 0.0, 1.0);
return
blend.y * blend.x * ${fnName}(fract(offsetuv + (fadeWidth * 2.0))) +
blend.y * (1.0 - blend.x) * ${fnName}(vec2(fract(offsetuv.x + fadeWidth.x), fract(offsetuv.y + (fadeWidth.y * 2.0)))) +
(1.0 - blend.y) * (1.0 - blend.x) * ${fnName}(fract(offsetuv + fadeWidth)) +
(1.0 - blend.y) * blend.x * ${fnName}(vec2(fract(offsetuv.x + (fadeWidth.x * 2.0)), fract(offsetuv.y + fadeWidth.y)));
}

`;

// Generated with Shader Minifier 1.2 - http://www.ctrl-alt-test.fr
var var_AVERTEXPOSITION = "e"
var var_ALBEDO = "p"
var var_BASECOLOR = "S"
var var_DEPTHMVP = "q"
var var_DEPTHMAP = "a"
var var_FRAGCOLOR = "m"
var var_HASALBEDO = "D"
var var_HASNORMALMAP = "g"
var var_HASROUGHNESSMAP = "P"
var var_HUESHIFT = "r"
var var_LIGHTINTENSITY = "X"
var var_LIGHTPOS = "T"
var var_LIGHTPOSWORLD = "R"
var var_METALLIC = "Y"
var var_MODELNORMAL = "L"
var var_MODELPOS = "M"
var var_NORMALMAP = "d"
var var_OFFSET = "U"
var var_PLAYERPOSITION = "Q"
var var_ROUGHNESS = "Z"
var var_ROUGHNESSMAP = "w"
var var_SCALE = "V"
var var_SHADOWMVP = "i"
var var_SHADOWPOS = "v"
var var_SHARPNESS = "W"
var var_SUNPOS = "f"
var var_TEX = "B"
var var_UTIME = "n"
var var_UV = "A"
var var_VDIRECTION = "x"
var var_VNORMAL = "F"
var var_VPOSITION = "G"
var var_VERTEXPOSITION = "o"
var var_VIEWNORMAL = "N"
var var_VIEWPOS = "O"
var var_VIEWPROJECTIONMATRIX = "c"
var var_WORLDMAT = "t"
var var_WORLDNORMAL = "J"
var var_WORLDNORMALMAT = "h"
var var_WORLDPOS = "K"
var var_WORLDVIEWMAT = "E"
var var_WORLDVIEWNORMALMAT = "b"
var var_WORLDVIEWPROJMAT = "C"

var lava_vs = `#version 300 es
layout(location=0)in vec4 e;out vec2 o;out vec4 v;uniform mat4 c,t,i;void main(){o=e.xy,o.y+=e.z,v=i*t*e*.5+.5,gl_Position=c*t*e;}`

var lava_fs = `#version 300 es
precision highp float;precision highp sampler2DShadow;uniform float n;uniform sampler2DShadow a;uniform bool r;in vec2 o;in vec4 v;out vec4 m;
${ShaderUtils}
${FBM}
vec3 l(vec3 k,vec2 A,float j,float aa,float ab,float ac,float ad){vec3 ae=vec3(.1+abs(sin(n))*.03,.02,.02);A*=j;float af=1.;vec2 ag=floor(A),ah=fract(A);float ai=noise(A)*ad;for(int aj=-1;aj<=1;++aj)for(int ak=-1;ak<=1;++ak){vec2 al=vec2(aj,ak),am=hash2(ag+al)+ai;am=.5+.5*sin(n*.35+6.2831*am);af=min(af,length(al+am-ah));}float an=noise(A*.1+n*.2*ac)-.8;an*=6.;vec3 ao=vec3(k*pow(af,aa+an*.95)*ab);ao=mix(ae,ao,af);return ao;}void main(){vec2 A=o*.1;m=vec4(0,0,0,1);m.xyz+=l(vec3(1.5,.4,0),A,3.,2.5,1.15,.5,.5);m.xyz+=l(vec3(1.5,0,0),A,6.,3.,.4,.3,0.);m.xyz+=l(vec3(1.2,.4,0),A,8.,4.,.2,.6,.5);if(r)m=m.yxzx;else{float ap=0.;vec3 aq=v.xyz/v.w;vec2 ar=abs(vec2(.5)-aq.xy);if(aq.z>1.||ar.x>.5||ar.y>.5)ap=1.;else ap=texture(a,aq)*.5+.5;m.xyz=min(m.xyz,vec3(1))*ap;}}`

var skybox_fs = `#version 300 es
precision highp float;in vec3 x;out vec4 m;uniform vec3 f;const float u=.2;const vec3 s=vec3(1.,.2,0.),y=vec3(1,.9,.8);vec3 l(float as){return max(exp(-pow(as,.3))*y-.4,0.);}vec3 z(vec3 at){float au=distance(at,f)*2.,av=min(au,1.),aw=1.-smoothstep(.01,.011,av),as=max(at.y+.2,.001);as=u*mix(av,1.,as)/as;vec3 ax=l(au),k=as*s;k=max(mix(pow(k,1.-k),k/(2.*k+.5-k),clamp(f.y*2.,0.,1.)),0.)+aw+ax;k*=pow(1.-av,10.)*8.+1.;float ay=abs(f.y*.5-.5);return mix(k,vec3(0.),min(ay,1.));}void main(){m=vec4(z(normalize(x)),1);}`

var skybox_vs = `#version 300 es
layout(location=0)in vec3 e;out vec3 x;uniform mat4 c;void main(){x=e,gl_Position=(mat3(c)*x).xyzz;}`

var standard_material_fs = `#version 300 es
precision highp float;precision highp sampler2DShadow;uniform sampler2D p,d,w;uniform sampler2DShadow a;uniform mat3 h,b;uniform bool D,g,P;uniform vec4 S;uniform float Z,Y,X,W;uniform vec3 V,U,T,R,Q;in vec3 O,N,M,L,K,J;in vec4 v;out vec4 m;vec3 I(vec3 az){vec3 aA=pow(abs(az),vec3(W));float aB=dot(aA,vec3(1));return aA/vec3(aB);}vec4 I(sampler2D B,vec3 aC,vec3 az){vec3 aD=I(az);vec4 aE=texture(B,aC.yz),aF=texture(B,aC.zx),aG=texture(B,aC.xy);return aE*aD.x+aF*aD.y+aG*aD.z;}vec3 l(sampler2D B,vec3 aC,vec3 az){vec3 aD=I(az);vec2 aH=aC.zy,aI=aC.xz,aJ=aC.xy;vec3 aK=texture(B,aH).xyz*2.-1.,aL=texture(B,aI).xyz*2.-1.,aM=texture(B,aJ).xyz*2.-1.,aN=vec3(0.,aK.yx),aO=vec3(aL.x,0.,aL.y),aP=vec3(aM.xy,0.);return normalize(aN*aD.x+aO*aD.y+aP*aD.z+az);}const float H=acos(-1.);float I(vec3 aQ,vec3 aR){return max(dot(aQ,aR),0.);}vec3 l(vec3 k,float aS){return k+(1.-k)*pow(1.-aS,5.);}vec3 I(vec3 aT,vec3 aU,vec3 aV,vec3 aW,vec3 aX,vec3 aY,vec3 aZ,float ba){float bb=I(aT,aV);vec3 bc=normalize(aV+aU),bd=l(aZ,dot(aV,bc));float be=pow(I(aT,bc),ba)*(ba+2.)/8.;vec3 bf=bd*be,bg=aY;float ap=0.;vec3 aq=v.xyz/v.w;vec2 ar=abs(vec2(.5)-aq.xy);if(aq.z>1.||ar.x>.5||ar.y>.5)ap=1.;else{float bh=max(.001*(1.-dot(normalize(J),R)),1e-4);aq.z-=bh/v.w;ap=texture(a,aq);}float as=distance(K.xz,Q.xz),bi=1.-smoothstep(.45,.5,as);bi*=smoothstep(0.,.4,Q.y-K.y);ap*=1.-bi;vec3 bj=ap*(bg+bf)*bb*aW;bj+=aY*aX;return bj;}vec3 z(vec3 aT,vec3 aU){vec3 bk=M,bl=normalize(L);aT=g?normalize(b*l(d,bk*V+U,bl)):aT;vec3 bm=D?I(p,bk*V+U,bl).xyz*S.xyz:S.xyz;float bn=P?I(w,bk*V+U,bl).x:Z;const vec3 bo=vec3(.04,.04,.04),bp=vec3(0.,0.,0.);vec3 aY=mix(bm*(1.-bo.x),bp,Y)/H,aZ=mix(bo,bm,Y);bn=1.2-.2/clamp(bn,1e-5,.99999);float ba=log(2.-bn)*185.;vec3 bj=vec3(0.,0.,0.),aV=T,bq=vec3(1.,.8,.5),br=vec3(1.,.9,.7)*1.5*(1.-I(J,-R)*.1);bj+=I(aT,aU,aV,bq,br,aY,aZ,ba);return bj;}void main(){vec3 aT=normalize(N),aU=normalize(-O),bs=z(aT,aU);m=vec4(bs,S.w);}`

var standard_material_vs = `#version 300 es
layout(location=0)in vec4 G;layout(location=1)in vec3 F;out vec3 O,N,M,L,K,J;out vec4 v;uniform mat4 t;uniform mat3 h;uniform mat4 E;uniform mat3 b;uniform mat4 C,i;void main(){O=(E*G).xyz,N=b*F,M=G.xyz,L=F,K=(t*G).xyz,J=h*F,gl_Position=C*G,v=i*t*G*.5+.5;}`

var shadow_fs = `#version 300 es
precision highp float;uniform sampler2D B;in vec2 A;void main(){if(texture(B,A).w<.5)discard;}`

var shadow_vs = `#version 300 es
layout(location=0)in vec4 G;out vec2 A;uniform mat4 q,t;void main(){A=G.xy+.5,gl_Position=q*t*G;}`






document.title = "The Deadly™ Obstacle Course";
await new Promise(requestAnimationFrame);

function Mulberry32(seed: number)
{
    return () =>
    {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

type FixedLengthArray<T, L extends number, TObj = [T, ...Array<T>]> =
    Pick<TObj, Exclude<keyof TObj, 'splice' | 'push' | 'pop' | 'shift' | 'unshift'>> & {
        readonly length: L
        [I: number]: T
        [Symbol.iterator]: () => IterableIterator<T>
    };


function Lerp(a: number, b: number, t: number)
{
    return a + (b - a) * t;
}

function Unlerp(a: number, b: number, x: number)
{
    return (x - a) / (b - a);
}

function Clamp(x: number, a: number, b: number)
{
    return x < a ? a : (x > b ? b : x);
}

function Smoothstep(edge0: number, edge1: number, x: number)
{
    const t = Clamp(Unlerp(edge0, edge1, x), 0, 1);
    return t * t * (3 - 2 * t);
}


abstract class VectorBase<Length extends number> extends Float32Array
{
    constructor(len: Length, elements?: FixedLengthArray<number, Length> | VectorBase<Length>)
    {
        super(len);
        this.set(elements ?? []);
    }

    public abstract get new(): this;
    public clone()
    {
        return this.new.set(this);
    }

    public set(array: ArrayLike<number>, offset?: number | undefined)
    {
        super.set(array, offset);
        return this;
    }

    public copyFrom(other: VectorBase<Length>)
    {
        return this.set(other);
    }

    public setValues(...vals: FixedLengthArray<number, Length>)
    {
        return this.set(vals);
    }

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

    public mulScalar(other: number)
    {
        for (let i = 0; i < super.length; ++i)
        {
            this[i] *= other;
        }

        return this;
    }

    public dot(other: VectorBase<Length>): number
    {
        return this.new.copyFrom(this).mul(other).csum;
    }

    public get lengthSqr()
    {
        return this.dot(this);
    }

    public get length()
    {
        return Math.sqrt(this.lengthSqr);
    }

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

    public normalize()
    {
        return this.mulScalar(1 / this.length);
    }

    public safeNormalize()
    {
        const len = this.length;
        return len > 1e-9 ? this.mulScalar(1 / len) : this.setScalar(0);
    }

    public lerpVectors(a: VectorBase<Length>, b: VectorBase<Length>, t: number)
    {
        for (let i = 0; i < super.length; ++i)
        {
            this[i] = Lerp(a[i], b[i], t);
        }

        return this;
    }

    public lerp(other: VectorBase<Length>, t: number)
    {
        return this.lerpVectors(this, other, t);
    }
}

class Vector3 extends VectorBase<3>
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

    public crossVectors(a: this, b: this)
    {
        return this.setValues(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
    }

    public cross(other: this)
    {
        return this.crossVectors(this, other);
    }

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

class Vector2 extends VectorBase<2>
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
class Quaternion extends VectorBase<4>
{
    constructor(x = 0, y = 0, z = 0, w = 1)
    {
        super(4, [x, y, z, w]);
    }

    // @ts-ignore
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
        this[3] *= -1;
        return this;
    }
}

// https://github.com/mrdoob/three.js/blob/dev/src/math/Matrix3.js
class Matrix3x3 extends Float32Array
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

    public set(array: FixedLengthArray<number, 9> | Matrix3x3, offset?: number | undefined)
    {
        super.set(array, offset);
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
class Matrix4x4 extends Float32Array
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

    public clone()
    {
        return new Matrix4x4(this);
    }

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

    public topLeft3x3()
    {
        return new Matrix3x3([this[0], this[1], this[2], this[4], this[5], this[6], this[8], this[9], this[10]]);
    }
}






const wasmModule = await WebAssembly.instantiateStreaming(fetch("w.wasm"), {});

const wasm = wasmModule.instance.exports as any & WebAssembly.Exports;

function Matrix4x4Multiply(a: Matrix4x4, b: Matrix4x4, target: Matrix4x4)
{
    target.set(wasm["m4m"](...a, ...b));
}

function Matrix4x4Compose(pos: Vector3, rot: Quaternion, scale: Vector3, target: Matrix4x4)
{
    target.set(wasm["m4c"](...pos, ...rot, ...scale));
}

// unused
// function Matrix3x3Multiply(a: Matrix3x3, b: Matrix3x3, target: Matrix3x3)
// {
//     target.set(wasm.m3m(...a, ...b));
// }

function Matrix3x3Invert(m: Matrix3x3, target: Matrix3x3)
{
    target.set(wasm["m3i"](...m));
}

// unused
// function QuaternionMultiply(a: Quaternion, b: Quaternion, target: Quaternion)
// {
//     target.set(wasm.qm(...a, ...b));
// }

function PointQuaternionMultiply(p: Vector3, q: Quaternion, target: Vector3)
{
    target.set(wasm["pqm"](...p, ...q));
}








class Transform
{
    public position = new Vector3();
    public rotation = new Quaternion();
    public scale = new Vector3(1, 1, 1);

    public matrix()
    {
        return new Matrix4x4().compose(this.position, this.rotation, this.scale);
    }

    public matrixInverse()
    {
        const invRotation = this.rotation.clone().invert();
        return new Matrix4x4().compose(
            this.position.clone().mulScalar(-1).applyQuaternion(invRotation),
            invRotation,
            new Vector3(1, 1, 1).div(this.scale)
        );
    }
}



function CreateWebglProgram(vertexShaderSource: string, fragmentShaderSource: string, ...uniforms: string[])
{
    function CreateShader(shaderType: number, shaderSource: string)
    {
        const shaderObj = gl.createShader(shaderType)!;
        gl.shaderSource(shaderObj, shaderSource);
        gl.compileShader(shaderObj);
        return shaderObj;
    }

    const vertShaderObj = CreateShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragShaderObj = CreateShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

    const program = gl.createProgram()!;

    gl.attachShader(program, vertShaderObj);
    gl.attachShader(program, fragShaderObj);
    gl.linkProgram(program);

    const uniformLocations = new Map<string, WebGLUniformLocation>();
    uniforms.forEach(u => uniformLocations.set(u, gl.getUniformLocation(program, u)!));

    return { program, uniformLocations };
}


interface Material
{
    r: number;
    g: number;
    b: number;
    a: number;
    metallic?: number;
    roughness?: number;
    textureScale?: Vector3;
    textureOffset?: Vector3;
    textureBlendSharpness?: number;
}

let standardMaterialProgram: ReturnType<typeof CreateWebglProgram> | null = null;
function GetOrCreateStandardMaterial()
{
    if (standardMaterialProgram === null)
    {
        const vertexShaderSource = standard_material_vs;
        const fragmentShaderSource = standard_material_fs;

        standardMaterialProgram = CreateWebglProgram(vertexShaderSource, fragmentShaderSource,
            var_WORLDVIEWMAT, var_WORLDVIEWNORMALMAT, var_WORLDVIEWPROJMAT, var_WORLDMAT, var_WORLDNORMALMAT, var_SHADOWMVP,
            var_ALBEDO, var_NORMALMAP, var_ROUGHNESSMAP, var_DEPTHMAP,
            var_HASALBEDO, var_HASNORMALMAP, var_HASROUGHNESSMAP,
            var_BASECOLOR, var_METALLIC, var_ROUGHNESS, var_LIGHTINTENSITY,
            var_SHARPNESS, var_SCALE, var_OFFSET,
            var_LIGHTPOS, var_LIGHTPOSWORLD, var_PLAYERPOSITION
        );

        gl.useProgram(standardMaterialProgram.program);
        gl.uniform1i(standardMaterialProgram.uniformLocations.get(var_ALBEDO)!, 0);
        gl.uniform1i(standardMaterialProgram.uniformLocations.get(var_NORMALMAP)!, 1);
        gl.uniform1i(standardMaterialProgram.uniformLocations.get(var_ROUGHNESSMAP)!, 2);
        gl.uniform1i(standardMaterialProgram.uniformLocations.get(var_DEPTHMAP)!, 3);
    }

    return standardMaterialProgram;
}

let shadowProgram: ReturnType<typeof CreateWebglProgram> | null = null;
function GetOrCreateShadowProgram()
{
    if (shadowProgram === null)
    {
        shadowProgram = CreateWebglProgram(shadow_vs, shadow_fs,
            var_DEPTHMVP, var_WORLDMAT, var_TEX
        );
    }

    return shadowProgram;
}



const enum RenderMode
{
    Normal, Shadow
}

interface ViewMatrices
{
    viewMatrix: Matrix4x4;
    viewProjectionMatrix: Matrix4x4;
    cameraPosition: Vector3;
    playerPosition: Vector3;
}

class SceneNode
{
    public children = new Set<SceneNode>();
    protected parent: SceneNode | null = null;
    public transform = new Transform();

    public visible = true;
    public renderOrder = 0;

    public add(node: SceneNode)
    {
        this.children.add(node);
        node.parent = this;
    }

    public remove(node: SceneNode)
    {
        this.children.delete(node);
        node.parent = null;
    }

    public setParent(parent?: SceneNode)
    {
        this.parent?.remove(this);
        parent?.add(this);
    }

    public traverse(callback: (node: SceneNode) => void)
    {
        callback(this);
        this.children.forEach(callback);
    }

    public localToWorldMatrix(): Matrix4x4
    {
        const mat = this.transform.matrix();
        return this.parent?.localToWorldMatrix().clone().multiply(mat) ?? mat.clone();
    }

    public worldToLocalMatrix(): Matrix4x4
    {
        // TODO: test this to make sure this is correct
        // seems to work without parents, but not tested with parents
        const mat = this.transform.matrixInverse();
        return this.parent?.worldToLocalMatrix().clone().preMultiply(mat) ?? mat.clone();
    }

    public get worldPosition()
    {
        return this.transform.position.clone().applyMatrix4x4(this.localToWorldMatrix());
    }

    public render(_mode: RenderMode, _viewMatrices: ViewMatrices, _worldMatrix: Matrix4x4, _light: DirectionalLight) { }

    public dispose() { }
}

class Camera extends SceneNode
{
    public projectionMatrix = new Matrix4x4();

    public setProjectionMatrixPerspecive(fov = 75, aspect = 1, near = 0.01, far = 100)
    {
        //                          to radian, x0.5
        const top = near * Math.tan(0.00872664626 * fov);
        const height = 2 * top;
        const width = aspect * height;
        const left = width / -2;
        this.projectionMatrix.makePerspective(left, left + width, top, top - height, near, far);
    }

    public setProjectionMatrixOrthographic(width = 4, height = 4, near = 0.01, far = 100)
    {
        const dx = width / 2;
        const dy = height / 2;
        this.projectionMatrix.makeOrthographic(-dx, dx, dy, -dy, near, far);
    }
}

class DirectionalLight extends Camera
{
    public depthFrameBuffer: WebGLFramebuffer;
    public depthTexture: WebGLTexture;
    public depthMVP = new Matrix4x4();
    public resolution: number;
    public worldMatLocation: WebGLUniformLocation;
    public target = new Vector3();

    constructor(size: number)
    {
        super();

        this.resolution = Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE), 2048);

        const near = -150;
        const far = 150;
        this.setProjectionMatrixOrthographic(size, size, near, far);

        this.depthFrameBuffer = gl.createFramebuffer()!;
        this.depthTexture = gl.createTexture()!;

        gl.bindTexture(gl.TEXTURE_2D, this.depthTexture);
        // use DEPTH_STENCIL for higher depth precision
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH24_STENCIL8, this.resolution, this.resolution, 0, gl.DEPTH_STENCIL, gl.UNSIGNED_INT_24_8, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.depthFrameBuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.TEXTURE_2D, this.depthTexture, 0);

        this.worldMatLocation = GetOrCreateShadowProgram().uniformLocations.get(var_WORLDMAT)!;
    }

    public prepare(camera: Camera, centerDistanceFromCamer: number)
    {
        const lightDirection = this.transform.position.clone().sub(this.target).normalize();

        const frustumCenter = new Vector3(0, 0, -centerDistanceFromCamer).applyMatrix4x4(camera.localToWorldMatrix());
        const lightView = new Matrix4x4().lookAt(frustumCenter.clone().add(lightDirection), frustumCenter, new Vector3(0, 1, 0));

        this.depthMVP.copy(this.projectionMatrix).multiply(lightView);
        const shadowProgram = GetOrCreateShadowProgram();
        gl.useProgram(shadowProgram.program);
        gl.uniformMatrix4fv(shadowProgram.uniformLocations.get(var_DEPTHMVP)!, false, this.depthMVP);
    }
}

class Scene extends SceneNode
{
    public light: DirectionalLight;
    public playerPosition = new Vector3();

    constructor()
    {
        super();

        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);

        this.light = new DirectionalLight(70);
        this.light.transform.position.setValues(0, 1, 1);
    }

    public renderScene(camera: Camera)
    {
        // shadow maps first
        gl.viewport(0, 0, this.light.resolution, this.light.resolution);
        // gl.cullFace(gl.FRONT);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.light.depthFrameBuffer);
        gl.clear(gl.DEPTH_BUFFER_BIT);
        this.light.prepare(camera, 35);
        this.renderSceneInternal(this.light, RenderMode.Shadow, this.light);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        // gl.cullFace(gl.BACK);

        // normal render
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        this.renderSceneInternal(camera, RenderMode.Normal, this.light);
    }

    private renderSceneInternal(camera: Camera, mode: RenderMode, light: DirectionalLight)
    {
        const viewMatrix = camera.worldToLocalMatrix();
        const viewProjectionMatrix = camera.projectionMatrix.clone().multiply(viewMatrix);

        const viewMatrices: ViewMatrices = { viewMatrix, viewProjectionMatrix, cameraPosition: camera.worldPosition, playerPosition: this.playerPosition };

        const renderNode = (node: SceneNode, worldMatrix: Matrix4x4) =>
        {
            if (!node.visible)
            {
                return;
            }

            const currentWorldMatrix = worldMatrix.clone().multiply(node.transform.matrix());
            node.render(mode, viewMatrices, currentWorldMatrix, light);
            [...node.children]
                .sort((a, b) => a.renderOrder - b.renderOrder)
                .forEach(c => renderNode(c, currentWorldMatrix));
        };

        renderNode(this, this.localToWorldMatrix());
    }
}


interface Geometry
{
    vertices: Float32Array;
    triangles: Uint32Array;
    normals: Float32Array;
}

function JoinGeometries(...geometries: Geometry[]): Geometry
{
    const vertices: number[] = [];
    const triangles: number[] = [];
    const normals: number[] = [];

    for (const geometry of geometries)
    {
        const startIndex = vertices.length / 3;
        vertices.push(...geometry.vertices);
        normals.push(...geometry.normals);
        triangles.push(...geometry.triangles.map(tri => tri + startIndex));
    }

    return { vertices: new Float32Array(vertices), triangles: new Uint32Array(triangles), normals: new Float32Array(normals) };
}

function CreateBoxGeometry(width = 1, height = 1, depth = 1): Geometry
{
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const halfDepth = depth / 2;

    const vertices = new Float32Array([
        // back
        -halfWidth, -halfHeight, -halfDepth,
        halfWidth, -halfHeight, -halfDepth,
        -halfWidth, halfHeight, -halfDepth,
        halfWidth, halfHeight, -halfDepth,

        // front
        halfWidth, -halfHeight, halfDepth,
        -halfWidth, -halfHeight, halfDepth,
        halfWidth, halfHeight, halfDepth,
        -halfWidth, halfHeight, halfDepth,

        // bottom
        halfWidth, -halfHeight, -halfDepth,
        -halfWidth, -halfHeight, -halfDepth,
        halfWidth, -halfHeight, halfDepth,
        -halfWidth, -halfHeight, halfDepth,

        // top
        -halfWidth, halfHeight, -halfDepth,
        halfWidth, halfHeight, -halfDepth,
        -halfWidth, halfHeight, halfDepth,
        halfWidth, halfHeight, halfDepth,

        // left
        -halfWidth, -halfHeight, -halfDepth,
        -halfWidth, halfHeight, -halfDepth,
        -halfWidth, -halfHeight, halfDepth,
        -halfWidth, halfHeight, halfDepth,

        // right
        halfWidth, halfHeight, -halfDepth,
        halfWidth, -halfHeight, -halfDepth,
        halfWidth, halfHeight, halfDepth,
        halfWidth, -halfHeight, halfDepth,
    ]);

    const triangles = new Uint32Array([
        0,
        0 + 3,
        0 + 1,
        0,
        0 + 2,
        0 + 3,

        4,
        4 + 3,
        4 + 1,
        4,
        4 + 2,
        4 + 3,

        8,
        8 + 3,
        8 + 1,
        8,
        8 + 2,
        8 + 3,

        12,
        12 + 3,
        12 + 1,
        12,
        12 + 2,
        12 + 3,

        16,
        16 + 3,
        16 + 1,
        16,
        16 + 2,
        16 + 3,

        20,
        20 + 3,
        20 + 1,
        20,
        20 + 2,
        20 + 3,
    ]);

    const normals = new Float32Array([
        // front
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,

        // back
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,

        // bottom
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,

        // top
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,

        // left
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,

        // right
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
    ]);

    return { vertices, triangles, normals };
}

function CreateSphereGeometry(radius = 1, horizontalSubdivisions = 16, verticalSubdivisions = 24): Geometry
{
    // just convert normals to vertices later by multiplying with the radius
    const normals: number[] = [];
    const triangles: number[] = [];

    // note: the geometry is not closed, and contains degenerate triangles at the poles
    // but this allows the code to be smaller, and it doesn't affect the rendering anyways

    // TODO: make sure this works properly

    for (let i = 0; i < horizontalSubdivisions; ++i)
    {
        const angleY = -Math.PI / 2 + Math.PI * i / (horizontalSubdivisions - 1);
        const yCoord = Math.sin(-angleY);
        const yMultiplier = Math.cos(-angleY);

        for (let j = 0; j < verticalSubdivisions; ++j)
        {
            const angleXZ = 2 * Math.PI * j / (verticalSubdivisions - 1);
            normals.push(Math.cos(angleXZ) * yMultiplier, yCoord, Math.sin(angleXZ) * yMultiplier);
        }
    }

    // triangles
    for (let i = 0; i < horizontalSubdivisions; ++i)
    {
        const startIndex = i * verticalSubdivisions;
        const nextRowStartIndex = startIndex + verticalSubdivisions;

        for (let j = 0; j < verticalSubdivisions; ++j)
        {
            triangles.push(
                startIndex + j,
                startIndex + j + 1,
                nextRowStartIndex + j + 1,

                startIndex + j,
                nextRowStartIndex + j + 1,
                nextRowStartIndex + j
            );
        }
    }

    const normalsF32 = new Float32Array(normals);
    return { vertices: normalsF32.map(n => n * radius), triangles: new Uint32Array(triangles), normals: normalsF32 };
}

function CreateCapsuleGeometry(radius = 1, height = 1, horizontalSubdivisions = 16, verticalSubdivisions = 24)
{
    // the capsule is on the y axis
    const vertices: number[] = [];
    const normals: number[] = [];
    const triangles: number[] = [];

    // note: the geometry is not closed, and contains degenerate triangles at the poles
    // but this allows the code to be smaller, and it doesn't affect the rendering anyways

    // TODO: make sure this works properly

    for (let i = 0; i <= horizontalSubdivisions / 2; ++i)
    {
        const angleY = -Math.PI / 2 + Math.PI * i / (horizontalSubdivisions - 1);
        const yCoord = Math.sin(-angleY);
        const yMultiplier = Math.cos(-angleY);

        for (let j = 0; j < verticalSubdivisions; ++j)
        {
            const angleXZ = 2 * Math.PI * j / (verticalSubdivisions - 1);
            const x = Math.cos(angleXZ) * yMultiplier;
            const y = yCoord;
            const z = Math.sin(angleXZ) * yMultiplier;
            normals.push(x, y, z);
            vertices.push(x * radius, y * radius + height / 2, z * radius);
        }
    }

    for (let i = horizontalSubdivisions / 2; i < horizontalSubdivisions; ++i)
    {
        const angleY = -Math.PI / 2 + Math.PI * i / (horizontalSubdivisions - 1);
        const yCoord = Math.sin(-angleY);
        const yMultiplier = Math.cos(-angleY);

        for (let j = 0; j < verticalSubdivisions; ++j)
        {
            const angleXZ = 2 * Math.PI * j / (verticalSubdivisions - 1);
            const x = Math.cos(angleXZ) * yMultiplier;
            const y = yCoord;
            const z = Math.sin(angleXZ) * yMultiplier;
            normals.push(x, y, z);
            vertices.push(x * radius, y * radius - height / 2, z * radius);
        }
    }

    // triangles
    for (let i = 0; i < horizontalSubdivisions + 1; ++i)
    {
        const startIndex = i * verticalSubdivisions;
        const nextRowStartIndex = startIndex + verticalSubdivisions;

        for (let j = 0; j < verticalSubdivisions; ++j)
        {
            triangles.push(
                startIndex + j,
                startIndex + j + 1,
                nextRowStartIndex + j + 1,

                startIndex + j,
                nextRowStartIndex + j + 1,
                nextRowStartIndex + j
            );
        }
    }

    return { vertices: new Float32Array(vertices), triangles: new Uint32Array(triangles), normals: new Float32Array(normals) };
}

function CreatePlaneGeometry(width = 1, depth = 1)
{
    const halfWidth = width / 2;
    const halfDepth = depth / 2;

    const vertices = new Float32Array([
        // bottom
        halfWidth, 0, -halfDepth,
        -halfWidth, 0, -halfDepth,
        halfWidth, 0, halfDepth,
        -halfWidth, 0, halfDepth,

        // top
        -halfWidth, 0, -halfDepth,
        halfWidth, 0, -halfDepth,
        -halfWidth, 0, halfDepth,
        halfWidth, 0, halfDepth,
    ]);

    const triangles = new Uint32Array([
        0,
        0 + 3,
        0 + 1,
        0,
        0 + 2,
        0 + 3,

        4,
        4 + 3,
        4 + 1,
        4,
        4 + 2,
        4 + 3
    ]);

    const normals = new Float32Array([
        // bottom
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,

        // top
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0
    ]);

    return { vertices, triangles, normals };
}

function CreateExtrudedGeometryConvex(polyline: number[], thickness: number)
{
    // triangulated from the first point in the polygon, so it's only guaranteed to work for convex polygons
    const vertices: number[] = [];
    const triangles: number[] = [];
    const normals: number[] = [];

    const points: Vector2[] = [];
    for (let i = 0; i < polyline.length; i += 2)
    {
        points.push(new Vector2(polyline[i], polyline[i + 1]));
    }

    // front and back
    for (const point of points)
    {
        vertices.push(point.x, point.y, thickness / -2);
        vertices.push(point.x, point.y, thickness / 2);
        normals.push(0, 0, -1);
        normals.push(0, 0, 1);
    }

    for (let i = 2; i < points.length; ++i)
    {
        const i1 = i - 1;
        triangles.push(
            0, i1 * 2, i * 2,
            1, i * 2 + 1, i1 * 2 + 1
        );
    }

    // sides
    let prev = points[points.length - 1];
    for (const point of points)
    {
        const idx = vertices.length / 3;
        vertices.push(
            prev.x, prev.y, thickness / 2,
            prev.x, prev.y, thickness / -2,
            point.x, point.y, thickness / 2,
            point.x, point.y, thickness / -2,
        );

        const normal = point.clone().sub(prev).normalize();
        const x = normal.x;
        normal.x = -normal.y;
        normal.y = x;
        prev = point;

        normals.push(normal.x, normal.y, 0);
        normals.push(normal.x, normal.y, 0);
        normals.push(normal.x, normal.y, 0);
        normals.push(normal.x, normal.y, 0);

        triangles.push(idx, idx + 3, idx + 1, idx, idx + 2, idx + 3);
    }

    return { vertices: new Float32Array(vertices), triangles: new Uint32Array(triangles), normals: new Float32Array(normals) };
}


class Renderable extends SceneNode
{
    public vao: WebGLVertexArrayObject;
    public triangleCount: number;

    private vertexBuffer: WebGLBuffer;
    private indexBuffer: WebGLBuffer;

    constructor(geometry: Geometry, positionLoc: number, normalLoc?: number)
    {
        super();

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
        gl.deleteBuffer(this.vertexBuffer);
        gl.deleteBuffer(this.indexBuffer);
    }
}




function CreateWebglCanvas(canvas: HTMLCanvasElement = document.createElement("canvas"))
{
    const vertexShader = `#version 300 es
in vec2 aVertexPosition;
uniform float uAspect;
out vec2 vPixelCoord;
void main()
{
vPixelCoord = (aVertexPosition + vec2(1)) * 0.5;
gl_Position = vec4(aVertexPosition, 0, 1);
}`;

    function CreateShader(shaderType: number, shaderSource: string)
    {
        const shaderObj = gl.createShader(shaderType)!;
        gl.shaderSource(shaderObj, shaderSource);
        gl.compileShader(shaderObj);
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

    return { DrawWithShader, CreateTexture, DeleteTexture, canvas };
}


let skyboxProgram: ReturnType<typeof CreateWebglProgram> | null = null;
function GetOrCreateSkyboxProgram()
{
    if (skyboxProgram === null)
    {
        const vertexShaderSource = skybox_vs;
        const fragmentShaderSource = skybox_fs;

        skyboxProgram = CreateWebglProgram(vertexShaderSource, fragmentShaderSource, var_VIEWPROJECTIONMATRIX, var_SUNPOS);
    }

    return skyboxProgram;
}

class Skybox extends Renderable
{
    private program: WebGLProgram;
    private uniforms: Map<string, WebGLUniformLocation>;

    constructor()
    {
        super(CreateBoxGeometry(), 0);
        const { program, uniformLocations } = GetOrCreateSkyboxProgram();
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

        gl.useProgram(this.program);
        gl.bindVertexArray(this.vao);

        gl.uniformMatrix4fv(this.uniforms.get(var_VIEWPROJECTIONMATRIX)!, false, viewMatrices.viewProjectionMatrix);
        gl.uniform3fv(this.uniforms.get(var_SUNPOS)!, light.transform.position.clone().normalize());

        gl.cullFace(gl.FRONT);
        gl.depthFunc(gl.LEQUAL);

        gl.drawElements(gl.TRIANGLES, this.triangleCount, gl.UNSIGNED_INT, 0);

        gl.cullFace(gl.BACK);
        gl.depthFunc(gl.LESS);

        gl.bindVertexArray(null);
    }
}



// no parenting is allowed for any phyisics related nodes (or at least local transform must be equal to world transform)
// otherwise stuff will break

abstract class Collider extends SceneNode
{
    protected matrixInverse = new Matrix4x4(); // world to local

    // recalculates matrix which is
    public updateMatrix()
    {
        this.matrixInverse = this.worldToLocalMatrix();
    }

    // return null if there is no collision
    // otherwise return an offset vector which resolves the collision
    public abstract resolveCollision(point: Vector3, radius: number): Vector3 | null;
}

class BoxCollider extends Collider
{
    private extents: Vector3;

    constructor(center: Vector3, rotation: Quaternion, size: Vector3)
    {
        super();
        this.transform.position.copyFrom(center);
        this.transform.rotation.copyFrom(rotation);
        this.updateMatrix();

        this.extents = size.clone().mulScalar(0.5);
    }

    public resolveCollision(point: Vector3, radius: number)
    {
        const pointLocalSpace = point.clone().applyMatrix4x4(this.matrixInverse);

        let minPenetrationDepth = Infinity;
        const minPenetrationResolveDirection = new Vector3();

        for (let i = 0; i < 6; ++i)
        {
            const axis = i / 2 | 0;
            const sign = (i & 1) * 2 - 1;
            const penetrationDepth = this.extents[axis] - pointLocalSpace[axis] * sign + radius;
            if (penetrationDepth <= 0)
            {
                return null;
            }

            if (penetrationDepth < minPenetrationDepth)
            {
                minPenetrationDepth = penetrationDepth;
                // TODO?: offset in the actual minimum distance direction (with >0 radius, near corners/edges)
                minPenetrationResolveDirection.setScalar(0);
                minPenetrationResolveDirection[axis] = penetrationDepth * sign;
            }
        }

        return minPenetrationResolveDirection.applyQuaternion(this.transform.rotation);
    }
}

class SphereCollider extends Collider
{
    private radius: number;

    constructor(position: Vector3, radius: number)
    {
        super();
        this.transform.position.copyFrom(position);
        this.updateMatrix();

        this.radius = radius;
    }

    public resolveCollision(point: Vector3, radius: number): Vector3 | null
    {
        const worldDirection = point.clone().sub(this.transform.position);
        const distance = worldDirection.length;
        return (distance < this.radius + radius) ? worldDirection.safeNormalize().mulScalar(this.radius + radius - distance) : null;
    }
}




function PlasticTexture(c: ReturnType<typeof CreateWebglCanvas>, w: number, h: number,
    scale = 5,
    minRoughness = 0.5, maxRoughness = 1.0,
    baseColor: [number, number, number] = [0.3, 0.22, 0.07],
    normalIntensity = 0.5): TextureCollection
{
    const shader = (isAlbedo: boolean) => `
vec4 getColor(vec2 uv)
{
    vec2 coord = uv * float(${scale});
    vec2 noise = vec2(fbm(coord, 5, 1.0, 2.0), fbm(coord + vec2(1.23, 4.56), 5, 1.0, 2.0));
    float voro = sqrt(voronoi(noise * 10.0, 1.0).y) * 1.5;

    ${isAlbedo
            ? `
        vec4 albedo = colorRamp2(vec4(0.95, 0.95, 0.95, 1), 0.2, vec4(1.0, 1.0, 1.0, 1), 0.8, mix(voro, noise.x, 0.5)) * vec4(${baseColor.join(",")}, 1);
        return albedo;
        `
            : `
        return vec4(vec3(remap(0.0, 1.0, float(${minRoughness}), float(${maxRoughness}), saturate(valueRamp2(0.4, 0.3, 0.6, 0.7, voro)) * 0.2 - noise.x * 1.0)), 1);
        `
    }
}`;

    const mainImage = `
    outColor = edgeBlend(vPixelCoord);
    `;

    const albedo = c.CreateTexture(w, h);
    c.DrawWithShader([ShaderUtils, FBM, VoronoiGrayscale, shader(true), edgeBlend("getColor")], mainImage, w, h, [], albedo);

    const heightMap = c.CreateTexture(w, h);
    c.DrawWithShader([ShaderUtils, FBM, VoronoiGrayscale, shader(false), edgeBlend("getColor")], mainImage, w, h, [], heightMap);

    const normalMap = c.CreateTexture(w, h);
    c.DrawWithShader([], NormalMapShader(normalIntensity), w, h, [heightMap], normalMap);

    return {
        albedo,
        roughness: heightMap,
        normalMap
    };
}



class Mesh extends Renderable
{
    private program: WebGLProgram;
    private shadowProgram: WebGLProgram;
    private uniforms: Map<string, WebGLUniformLocation>;
    public material: Material;
    private textures = new Map<number, WebGLTexture>();
    public castShadows = true;

    constructor(geometry: Geometry, material: Material)
    {
        const positionLoc = 0;  // from shader
        const normalLoc = 1;    // same

        super(geometry, positionLoc, normalLoc);

        const { program, uniformLocations } = GetOrCreateStandardMaterial();
        this.program = program;
        this.uniforms = uniformLocations;

        gl.useProgram(program);

        this.material = { ...material };

        // shadows
        this.shadowProgram = GetOrCreateShadowProgram().program;
    }

    private prepareMaterial()
    {
        gl.uniform1i(this.uniforms.get(var_ALBEDO)!, 0);
        gl.uniform1i(this.uniforms.get(var_NORMALMAP)!, 1);
        gl.uniform1i(this.uniforms.get(var_ROUGHNESSMAP)!, 2);

        gl.uniform1i(this.uniforms.get(var_HASALBEDO)!, 0);
        gl.uniform1i(this.uniforms.get(var_HASNORMALMAP)!, 0);
        gl.uniform1i(this.uniforms.get(var_HASROUGHNESSMAP)!, 0);

        gl.uniform1f(this.uniforms.get(var_SHARPNESS)!, 1);
        gl.uniform3f(this.uniforms.get(var_SCALE)!, 1, 1, 1);
        gl.uniform3f(this.uniforms.get(var_OFFSET)!, 0, 0, 0);
        gl.uniform1f(this.uniforms.get(var_LIGHTINTENSITY)!, 0.5);

        for (let i = 0; i < 8; ++i)
        {
            gl.activeTexture(gl.TEXTURE0 + i);
            gl.bindTexture(gl.TEXTURE_2D, null);
        }

        const { material } = this;
        if (material)
        {
            gl.uniform4f(this.uniforms.get(var_BASECOLOR)!, material.r, material.g, material.b, material.a);
            gl.uniform1f(this.uniforms.get(var_METALLIC)!, material.metallic ?? 0);

            const coeff = 0.2;
            const eps = 1e-5;
            const roughness = 1.0 + coeff - coeff / Clamp(material.roughness ?? 0.5, eps, 1.0 - eps);

            gl.uniform1f(this.uniforms.get(var_ROUGHNESS)!, roughness);

            gl.uniform1f(this.uniforms.get(var_SHARPNESS)!, material.textureBlendSharpness ?? 1);
            material.textureScale && gl.uniform3fv(this.uniforms.get(var_SCALE)!, material.textureScale);
            material.textureOffset && gl.uniform3fv(this.uniforms.get(var_OFFSET)!, material.textureOffset);

            for (const data of this.textures)
            {
                const [slot, tex] = data;
                gl.activeTexture(gl.TEXTURE0 + slot);
                gl.bindTexture(gl.TEXTURE_2D, tex);
                gl.uniform1i(this.uniforms.get([var_HASALBEDO, var_HASNORMALMAP, var_HASROUGHNESSMAP][slot])!, tex ? 1 : 0);
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

        gl.useProgram(mode === RenderMode.Normal ? this.program : this.shadowProgram);
        gl.bindVertexArray(this.vao);

        if (mode === RenderMode.Normal)
        {
            const worldViewMatrix = viewMatrix.clone().multiply(worldMatrix);
            const worldViewProjectionMatrix = viewProjectionMatrix.clone().multiply(worldMatrix);
            const worldViewNormalMatrix = worldViewMatrix.topLeft3x3().invert() /* .transpose() */;
            const worldNormalMatrix = worldMatrix.topLeft3x3().invert() /* .transpose() */;

            gl.uniformMatrix4fv(this.uniforms.get(var_WORLDVIEWMAT)!, false, worldViewMatrix);
            gl.uniformMatrix4fv(this.uniforms.get(var_WORLDVIEWPROJMAT)!, false, worldViewProjectionMatrix);
            gl.uniformMatrix3fv(this.uniforms.get(var_WORLDVIEWNORMALMAT)!, true, worldViewNormalMatrix);
            gl.uniformMatrix4fv(this.uniforms.get(var_WORLDMAT)!, false, worldMatrix);
            gl.uniformMatrix3fv(this.uniforms.get(var_WORLDNORMALMAT)!, true, worldNormalMatrix);
            gl.uniform3fv(this.uniforms.get(var_LIGHTPOS)!,
                light.transform.position.clone()
                    .add(viewMatrices.cameraPosition)
                    .applyMatrix4x4(light.transform.matrix().preMultiply(viewMatrix))
                    .normalize()
            );
            gl.uniform3fv(this.uniforms.get(var_LIGHTPOSWORLD)!, light.transform.position.clone().normalize());

            this.prepareMaterial();

            gl.activeTexture(gl.TEXTURE3);
            gl.bindTexture(gl.TEXTURE_2D, light.depthTexture);

            gl.uniformMatrix4fv(this.uniforms.get(var_SHADOWMVP)!, false, light.depthMVP);
            gl.uniform3fv(this.uniforms.get(var_PLAYERPOSITION)!, viewMatrices.playerPosition);
        }
        else
        {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, null);
            gl.uniformMatrix4fv(light.worldMatLocation, false, worldMatrix);
        }

        gl.drawElements(gl.TRIANGLES, this.triangleCount, gl.UNSIGNED_INT, 0);

        gl.bindVertexArray(null);
    }
}



let spriteProgram: ReturnType<typeof CreateWebglProgram> | null = null;
function GetOrCreateSpriteProgram()
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
}`;

        const fragmentShaderSource = `#version 300 es
precision highp float;
in vec2 uv;
out vec4 fragColor;
uniform sampler2D tex;
void main()
{
    fragColor = texture(tex, uv);
    if (fragColor.a < 0.01) discard;
}`;

        spriteProgram = CreateWebglProgram(vertexShaderSource, fragmentShaderSource, "viewProjectionMatrix", "worldMat", "tex");
    }

    return spriteProgram;
}

class Sprite extends Renderable
{
    private program: WebGLProgram;
    private uniforms: Map<string, WebGLUniformLocation>;
    private texture: WebGLTexture | null;
    private shadowProgram: ReturnType<typeof GetOrCreateShadowProgram>;

    constructor(texture: WebGLTexture | null)
    {
        super(CreateBoxGeometry(1, 1, 0.01), 0);
        const { program, uniformLocations } = GetOrCreateSpriteProgram();
        this.program = program;
        this.uniforms = uniformLocations;
        this.texture = texture;
        this.renderOrder = 2000;

        this.shadowProgram = GetOrCreateShadowProgram();
    }

    public setTexture(texture: WebGLTexture | null)
    {
        this.texture = texture;
    }

    public render(mode: RenderMode, viewMatrices: ViewMatrices, worldMatrix: Matrix4x4, light: DirectionalLight): void
    {
        gl.useProgram(mode === RenderMode.Normal ? this.program : this.shadowProgram.program);
        gl.bindVertexArray(this.vao);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        if (this.texture)
        {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
        }

        if (mode === RenderMode.Normal)
        {
            gl.uniform1i(this.uniforms.get("tex")!, 0);
            gl.uniformMatrix4fv(this.uniforms.get("viewProjectionMatrix")!, false, viewMatrices.viewProjectionMatrix);
            gl.uniformMatrix4fv(this.uniforms.get("worldMat")!, false, worldMatrix);
        }
        else
        {
            gl.uniform1i(this.shadowProgram.uniformLocations.get("tex")!, 0);
            gl.uniformMatrix4fv(light.worldMatLocation, false, worldMatrix);
        }

        gl.drawElements(gl.TRIANGLES, this.triangleCount, gl.UNSIGNED_INT, 0);

        gl.bindVertexArray(null);
        gl.disable(gl.BLEND);
    }
}



function CreateSawBlade(size: number)
{
    const material: Material = {
        r: 1,
        g: 1,
        b: 1,
        a: 1,
        metallic: 0.8,
        roughness: 0.3,
        textureScale: new Vector3().setScalar(0.5)
    };

    const radius = 0.4;
    const discSegments = 24;
    const discThickness = 0.2 / size;
    const numTeeth = 8;
    const toothThickness = 0.04 / size;
    const toothInset = 0.1;

    const discOutline: number[] = [];
    for (let i = 0; i < discSegments; ++i)
    {
        const angle = 2 * Math.PI * i / discSegments;
        const x = Math.sin(angle);
        const y = Math.cos(angle);
        discOutline.push(x * radius, y * radius);
    }

    const discGeometry = CreateExtrudedGeometryConvex(discOutline, discThickness);
    const toothGeometry = CreateExtrudedGeometryConvex([
        -0.2, 0,
        0.1, 0.4,
        0.3, 0.4,
        0.2, 0.2,
        0.2, 0
    ], toothThickness);

    discGeometry.vertices = discGeometry.vertices.map(v => v * size)
    toothGeometry.vertices = toothGeometry.vertices.map(v => v * size)

    const toothGeometries: Geometry[] = [];

    for (let i = 0; i < numTeeth; ++i)
    {
        const angle = 2 * Math.PI * i / numTeeth;
        const x = Math.sin(angle);
        const y = Math.cos(angle);
        const rotation = new Quaternion().setFromAxisAngle(0, 0, -1, angle);
        const position = new Vector3(x * (radius - toothInset), y * (radius - toothInset), 0).mulScalar(size);

        // @ts-ignore
        const tooth: Geometry = structuredClone(toothGeometry);
        for (let i = 0; i < tooth.vertices.length; i += 3)
        {
            const normal = new Vector3(...tooth.normals.subarray(i, i + 3))
                .applyQuaternion(rotation);
            const vertex = new Vector3(...tooth.vertices.subarray(i, i + 3))
                .applyQuaternion(rotation)
                .add(position);
            tooth.normals.set(normal, i);
            tooth.vertices.set(vertex, i);
        }

        toothGeometries.push(tooth);
    }

    const discObject = new Mesh(JoinGeometries(discGeometry, ...toothGeometries), material);

    return discObject;
}


function CreateSpikeObject(countX: number, countY: number,
    albedo: WebGLTexture | null, normalMap: WebGLTexture | null, roughnessMap: WebGLTexture | null): Mesh
{
    const material: Material = {
        r: 1,
        g: 1,
        b: 1,
        a: 1,
        metallic: 0.8,
        roughness: 0.3,
        textureScale: new Vector3().setScalar(1)
    };

    const spikeRadius = 0.2;
    const spikeHeight = 2;

    const radiusSegments = 8;

    const vertices: number[] = [];
    const normals: number[] = [];

    for (let i = 0; i <= radiusSegments; ++i)
    {
        const angle = 2 * Math.PI * i / radiusSegments;
        const x = Math.sin(angle);
        const y = Math.cos(angle);
        vertices.push(
            x * spikeRadius, -spikeHeight / 2, y * spikeRadius,
            0, spikeHeight / 2, 0 // also add an extra vertex for normal
        );

        normals.push(x, 0, y, x, 0, y);
    }

    const triangles: number[] = [];
    for (let i = 0; i < radiusSegments; ++i)
    {
        triangles.push(i * 2 + 2, i * 2 + 1, i * 2);
    }

    const geometry: Geometry = {
        vertices: new Float32Array(vertices),
        triangles: new Uint32Array(triangles),
        normals: new Float32Array(normals)
    };

    const geometries: Geometry[] = [];
    for (let i = 0; i < countX; ++i)
    {
        const offsetX = (i * 2 + 1 - countX) * spikeRadius;
        for (let j = 0; j < countY; ++j)
        {
            const offsetY = (j * 2 + 1 - countY) * spikeRadius;

            // @ts-ignore
            const currentGeometry: Geometry = structuredClone(geometry);
            for (let k = 0; k < currentGeometry.vertices.length; k += 3)
            {
                currentGeometry.vertices[k] += offsetX;
                currentGeometry.vertices[k + 2] += offsetY;
            }

            geometries.push(currentGeometry);
        }
    }

    const mesh = new Mesh(JoinGeometries(...geometries), material);
    mesh.setTexture(0, albedo);
    mesh.setTexture(1, normalMap);
    mesh.setTexture(2, roughnessMap);
    return mesh;
}



let lavaProgram: ReturnType<typeof CreateWebglProgram> | null = null;
function GetOrCreateLavaProgram()
{
    if (lavaProgram === null)
    {
        const vertexShaderSource = lava_vs;

        const fragmentShaderSource = lava_fs;

        lavaProgram = CreateWebglProgram(vertexShaderSource, fragmentShaderSource,
            var_VIEWPROJECTIONMATRIX, var_WORLDMAT, var_UTIME, var_SHADOWMVP, var_DEPTHMAP, var_HUESHIFT
        );
    }

    return lavaProgram;
}

class Lava extends Renderable
{
    private program: WebGLProgram;
    private uniforms: Map<string, WebGLUniformLocation>;
    public hueShift = 0;

    constructor(geometry: Geometry)
    {
        super(geometry, 0);
        const { program, uniformLocations } = GetOrCreateLavaProgram();
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

        gl.useProgram(this.program);
        gl.bindVertexArray(this.vao);

        gl.uniformMatrix4fv(this.uniforms.get(var_VIEWPROJECTIONMATRIX)!, false, viewMatrices.viewProjectionMatrix);
        gl.uniformMatrix4fv(this.uniforms.get(var_WORLDMAT)!, false, worldMatrix);
        gl.uniform1f(this.uniforms.get(var_UTIME)!, performance.now() / 1000);
        gl.uniform1i(this.uniforms.get(var_DEPTHMAP)!, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, light.depthTexture);

        gl.uniformMatrix4fv(this.uniforms.get(var_SHADOWMVP)!, false, light.depthMVP);
        gl.uniform1i(this.uniforms.get(var_HUESHIFT)!, this.hueShift);

        this.hueShift && (gl.enable(gl.BLEND), gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA));

        gl.drawElements(gl.TRIANGLES, this.triangleCount, gl.UNSIGNED_INT, 0);

        gl.bindVertexArray(null);
        this.hueShift && gl.disable(gl.BLEND);
    }
}



const drawCanvas = document.createElement("canvas");
const drawCtx = drawCanvas.getContext("2d")!;

function DrawImageToCanvas(w: number, h: number, drawFn: () => void)
{
    drawCanvas.width = w;
    drawCanvas.height = h;
    drawFn();

    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

    const ext = gl.getExtension("EXT_texture_filter_anisotropic");
    ext && gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(16, gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, drawCanvas);
    gl.generateMipmap(gl.TEXTURE_2D);

    return tex;
}

async function ImageToWebglTexture(w: number, h: number, imgSrc: string)
{
    return await new Promise<WebGLTexture>(resolve =>
    {
        const img = new Image();
        img.onload = () => resolve(DrawImageToCanvas(w, h, () => drawCtx.drawImage(img, 0, 0, w, h)));
        img.src = imgSrc;
    });
}


const cssMinified = `body{background:#000;color:#fff;user-select:none;font-family:Verdana,sans-serif}.fullscreen{position:absolute;top:0;left:0;width:100vw;height:100vh;pointer-events:none;display:flex;flex-direction:column;align-items:center;z-index:9}#overlay{background-color:#0000;transition:background-color .5s linear;justify-content:space-evenly;font-size:6vh;white-space:pre-line}#overlay.lava{background-color:#a30}#overlay.dead,#powerup-container{background-color:#000}#overlay.respawn{background-color:#0f0}#death-text,#inner{opacity:0;transition:.3s linear;text-align:center}.visible{opacity:1!important}#powerup-container{position:relative;width:35vw;height:5vh;margin-bottom:5vh;border:.5vh solid #000;border-radius:1.3vh;opacity:0;transition:.2s linear}#powerup-bar{width:100%;height:100%;background-image:linear-gradient(#3d0,#170);border-radius:1vh}#powerup-text{position:absolute;top:50%;left:50%;font-size:3vh;transform:translate(-50%,-50%);white-space:nowrap;text-shadow:0 0 1vh #000}`;
const htmlMinified = `<div class=fullscreen style=justify-content:flex-end><div id=powerup-container><div id=powerup-bar></div><div id=powerup-text></div></div></div><div id=overlay class=fullscreen><div id=death-text></div><div id=inner></div></div>`;

document.getElementsByTagName("style")[0].innerHTML = cssMinified;
document.getElementById("main")!.innerHTML = htmlMinified;



const scene = new Scene();

scene.add(new Skybox());

const up = new Vector3(0, 1, 0);

const ca = CreateWebglCanvas(canvas);
const plasticTexture = PlasticTexture(ca, 2048, 2048, 15, 0.5, 1, [1, 1, 1]);
// const dirtTexture = DirtTexture(ca, 1024, 1024, 20, 0.1, 0.4, [1, 1, 1]);
// const metalTexture = MetalTexture(ca, 1024, 1024, 20, 0, 0.6, [1, 1, 1]);

class CollidableBox extends BoxCollider
{
    public mesh: Mesh;

    constructor(size: Vector3, material: Material)
    {
        super(new Vector3(), new Quaternion(), size);
        this.mesh = new Mesh(CreateBoxGeometry(...size), material);
        this.add(this.mesh);
    }
}

class CollidableSphere extends SphereCollider
{
    public mesh: Mesh;

    constructor(radius: number, material: Material)
    {
        super(new Vector3(), radius);
        this.mesh = new Mesh(CreateSphereGeometry(radius, 24 * 3, 16 * 3), material);
        this.add(this.mesh);
    }
}

class Trigger
{
    public checkCollision: () => void;
    public enabled = true;
    public collider: Collider;

    constructor(collider: Collider, onTriggerEnter: (trigger: Trigger, dir: Vector3) => void)
    {
        this.collider = collider;
        this.checkCollision = () =>
        {
            if (!this.enabled)
            {
                return;
            }

            const dir = collider.resolveCollision(player.transform.position, playerRadius);
            dir && onTriggerEnter(this, dir);
        };
    }

    public setEnabled(on: boolean)
    {
        this.enabled = on;
        this.collider.visible = on;
    }
}

function HexToColor(hex: string)
{
    const r = Number.parseInt(hex.substring(0, 2), 16) / 255;
    const g = Number.parseInt(hex.substring(2, 4), 16) / 255;
    const b = Number.parseInt(hex.substring(4, 6), 16) / 255;

    return { r, g, b, a: 1 };
}

const solidMaterial: Material = { ...HexToColor("D65647"), textureScale: new Vector3(0.2, 0.2, 0.2) };
const solidSphereMaterial: Material = { ...HexToColor("388DCC"), textureScale: new Vector3(0.2, 0.2, 0.2) };
const elevatorMaterial: Material = { ...HexToColor("ADE617"), textureScale: new Vector3(0.2, 0.2, 0.2) };
const tiltingBlockMaterial: Material = { ...HexToColor("2C5599"), textureScale: new Vector3(0.2, 0.2, 0.2) };
const movingBlockMaterial: Material = { ...HexToColor("E62000"), textureScale: new Vector3(0.2, 0.2, 0.2) };
const trampolineMaterial: Material = { ...HexToColor("1764E6"), textureScale: new Vector3(0.2, 0.2, 0.2), roughness: 0.18 };

const stoneMaterial: Material = { r: 1, g: 1, b: 1, a: 1, textureScale: new Vector3(0.4, 0.4, 0.4) };

interface LevelObject
{
    object: SceneNode;
    onUpdate: ((obj: SceneNode) => void)[];
}

function CreateSimpleCollidableBox(sx: number, sy: number, sz: number, px: number, py: number, pz: number,
    rx: number, ry: number, rz: number, ra: number, material: Material): LevelObject
{
    const box = new CollidableBox(new Vector3(sx, sy, sz), material);
    box.transform.position.setValues(px, py, pz);
    box.transform.rotation.setFromAxisAngle(rx, ry, rz, ra);

    colliders.push(box);

    box.mesh.setTexture(0, plasticTexture.albedo);
    box.mesh.setTexture(1, plasticTexture.normalMap);
    box.mesh.setTexture(2, plasticTexture.roughness);

    const obj: LevelObject = {
        object: box,
        onUpdate: []
    };
    currentLevelObjects.push(obj);
    return obj;
}

function CreateSimpleCollidableSphere(radius: number, px: number, py: number, pz: number, material: Material): LevelObject
{
    const sphere = new CollidableSphere(radius, material);
    sphere.transform.position.setValues(px, py, pz);

    colliders.push(sphere);

    sphere.mesh.setTexture(0, plasticTexture.albedo);
    sphere.mesh.setTexture(1, plasticTexture.normalMap);
    sphere.mesh.setTexture(2, plasticTexture.roughness);

    const obj: LevelObject = {
        object: sphere,
        onUpdate: []
    };
    currentLevelObjects.push(obj);
    return obj;
}

function CreateSawBladeLevelObject(sawSize: number, px: number, py: number, pz: number, angle: number): LevelObject
{
    const sawCollider = new CollidableBox(new Vector3(sawSize, sawSize, 0.2), solidMaterial);
    sawCollider.mesh.visible = false;

    const saw = CreateSawBlade(sawSize * 0.68);

    sawCollider.add(saw);
    sawCollider.transform.position.setValues(px, py, pz);
    sawCollider.transform.rotation.setFromAxisAngle(0, 1, 0, angle);

    const trigger = new Trigger(sawCollider, _ => Restart(RestartReason.SawBlade));
    triggers.push(trigger);

    const obj: LevelObject = {
        object: sawCollider,
        onUpdate: [() => saw.transform.rotation.setFromAxisAngle(0, 0, 1, physicsTime * -10)]
    };
    currentLevelObjects.push(obj);
    return obj;
}

function CreateSpikesLevelObject(countX: number, countY: number, px: number, py: number, pz: number, speed = 2, timeOffset = 0): LevelObject
{
    const collider = new CollidableBox(new Vector3(0.4 * countX, 1.2, 0.4 * countY), solidMaterial);
    collider.mesh.visible = false;

    const spikeMesh = CreateSpikeObject(countX, countY, null, null, null);
    collider.add(spikeMesh);
    collider.transform.position.setValues(px, py, pz);

    const trigger = new Trigger(collider, _ => Restart(RestartReason.Spikes));
    triggers.push(trigger);

    const obj: LevelObject = {
        object: collider,
        onUpdate: []
    };
    Elevator(obj, py - 1.9, py - 0.1, speed, timeOffset);
    currentLevelObjects.push(obj);
    return obj;
}

function CreateTrampolineLevelObject(sx: number, sy: number, sz: number, px: number, py: number, pz: number, material: Material): LevelObject
{
    const box = new CollidableBox(new Vector3(sx, sy, sz), material);
    box.transform.position.setValues(px, py, pz);

    // box.mesh.setTexture(0, plasticTexture.albedo);
    // box.mesh.setTexture(1, plasticTexture.normalMap);
    // box.mesh.setTexture(2, plasticTexture.roughness);

    const trigger = new Trigger(box, Trampoline);
    triggers.push(trigger);

    const obj: LevelObject = {
        object: box,
        onUpdate: [() => box.transform.position.y = py + (1.0 - (Math.sin(physicsTime * 10) * 0.5 + 0.5)) ** 10 * 0.3]
    };
    currentLevelObjects.push(obj);
    return obj;
}

function CreatePowerup(px: number, py: number, pz: number, spriteImage: WebGLTexture, onPickup: () => void): LevelObject
{
    const collider = new SphereCollider(new Vector3(px, py, pz), 0.8);
    collider.renderOrder = 2000;
    const sprite = new Sprite(spriteImage);
    collider.add(sprite);

    triggers.push(new Trigger(collider, trigger => { trigger.setEnabled(false); onPickup(); }));

    const obj: LevelObject = {
        object: collider,
        onUpdate: [() =>
        {
            sprite.transform.rotation.setFromAxisAngle(0, 1, 0, physicsTime * 2);
            sprite.transform.position.y = Math.sin(physicsTime * 3) * 0.1;
        }]
    };
    currentLevelObjects.push(obj);
    return obj;
}

function CreateFinishObject(px: number, py: number, pz: number, angle: number)
{
    const finishWidth = 8;
    const finishHeight = 6;

    const finishMaterial: Material = { r: 0.5, g: 0.3, b: 0.3, a: 1 };

    const borderThickness = 0.3;
    const leftSide = new Mesh(CreateBoxGeometry(borderThickness, finishHeight, borderThickness), finishMaterial);
    const rightSide = new Mesh(CreateBoxGeometry(borderThickness, finishHeight, borderThickness), finishMaterial);
    const top = new Mesh(CreateBoxGeometry(finishWidth - borderThickness, borderThickness, borderThickness), finishMaterial);

    leftSide.transform.position.setValues(-finishWidth / 2, 0, 0);
    rightSide.transform.position.setValues(finishWidth / 2, 0, 0);
    top.transform.position.y = finishHeight / 2 - borderThickness / 2;

    const collider = new BoxCollider(new Vector3(px, py + finishHeight / 2, pz), new Quaternion().setFromAxisAngle(0, 1, 0, angle), new Vector3(finishWidth, finishHeight, 0.01));
    collider.renderOrder = 2000;

    const portal = new Lava(CreateBoxGeometry(finishWidth, finishHeight - borderThickness / 2, 0.01));
    portal.hueShift = 1;
    portal.transform.position.y = -borderThickness / 2;
    collider.add(portal);
    collider.add(leftSide);
    collider.add(rightSide);
    collider.add(top);

    triggers.push(new Trigger(collider, FinishLevel));

    const obj: LevelObject = {
        object: collider,
        onUpdate: []
    };
    currentLevelObjects.push(obj);
    return obj;
}

let currentLevelObjects: LevelObject[] = [];
let colliders: Collider[] = [];
let triggers: Trigger[] = [];

function CreateLevel(levelCreatorFn: () => void)
{
    DestroyLevel();
    levelCreatorFn();
    currentLevelObjects.forEach(obj => scene.add(obj.object));
    currentLevelObjects.forEach(obj => UpdateMatrixForColliders(obj.object));
    Restart(RestartReason.LevelChange);
}

function DestroyLevel()
{
    const destroy = (obj: SceneNode) =>
    {
        scene.remove(obj);
        obj.dispose();
    };

    currentLevelObjects.map(obj => obj.object).forEach(obj => obj.traverse(destroy));
    currentLevelObjects = [];
    colliders = [];
    triggers = [];
}

// note that svgs are flipped, because in webgl y is up, and in svg y is down
// and it's easier to just flip the svgs than to flip them in the shader
const arrowUpSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24px' height='24px' viewBox='0 0 24 24' stroke-width='1' stroke='red' fill='none' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='9'/%3E%3Cpath d='M8 13l4 4m4-4l-4 4M8 8l4 4m4-4l-4 4' stroke='%230f0'/%3E%3C/svg%3E";
const lightningSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24px' height='24px' viewBox='0 0 24 24' stroke-width='1' stroke='red' fill='none' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='9'/%3E%3Cpath fill='%230f0' d='M16 18h-5l-2-6h2L9 6l6 7h-2z'/%3E%3C/svg%3E";

const lightningTexture = await ImageToWebglTexture(256, 256, lightningSvg);
const arrowUpTexture = await ImageToWebglTexture(256, 256, arrowUpSvg);

const playerStartingPosition = new Vector3();
let playerStartingRotation = 0;
const lightPositionForLevel = new Vector3();

function Level0()
{
    playerStartingPosition.setValues(0, 1, 0);
    playerStartingRotation = 0;

    // ground
    CreateSimpleCollidableBox(
        20, 1, 20,
        0, -0.6, 0,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableSphere(2, 4, 0.5, 4, stoneMaterial);

    // horizontal moving box
    const box1 = CreateSimpleCollidableBox(
        2, 1, 2,
        3, 1, 0,
        0, 0, 0, 0,
        { ...solidMaterial, r: 0, g: 0, b: 1 }
    );
    box1.onUpdate.push(() => box1.object.transform.position.x = Math.sin(physicsTime * 2) * 2 + 1);

    // vertical moving box
    const box2 = CreateSimpleCollidableBox(
        2, 1, 2,
        2, 0, 1,
        0, 0, 0, 0,
        { ...solidMaterial, r: 0, g: 1, b: 1 }
    );
    box2.onUpdate.push(() => box2.object.transform.position.y = Math.sin(physicsTime * 2) * 3 + 1);

    // spinning box
    const box3 = CreateSimpleCollidableBox(
        10, 10, 1,
        10, 4, 1,
        0, 0, 0, 0,
        { ...solidMaterial, r: 1, g: 0, b: 1 }
    );
    box3.onUpdate.push(() => box3.object.transform.rotation.setFromAxisAngle(1, 0, 0, physicsTime * 4 + Math.sin(physicsTime) * 4 + Math.PI / 2));

    CreateTrampolineLevelObject(2, 1, 2, -2, 0, -2, { ...solidMaterial, r: 1, g: 1, b: 1 });

    CreateSawBladeLevelObject(3,
        0, 2, -2,
        0
    );

    CreatePowerup(-5, 1, -5, lightningTexture, SpeedBoost);
    CreatePowerup(-5, 1, -3, arrowUpTexture, HighJump);

    CreateSpikesLevelObject(10, 10, -5, 0.9, 5);

    CreateFinishObject(0, -0.1, -8, 0);
}

function Elevator(object: LevelObject, min: number, max: number, speed: number, timeOffset = 0, axis = 1)
{
    object.onUpdate.push(() => object.object.transform.position[axis] = Lerp(min, max, Smoothstep(-0.8, 0.8, Math.cos(timeOffset + physicsTime * speed))));
}

function TiltingBlock(object: LevelObject, maxAngle: number, speed: number, axis: number, smoothness = 0.8, timeOffset = 0)
{
    const x = axis === 0 ? 1 : 0;
    const y = axis === 1 ? 1 : 0;
    const z = axis === 2 ? 1 : 0;
    object.onUpdate.push(() => object.object.transform.rotation.setFromAxisAngle(x, y, z,
        Lerp(-maxAngle, maxAngle, Smoothstep(-smoothness, smoothness, Math.cos(timeOffset + physicsTime * speed)))
    ));
}

function Level1()
{
    playerStartingPosition.setValues(0, 30, 0);
    playerStartingRotation = 0;
    lightPositionForLevel.setValues(1, 3, -3);

    CreateSimpleCollidableBox(
        10, 10, 10,
        0, 0, -2,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        3, 10, 3,
        0, 0, -10,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        3, 10, 3,
        4, 0, -14,
        0, 1, 0, Math.PI / 4,
        solidMaterial
    );

    Elevator(CreateSimpleCollidableBox(
        3, 20, 3,
        8, 0, -16,
        0, 0, 0, 0,
        elevatorMaterial
    ), -5, 0, 1);

    CreateSimpleCollidableBox(
        11, 1, 3,
        17, 11, -16,
        0, 0, 1, 0.2,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        2, 20, 1,
        17, 1, -16,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableSphere(
        5,
        28, 2, -16,
        solidMaterial
    );

    CreateSimpleCollidableSphere(
        5,
        28, 9, -16,
        solidSphereMaterial
    );

    CreateSimpleCollidableBox(
        10, 10, 10,
        41, 2, -15,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        2, 10, 2,
        44, 0, -6,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        2, 10, 2,
        44, 0, -1,
        0, 1, 0, Math.PI / 4,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        2, 10, 2,
        47, 0, 3,
        0, 1, 0, Math.PI / 4,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        2, 10, 2,
        41, 0, 3,
        0, 1, 0, Math.PI / 4,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        12, 10, 10,
        44, 1, 9,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateFinishObject(44, 6, 10, 0);
}

function Level3()
{
    playerStartingPosition.setValues(0, 30, 0);
    playerStartingRotation = 0;
    lightPositionForLevel.setValues(1, 3, -3);

    CreateSimpleCollidableBox(
        10, 10, 10,
        0, 0, -2,
        0, 0, 0, 0,
        solidMaterial
    );

    Elevator(CreateSimpleCollidableBox(
        5, 10, 2,
        0, 0, -5.9,
        0, 0, 0, 0,
        elevatorMaterial
    ), 0.01, 5, 3);

    CreateSimpleCollidableBox(
        4, 20, 11,
        0, 0, -18,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSpikesLevelObject(
        10, 5,
        0, 11, -18
    );
    CreateSpikesLevelObject(
        10, 5,
        0, 11, -20,
        2, -1
    );
    CreateSpikesLevelObject(
        10, 5,
        0, 11, -22,
        2, -2
    );

    CreateSimpleCollidableSphere(
        1.2,
        0, 8, -27,
        solidSphereMaterial
    );
    CreateSimpleCollidableSphere(
        1.2,
        0, 8, -31,
        solidSphereMaterial
    );
    CreateSimpleCollidableSphere(
        1.2,
        0, 8, -35,
        solidSphereMaterial
    );
    CreateSimpleCollidableBox(
        1, 15, 1,
        0, 0, -27,
        0, 0, 0, 0,
        solidMaterial
    );
    CreateSimpleCollidableBox(
        1, 15, 1,
        0, 0, -31,
        0, 0, 0, 0,
        solidMaterial
    );
    CreateSimpleCollidableBox(
        1, 15, 1,
        0, 0, -35,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        12, 10, 20,
        0, 0, -50,
        0, 0, 0, 0,
        solidMaterial
    );

    for (let i = 0; i < 10; ++i)
    {
        Elevator(CreateSawBladeLevelObject(
            3,
            0, 5, -50 - i,
            0
        ), -5, 5, 3, -i / 2, 0);
    }

    CreateSimpleCollidableBox(
        10, 1, 10,
        -5, 3, -68,
        0, 0, 1, -0.4,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        10, 5, 20,
        0, -1.5, -80,
        1, 0, 0, 0.2,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        11, 5, 20,
        0, 1, -102,
        0, 0, 0, 0,
        solidMaterial
    );

    for (let i = 0; i < 27; ++i)
    {
        CreateSpikesLevelObject(
            1, 10,
            i * 0.4 - 5.2, 4.5, -97,
            2, i / 3
        );
    }

    CreateFinishObject(0, 3.5, -108, 0);
}

function Level2()
{
    playerStartingPosition.setValues(0, 30, 0);
    playerStartingRotation = 0;
    lightPositionForLevel.setValues(1, 3, -3);

    CreateSimpleCollidableBox(
        10, 10, 10,
        0, 0, -2,
        0, 0, 0, 0,
        solidMaterial
    );

    TiltingBlock(CreateSimpleCollidableBox(
        10, 1, 10,
        0, 5, -14,
        0, 0, 0, 0,
        tiltingBlockMaterial
    ), 0.5, 1, 0, 0.8, -1);

    TiltingBlock(CreateSimpleCollidableBox(
        10, 1, 10,
        0, 15, -14,
        0, 0, 0, 0,
        tiltingBlockMaterial
    ), 0.5, 1, 0, 0.8, -1);

    CreateSimpleCollidableBox(
        0.5, 32, 0.5,
        -5.25, 0, -14,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        0.5, 32, 0.5,
        5.25, 0, -14,
        0, 0, 0, 0,
        solidMaterial
    );

    TiltingBlock(CreateSimpleCollidableBox(
        10, 1, 10,
        0, 10, -24,
        0, 0, 0, 0,
        tiltingBlockMaterial
    ), 0.5, 1, 0, 0.8, -1);

    CreateSimpleCollidableBox(
        0.5, 22, 0.5,
        -5.25, 0, -24,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        0.5, 22, 0.5,
        5.25, 0, -24,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        5, 35, 5,
        10, 0, -8,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        2, 20, 5,
        23, 0, -8,
        0, 0, 1, 0.6,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        2, 20, 5,
        26, 0, -8,
        0, 0, 1, 0.9,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        2, 20, 5,
        30, 0, -8,
        0, 0, 1, 1.2,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        20, 3, 5,
        35, 0, -8,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateTrampolineLevelObject(
        3, 1, 3,
        43, 1.2, -8,
        trampolineMaterial
    );

    const block = CreateSimpleCollidableBox(
        8, 1, 4,
        53, 5, -8,
        0, 0, 0, 0,
        tiltingBlockMaterial
    );

    const side1 = new Mesh(CreateBoxGeometry(8.01, 1.01, 0.3), { r: 0, g: 1, b: 0, a: 1 });
    const side2 = new Mesh(CreateBoxGeometry(8.01, 1.01, 0.3), { r: 0, g: 1, b: 0, a: 1 });
    block.object.add(side1);
    block.object.add(side2);
    side1.transform.position.z = -2.01 + 0.3 / 2;
    side2.transform.position.z = 2.01 - 0.3 / 2;


    TiltingBlock(block, 0.5, 2, 0, 0.2);

    CreateSimpleCollidableBox(
        10, 20, 30,
        60, 0, -28,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        0.5, 0.5, 10,
        57.25, 5, -13,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        6, 5, 10.1,
        58, 12.5, -28,
        0, 0, 0, 0,
        solidMaterial
    );

    for (let i = 0; i < 5; ++i)
    {
        Elevator(CreateSimpleCollidableBox(
            4.5, 4, 2,
            0, 12, i * 2 - 32,
            0, 0, 0, 0,
            movingBlockMaterial
        ), 59, 63, 2, i * 0.5, 0);
    }

    CreateFinishObject(60, 10, -40, 0);
}

function Level4()
{
    playerStartingPosition.setValues(0, 30, 0);
    playerStartingRotation = 0;
    lightPositionForLevel.setValues(-3, 3, -1);

    CreateSimpleCollidableBox(
        10, 10, 20,
        0, 0, -5,
        0, 0, 0, 0,
        solidMaterial
    );

    CreatePowerup(0, 6, -10, arrowUpTexture, HighJump);

    CreateSimpleCollidableBox(
        10, 15, 10,
        0, 5, -25,
        0, 0, 0, 0,
        solidMaterial
    );

    const maxAngle = Math.PI / 2;
    const steps = 7;

    for (let i = 0; i <= steps; ++i)
    {
        const radius = 20;
        const angle = maxAngle * i / steps;
        const x = -Math.sin(maxAngle - angle) * radius;
        const y = -Math.cos(maxAngle - angle) * radius;

        const centerX = 20;
        const centerZ = -35;

        CreateSimpleCollidableSphere(
            1.5,
            centerX + x, 8 + i, centerZ + y,
            solidSphereMaterial
        );
        CreateSimpleCollidableBox(
            1, 15 + i, 1,
            centerX + x, 0 + i * 0.5, centerZ + y,
            0, 0, 0, 0,
            solidMaterial
        );
    }

    Elevator(CreateSimpleCollidableBox(
        1, 30, 1,
        25, 0, -55,
        0, 0, 0, 0,
        elevatorMaterial
    ), 0, 10, 1);

    CreateSimpleCollidableBox(
        10, 50, 10,
        32, 0, -50,
        0, 0, 0, 0,
        solidMaterial
    );
    CreateSimpleCollidableBox(
        30, 40, 5,
        55, 0, -50,
        0, 0, 0, 0,
        solidMaterial
    );

    CreatePowerup(45, 21, -50, lightningTexture, SpeedBoost);
    CreatePowerup(65, 21, -50, lightningTexture, SpeedBoost);

    CreateSimpleCollidableBox(
        10, 35, 5,
        85, 0, -50,
        0, 0, 0, 0,
        solidMaterial
    );

    CreatePowerup(85, 35 / 2 + 1, -50, lightningTexture, SpeedBoost);

    CreateSimpleCollidableBox(
        10, 30, 10,
        100, 0, -40,
        0, 1, 0, Math.PI / 4,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        5, 25, 10,
        100, 0, -20,
        0, 0, 0, 0,
        solidMaterial
    );

    CreatePowerup(100, 25 / 2 + 1, -20, lightningTexture, SpeedBoost);
    CreateSimpleCollidableBox(
        5, 30, 1,
        100, 15, -14,
        1, 0, 0, 0.6,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        10, 25, 30,
        100, 0, 35,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateFinishObject(100, 12.5, 48, 0);
}

function Level5()
{
    playerStartingPosition.setValues(0, 30, 0);
    playerStartingRotation = 0;
    lightPositionForLevel.setValues(1, 3, -3);

    CreateSimpleCollidableBox(
        10, 10, 20,
        0, 0, -5,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        40, 10, 10,
        0, 0, -60,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        20, 10, 11,
        0, 0, -102,
        0, 0, 0, 0,
        solidMaterial
    );

    const createSphere = (px: number, py: number, pz: number, r: number, addSphere = true, rot = 0) =>
    {
        addSphere && CreateSimpleCollidableSphere(
            r,
            px, py, pz,
            solidSphereMaterial
        );
        CreateSimpleCollidableBox(
            1, 15, 1,
            px, py - 7.5, pz,
            0, 1, 0, rot,
            solidMaterial
        );
    };

    let minX = -20;
    let maxX = 20;
    let minY = 2;
    let maxY = 5;
    let minZ = -55;
    let maxZ = -18;
    let minR = 1.2;
    let maxR = 1.8;

    let count = 40;

    let rng = Mulberry32(4);
    for (let i = 0; i < count; ++i)
    {
        createSphere(Lerp(minX, maxX, rng()), Lerp(minY, maxY, rng()), Lerp(minZ, maxZ, rng()), Lerp(minR, maxR, rng()));
    }

    minX = -10;
    maxX = 10;
    maxZ = -65;
    minZ = -95;
    minY = 3;
    rng = Mulberry32(6);
    for (let i = 0; i < count; ++i)
    {
        createSphere(Lerp(minX, maxX, rng()), Lerp(minY, maxY, rng()), Lerp(minZ, maxZ, rng()), 1, false, rng() * Math.PI);
    }

    CreateFinishObject(0, 5, -105, 0);
}

function Level7()
{
    playerStartingPosition.setValues(0, 30, 0);
    playerStartingRotation = 0;
    lightPositionForLevel.setValues(-3, 3, -1);

    CreateSimpleCollidableBox(
        10, 5, 35,
        0, 0, -15,
        0, 0, 0, 0,
        solidMaterial
    );

    for (let i = 0; i < 10; ++i)
    {
        Elevator(CreateSawBladeLevelObject(
            1.5,
            i - 4.5, 2.5, 0,
            Math.PI / -2
        ), -25, -15, 3, i, 2);
    }

    CreateSimpleCollidableBox(
        10, 2, 20,
        0, -1, -45,
        1, 0, 0, 0.2,
        solidMaterial
    );

    CreatePowerup(0, 2, -52, arrowUpTexture, HighJump);

    CreateSimpleCollidableBox(
        5, 20, 5,
        0, 0, -60,
        0, 0, 0, 0,
        solidMaterial
    );
    CreateSimpleCollidableBox(
        5, 35, 5,
        0, 0, -72,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        5, 50, 5,
        10, 0, -72,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        10, 40, 5,
        20, 0, -72,
        0, 0, 0, 0,
        solidMaterial
    );

    CreatePowerup(20, 21, -72, lightningTexture, SpeedBoost);

    CreateSimpleCollidableBox(
        5, 35, 5,
        37, 0, -65,
        0, 1, 0, -0.3,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        5, 30, 5,
        45, 0, -50,
        0, 1, 0, 1,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        5, 25, 5,
        55, 0, -40,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        5, 20, 5,
        55, 0, -25,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateTrampolineLevelObject(
        4.99, 0.5, 4.99,
        55, 10, -25,
        trampolineMaterial
    );

    CreateSimpleCollidableBox(
        10, 20, 5,
        55, 0, -12,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateFinishObject(55, 10, -10, 0);
}

function Level6()
{
    playerStartingPosition.setValues(0, 30, 0);
    playerStartingRotation = 0;
    lightPositionForLevel.setValues(1, 3, 3);

    CreateSimpleCollidableBox(
        10, 5, 30,
        0, 0, -10,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        10, 1, 10,
        0, 7, -20,
        0, 0, 0, 0,
        tiltingBlockMaterial
    ).onUpdate.push(obj => obj.transform.rotation.setFromAxisAngle(0, 0, 1, physicsTime));

    CreateSimpleCollidableBox(
        10, 1, 10,
        8, 14, -20,
        0, 0, 0, 0,
        tiltingBlockMaterial
    ).onUpdate.push(obj => obj.transform.rotation.setFromAxisAngle(0, 0, 1, -physicsTime + Math.PI / 2));

    CreateSimpleCollidableBox(
        10, 1, 10,
        0, 21, -20,
        0, 0, 0, 0,
        tiltingBlockMaterial
    ).onUpdate.push(obj => obj.transform.rotation.setFromAxisAngle(0, 0, 1, physicsTime));

    CreateSimpleCollidableBox(
        0.5, 50, 0.5,
        0, 0, -25.25,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        0.5, 50, 0.5,
        0, 0, -14.75,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        0.5, 30, 0.5,
        8, 0, -25.25,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        0.5, 30, 0.5,
        8, 0, -14.75,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        10, 1, 10,
        -10, 25, -20,
        0, 0, 0, 0,
        solidMaterial
    );
    CreateSimpleCollidableBox(
        1, 50, 1,
        -10, 0, -20,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        40, 50, 10,
        -36, 0, -20,
        0, 0, 0, 0,
        solidMaterial
    );

    Elevator(CreateSimpleCollidableBox(
        10, 10, 10,
        -26, 30, 0,
        0, 0, 0, 0,
        movingBlockMaterial
    ), -24, -16, 1.2, 0, 2);

    Elevator(CreateSimpleCollidableBox(
        2, 10, 5,
        -50, 0, -20,
        0, 0, 0, 0,
        elevatorMaterial
    ), 20.01, 30, 3);

    CreateSimpleCollidableBox(
        1, 90, 10,
        -60, 0, -20,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        1, 70, 10,
        -70, 0, -20,
        0, 0, 0, 0,
        solidMaterial
    );

    for (let i = 0; i < 10; ++i)
    {
        CreateSawBladeLevelObject(
            3,
            -60, 45, -20 - 4.5 + i,
            0
        );

        CreateSawBladeLevelObject(
            3,
            -70, 35, -20 - 4.5 + i,
            0
        );
    }

    CreateSimpleCollidableBox(
        2, 60, 10,
        -65, 0, -20,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateTrampolineLevelObject(
        1.99, 0.5, 9.99,
        -65, 30, -20,
        trampolineMaterial
    );

    CreateSimpleCollidableBox(
        20, 50, 10,
        -85, 0, -20,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateFinishObject(-94, 25, -20, Math.PI / 2);
}

function Level8()
{
    playerStartingPosition.setValues(0, 30, -2);
    playerStartingRotation = Math.PI;
    lightPositionForLevel.setValues(3, 3, -1);

    CreateSimpleCollidableBox(
        10, 5, 20,
        0, 0, 5,
        0, 0, 0, 0,
        solidMaterial
    );

    Elevator(CreateSimpleCollidableBox(
        5, 10, 2,
        0, 0, 10,
        0, 0, 0, 0,
        elevatorMaterial
    ), -2.49, 7, 4);

    CreateSimpleCollidableBox(
        1, 50, 10,
        -5.5, 0, 10,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        1, 50, 10,
        5.5, 0, 10,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        12, 50, 1,
        0, 0, 15.5,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        12, 15, 1,
        0, 17.5, 4.5,
        0, 0, 0, 0,
        solidMaterial
    );

    for (let i = 0; i < 10; ++i)
    {
        Elevator(CreateSawBladeLevelObject(
            3,
            4.5 - i, 20, 0,
            Math.PI / 2
        ), 6, 14, 3.23, 0, 2);
    }

    Elevator(CreateSimpleCollidableBox(
        10, 0.3, 0.3,
        0, 20, 0,
        0, 0, 0, 0,
        elevatorMaterial
    ), 6, 14, 3.23, 0, 2);

    CreateSimpleCollidableBox(
        10, 40, 10,
        0, 0, 20,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        1, 80, 10,
        -5.5, 0, 35,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        1, 80, 10,
        5.5, 0, 35,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        12, 55, 1,
        0, 0, 29.5,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        12, 31, 1,
        0, 24.5, 40.5,
        0, 0, 0, 0,
        solidMaterial
    );

    CreateSimpleCollidableBox(
        10, 5, 80,
        0, 0, 70,
        0, 0, 0, 0,
        solidMaterial
    );

    CreatePowerup(0, 21, 24, arrowUpTexture, HighJump);

    Elevator(CreateSimpleCollidableBox(
        10, 0.3, 0.3,
        0, 25, 0,
        0, 0, 0, 0,
        elevatorMaterial
    ), 31, 39, 3.23, 0, 2);

    Elevator(CreateSimpleCollidableBox(
        0.3, 0.3, 10,
        0, 20, 35,
        0, 0, 0, 0,
        elevatorMaterial
    ), -4, 4, 3.23, 1, 0);

    Elevator(CreateSimpleCollidableBox(
        10, 0.3, 0.3,
        0, 15, 0,
        0, 0, 0, 0,
        elevatorMaterial
    ), 31, 39, 3.23, 2, 2);

    Elevator(CreateSimpleCollidableBox(
        0.3, 0.3, 10,
        0, 10, 35,
        0, 0, 0, 0,
        elevatorMaterial
    ), -4, 4, 3.23, 3, 0);

    for (let i = 0; i < 10; ++i)
    {
        Elevator(CreateSawBladeLevelObject(
            3,
            4.5 - i, 25, 0,
            Math.PI / 2
        ), 31, 39, 3.23, 0, 2);

        Elevator(CreateSawBladeLevelObject(
            3,
            0, 20, 39.5 - i,
            0
        ), -4, 4, 3.23, 1, 0);

        Elevator(CreateSawBladeLevelObject(
            3,
            4.5 - i, 15, 0,
            Math.PI / 2
        ), 31, 39, 3.23, 2, 2);

        Elevator(CreateSawBladeLevelObject(
            3,
            0, 10, 39.5 - i,
            0
        ), -4, 4, 3.23, 3, 0);
    }

    CreatePowerup(0, 3.5, 45, lightningTexture, SpeedBoost);

    for (let i = 0; i < 100; ++i)
    {
        CreateSpikesLevelObject(
            25, 1,
            0, 3.5, 50 + i * 0.4,
            10, -i / 3
        );
    }

    CreateFinishObject(0, 2.5, 108, 0);
}

const levels: (() => void)[] = [
    // Level0,
    Level1,
    Level2,
    Level3,
    Level4,
    Level5,
    Level6,
    Level7,
    Level8
];

let currentLevel = 0;

const lava = new Lava(CreateBoxGeometry(1000, 1, 1000));
lava.transform.position.y = -1;
scene.add(lava);

function CheckLava()
{
    if (player.transform.position.y - playerRadius < lava.transform.position.y + 0.5)
    {
        Restart(RestartReason.Lava);
    }
}

const player = new Mesh({ vertices: new Float32Array(), triangles: new Uint32Array(), normals: new Float32Array() }, solidMaterial);
scene.add(player);

const playerRadius = 0.4;

const camera = new Camera();
camera.transform.position.y = 1.5;
// camera.transform.position.z = 0.05; // pull back the camera a bit
player.add(camera);

function Resize()
{
    const fov = 80;
    camera.setProjectionMatrixPerspecive(fov, (canvas.width = window.innerWidth) / (canvas.height = window.innerHeight), 0.1, 200);
}

Resize();
window.addEventListener("resize", Resize);

let left = 0;
let right = 0;
let forward = 0;
let backwards = 0;
let jump = 0;
window.addEventListener("keydown", ev =>
{
    switch (ev.code)
    {
        case "KeyW": forward = 1; break;
        case "KeyA": left = 1; break;
        case "KeyS": backwards = 1; break;
        case "KeyD": right = 1; break;
        case "Space": jump = 1; break;
    }
});

window.addEventListener("keyup", ev =>
{
    switch (ev.code)
    {
        case "KeyW": forward = 0; break;
        case "KeyA": left = 0; break;
        case "KeyS": backwards = 0; break;
        case "KeyD": right = 0; break;
        case "Space": jump = 0; break;
    }
});

let locked: Element | null = null;
canvas.addEventListener("click", _ =>
{
    canvas.requestPointerLock();
});

document.addEventListener("pointerlockchange", _ =>
{
    locked = document.pointerLockElement;
});

let pitch = 0;
let yaw = 0;

function UpdateCamera()
{
    player.transform.rotation.setFromAxisAngle(0, 1, 0, yaw);
    camera.transform.rotation.setFromAxisAngle(1, 0, 0, pitch);
}

window.addEventListener("mousemove", ev =>
{
    if (!locked)
    {
        return;
    }

    const sensitivity = 0.002;
    const { movementX, movementY } = ev;
    yaw -= movementX * sensitivity;
    pitch = Clamp(pitch - movementY * sensitivity, -Math.PI / 2, Math.PI / 2);

    UpdateCamera();
});

// if the fixed delta time is precisely equal to the framerate,
// then it'll start jittering on firefox, because of the timer resolution
// frame 0: 16.666 ms, which is < 16.66666666666666, so no physics frames are processed
// frame 1: 16.666 ms again, 33.332 in total, which is >= 16.66666666666666, so 1 physics frame is processed
//          we still have 16.665333333333333333 remaining
// frame 2: 16.668 ms, which is exactly 33.3333333333, so process 2 frames
// this keeps repeating, which means we don't update physics for 1 frame, then update it once next frame,
// then update it twice next frame (effectively having a weird 20fps and 40fps combination, which looks bad)
// to fix this, just make sure that the physics timer goes a little bit faster (or slower)
// by using 60.001 fps for physics, we'll only have 1 extra physics frame once every ~60000 rendered frames
// (this is all assuming 60 fps for rendering)
const fixedDeltaTime = 1 / 60.001;
const playerVelocity = new Vector3();
const gravity = -0.3;
let onGround = false;
const jumpVelocity = 0.1;
const highJumpVelocity = 0.3;

function Trampoline()
{
    playerVelocity.y = 0.3;
}

const enum PowerupType
{
    SpeedBoost, HighJump
}

let powerupType = PowerupType.SpeedBoost;
const powerupMaxDuration = 5;
let powerupDuration = 0;

const powerupContainer = document.getElementById("powerup-container")!;
const powerupBar = document.getElementById("powerup-bar")!;
const powerupTextElement = document.getElementById("powerup-text")!;
let powerupText = "";

function SpeedBoost()
{
    powerupDuration = powerupMaxDuration;
    powerupType = PowerupType.SpeedBoost;
    powerupText = "Speed boost";
    powerupContainer.style.opacity = "1";
}

function HighJump()
{
    powerupDuration = powerupMaxDuration;
    powerupType = PowerupType.HighJump;
    powerupText = "High jump";
    powerupContainer.style.opacity = "1";
}

function UpdateMatrixForColliders(node: SceneNode)
{
    node.traverse(child => child instanceof Collider && child.updateMatrix());
}

let prevMaxSpeed = 0;
function UpdatePhysics()
{
    const now = physicsTime;

    // call update, also update matrix if the object is dynamic
    currentLevelObjects.forEach(obj =>
    {
        obj.onUpdate.forEach(fn => fn(obj.object));
        obj.onUpdate.length > 0 && UpdateMatrixForColliders(obj.object);
    });

    lava.transform.position.y = now * 0.1 - 3;

    // powerups
    powerupDuration = Math.max(powerupDuration - fixedDeltaTime, 0);

    const hasSpeedBoost = powerupDuration > 0 && powerupType === PowerupType.SpeedBoost;
    const hasHighJump = powerupDuration > 0 && powerupType === PowerupType.HighJump;

    powerupContainer.style.opacity = powerupDuration > 0 ? "1" : "0";
    powerupBar.style.width = powerupDuration / powerupMaxDuration * 100 + "%";
    powerupTextElement.textContent = powerupText + " - " + powerupDuration.toFixed(1);

    // calculate force from inputs
    const maxSpeed = hasSpeedBoost ? 0.2 : 0.08;
    const currentMaxSpeed = Lerp(prevMaxSpeed, maxSpeed, 0.1);
    prevMaxSpeed = currentMaxSpeed;

    const speed = hasSpeedBoost ? 3 : 1;
    const airSpeed = speed / 8;

    const rightMovement = right - left;
    const forwardMovement = forward - backwards;

    const force = new Vector3(rightMovement, 0, -forwardMovement)
        .safeNormalize()
        .mulScalar(onGround ? speed : airSpeed)
        .applyQuaternion(player.transform.rotation)
        .mulScalar(fixedDeltaTime);

    playerVelocity.add(force);
    const prevY = playerVelocity.y;
    playerVelocity.y = 0;

    // limit speed and decelerate
    const currentSpeed = playerVelocity.length;

    // higher number = decelerate faster
    const decelerationRateOnGround = 10;
    const decelerationRateInAir = 1;
    const decelerationRate = onGround ? decelerationRateOnGround : decelerationRateInAir;

    playerVelocity.safeNormalize().mulScalar(Math.min(currentSpeed * (1 - fixedDeltaTime * decelerationRate), currentMaxSpeed));

    playerVelocity.y = Math.max(prevY + gravity * fixedDeltaTime, -0.5);

    if (jump && onGround)
    {
        onGround = false;
        playerVelocity.y = Math.max(playerVelocity.y, hasHighJump ? highJumpVelocity : jumpVelocity);
    }

    const prevPosition = player.transform.position.clone();
    player.transform.position.add(playerVelocity);

    let hasCollisionWithGround = false;

    for (const coll of colliders)
    {
        const offset = coll.resolveCollision(player.transform.position, playerRadius);
        if (offset)
        {
            player.transform.position.add(offset);

            if (offset.clone().normalize().dot(up) > 0.1)
            {
                // TODO?: don't slide when this is true, or maybe it's a feature?
                playerVelocity.y = Math.max(playerVelocity.y, 0);
                hasCollisionWithGround = true;
            }
        }
    }

    onGround = hasCollisionWithGround;

    // keep momentum
    playerVelocity.copyFrom(player.transform.position).sub(prevPosition);

    triggers.forEach(t => t.checkCollision());
    CheckLava();
}

let running = true;
let lastTime = 0;
let accumulatedTime = 0;
let physicsTime = 0;
const maxAccumulatedTime = fixedDeltaTime * 5;
function Render(now: number)
{
    requestAnimationFrame(Render);

    if (!running)
    {
        return;
    }

    // ms -> seconds
    now /= 1000;

    const delta = now - lastTime;
    lastTime = now;
    accumulatedTime = Math.min(accumulatedTime + delta, maxAccumulatedTime);
    while (accumulatedTime > fixedDeltaTime)
    {
        physicsTime += fixedDeltaTime;
        accumulatedTime -= fixedDeltaTime;
        UpdatePhysics();
    }

    scene.playerPosition.copyFrom(player.transform.position);
    running && scene.renderScene(camera);
}

requestAnimationFrame(Render);

const enum RestartReason
{
    ManualRestart,
    LevelChange,
    SawBlade,
    Spikes,
    Lava
}

const overlay = document.getElementById("overlay")!;
const deathText = document.getElementById("death-text")!;
const deathText2 = document.getElementById("inner")!;

let justStarted = true;
async function Restart(reason: RestartReason)
{
    powerupContainer.style.opacity = "0";
    running = false;

    if (true) // debug
    {
        if (reason === RestartReason.Lava)
        {
            overlay.classList.add("lava");
        }
        else
        {
            overlay.classList.add("dead");
        }

        switch (reason)
        {
            case RestartReason.Lava:
                deathText.textContent = "You burned in lava";
                break;
            case RestartReason.SawBlade:
                deathText.textContent = "You were sliced by saw blades";
                break;
            case RestartReason.Spikes:
                deathText.textContent = "You were impaled by spikes";
                break;
            case RestartReason.LevelChange:
                deathText.textContent = "You survive... for now";
                break;
        }

        deathText.classList.add("visible");

        if (reason === RestartReason.LevelChange)
        {
            deathText2.style.display = "none";

            if (justStarted)
            {
                deathText.textContent = "Welcome to the Deadly™ Obstacle Course!\n\nAre you ready to die?\n\n\n(Click to begin)";

                while (!locked)
                {
                    await new Promise(requestAnimationFrame);
                }
            }
            else if (currentLevel === 4)
            {
                deathText.textContent = "Congratulations! You've completed...";
                deathText2.style.display = "";
                deathText2.textContent = "...the easy levels! Let's increase the difficulty a bit, shall we?\n\n\n(Click to continue)";

                await new Promise(res => setTimeout(res, 1500));
                deathText2.classList.add("visible");

                await new Promise<void>(resolve =>
                {
                    const clicked = () =>
                    {
                        window.removeEventListener("click", clicked);
                        resolve();
                    };
                    window.addEventListener("click", clicked);
                });

                justStarted = true; // to skip the waiting
            }
            else if (currentLevel === levels.length)
            {
                deathText.textContent = "Congratulations! You've completed all the levels!\n\nIt wasn't so hard, was it?";
                deathText2.style.display = "";
                deathText2.textContent = "Thanks for playing!";

                await new Promise(res => setTimeout(res, 2500));
                deathText2.classList.add("visible");

                await new Promise(_ => { }); // don't continue
            }
        }
        else
        {
            const texts = [
                "Anyways", "Try again", "Sigh", "Don't let this happen again", "Pathetic",
                "You can do better than this", "I expected more from you", "Again", "Try harder"
            ];
            deathText2.textContent = texts[Math.random() * texts.length | 0] + "...";
        }

        if (justStarted)
        {
            justStarted = false;
        }
        else
        {
            await new Promise(res => setTimeout(res, 1300));

            deathText2.classList.add("visible");
            // overlay.classList.remove("lava");
            // overlay.classList.add("dead");
            await new Promise(res => setTimeout(res, 1300));
        }

        deathText.classList.remove("visible");
        deathText2.classList.remove("visible");
        overlay.classList.remove("dead");
        overlay.classList.remove("lava");
        overlay.classList.add("respawn");

        await new Promise(res => setTimeout(res, 700));

        deathText2.style.display = "";
    }

    running = true;

    accumulatedTime = fixedDeltaTime + 0.001;
    physicsTime = -1.99;

    triggers.forEach(t => t.setEnabled(true));

    scene.light.transform.position.copyFrom(lightPositionForLevel);
    player.transform.position.copyFrom(playerStartingPosition);
    playerVelocity.setValues(0, -0.5, 0);
    pitch = 0;
    yaw = playerStartingRotation;
    prevMaxSpeed = 0;

    powerupDuration = 0;

    UpdateCamera();

    overlay.classList.remove("dead");
    overlay.classList.remove("respawn");
    deathText2.classList.remove("visible");
}

async function FinishLevel()
{
    ++currentLevel;
    if (currentLevel < levels.length)
    {
        CreateLevel(levels[currentLevel]);
    }
    else
    {
        Restart(RestartReason.LevelChange);
    }
}

CreateLevel(levels[currentLevel]);

document.body.appendChild(canvas);

})();
