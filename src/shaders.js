import { resX, resY } from './display.js'

export const VERTEX_DEFAULT = 0
export const VERTEX_QUAD = 1
export const FRAGMENT_QUAD = 2
export const FRAGMENT_AO = 3
export const FRAGMENT_DIFFUSE = 4
export const FRAGMENT_BLUR = 5
export const FRAGMENT_AMBIENT = 6
export const VERTEX_LIGHT = 7
export const FRAGMENT_LIGHT = 8
export const FRAGMENT_SCREEN = 9

const preamble = `#version 300 es
precision mediump float;precision mediump sampler2D;precision mediump sampler2DArray;const vec2 res=vec2(${1 / resX},${1 / resY});`

const colorFragPreamble = `${preamble}
out vec4 col;
in vec2 uv;
uniform sampler2D tex0;`

export const shaders = [
// VERTEX_DEFAULT
`${preamble}
layout(location=0) in vec2 vp;
layout(location=1) in vec2 tc;
out vec2 uv;
void main(){
 uv=tc;
 gl_Position=vec4((vp*res)*2.-1.,0.,1.);
}`,

// VERTEX_QUAD
`${preamble}
layout(location=0) in vec2 vp;
layout(location=1) in vec2 tc;
layout(location=2) in vec4 pos;
out vec3 uv;
uniform vec3 xy;
flat out vec2 flip;
void main(){
 uv=vec3(tc,pos.z);
 flip=vec2(pos.w*-2.+1.,pos.w);
 uv.x=uv.x*flip.x+flip.y;
 vec2 p=((vp+pos.xy-xy.xy)*res)*2.-1.;
 gl_Position=vec4(p,0.,1.);
}`,

// FRAGMENT_QUAD
`${preamble}
layout(location=0) out vec4 col;
layout(location=1) out vec4 norm;
in vec3 uv;
flat in vec2 flip;
uniform sampler2DArray tex0,tex1;
uniform float alpha;
void main(){
 col=texture(tex0,uv);
 col.w*=alpha;
 col.xyz*=col.w;
 norm=vec4(texture(tex1,uv).xyz,col.w);
 norm.x=norm.x*flip.x+flip.y;
 norm.xyz*=col.w;
}`,

// FRAGMENT_AO
`${colorFragPreamble}
void main(){
 col=texture(tex0,uv).aaaa;
}`,

//FRAGMENT_DIFFUSE
`${colorFragPreamble}
uniform sampler2D tex1,tex2;
void main(){
 vec4 t=texture(tex0,uv);
 col=vec4(mix(texture(tex1,uv).xyz*(1.-texture(tex2,uv).x),t.xyz,t.w),1.);
}`,

// FRAGMENT_BLUR
`${colorFragPreamble}
uniform vec3 dir;
void main(){
 col=dir.z*(texture(tex0,uv)+texture(tex0,uv-dir.xy*1.)+texture(tex0,uv-dir.xy*2.)+texture(tex0,uv-dir.xy*3.)+texture(tex0,uv-dir.xy*4.)+texture(tex0,uv+dir.xy*1.)+texture(tex0,uv+dir.xy*2.)+texture(tex0,uv+dir.xy*3.)+texture(tex0,uv+dir.xy*4.));
}`,

// FRAGMENT_AMBIENT
`${colorFragPreamble}
void main(){
 col=vec4(vec3(.07,.08,.09)*texture(tex0,uv).xyz,1.);
}`,

// VERTEX_LIGHT
`${preamble}
layout(location=0) in vec2 vp;
layout(location=1) in vec4 lp;
layout(location=2) in vec4 col;
layout(location=3) in vec4 dir;
flat out vec4 p;
flat out vec3 c;
flat out vec4 d;
out vec2 uv;
uniform vec3 xy;
void main(){
 vec2 lxy=vec2(vp.x/dir[int(max(.0,sign(-vp.x)))],vp.y/dir[int(max(.0,sign(-vp.y)))+2]);
 p=vec4(lp.xy-xy.xy,lp.zw);
 c=col.xyz*col.w;
 d=dir;
 uv=(lxy*p.w+p.xy)*res;
 gl_Position=vec4(uv*2.-1.,0.,1.);
}`,

// FRAGMENT_LIGHT
`${colorFragPreamble}
uniform sampler2D tex1;
flat in vec4 p;
flat in vec3 c;
flat in vec4 d;
vec3 light(vec3 t,vec3 norm,float s){
 vec3 ld=vec3(p.xy-gl_FragCoord.xy,p.z);
 ld.x*=d[int(max(.0,sign(ld.x)))];
 ld.y*=d[int(max(.0,sign(ld.y)))+2];
 float dn=max(dot(norm,normalize(ld)),0.);
 float a=max(0.,1.-(length(ld)/p.w));
 return t*(c*dn*a)+(c*pow(dn,.5+s)*a);
}
void main(){
 vec4 t=texture(tex0,uv),n=texture(tex1,uv);
 vec3 norm=normalize(vec3(n.xy*2.-1.,1.));
 col=vec4(light(t.xyz*t.w,norm,n.z*128.),1.);
}`,

// FRAGMENT_SCREEN
`${colorFragPreamble}
void main(){
 col=texture(tex0,vec2(uv.x,1.-uv.y));
}`,
]