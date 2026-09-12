'use client';

import { useEffect, useRef, useState } from 'react';
import type {Content} from '@/lib/content';

const vertex = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

// A warped height field gives a continuous surface; its normal samples a
// procedural studio environment to produce moving chrome reflections.
const fragment = `
precision highp float;
uniform vec2 resolution;
uniform float time;
uniform float colorStrength;
uniform float textureStrength;
float surface(vec2 p) {
  float t = time * 0.14;
  p += 0.48 * vec2(sin(p.y * 1.65 + t), cos(p.x * 1.35 - t * 0.8));
  p += 0.22 * vec2(sin(p.y * 3.1 - t * 0.7), cos(p.x * 2.8 + t));
  return sin(p.x * 1.75 + p.y * 0.7 + t) * 0.55
       + cos(p.y * 2.4 - p.x * 0.9 - t * 0.6) * 0.32
       + sin(p.x * 3.8 + p.y * 2.2 + t * 0.8) * 0.12;
}
vec3 palette(float phase) {
  return 0.56 + 0.44 * cos(6.28318 * (phase + vec3(0.0, 0.16, 0.34)));
}
void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  vec2 p = (gl_FragCoord.xy - resolution * 0.5) / resolution.y * 3.1;
  p.x += 0.65;
  float h = surface(p);
  float e = 0.008;
  vec3 n = normalize(vec3((h - surface(p + vec2(e, 0.0))) / e,
                         (h - surface(p + vec2(0.0, e))) / e, 0.72));
  vec3 r = reflect(vec3(0.0, 0.0, -1.0), n);
  float bands = sin(r.x * 4.5 + r.y * 2.8 + h * 1.8);
  float wide = smoothstep(-0.55, 0.7, bands);
  float strip = pow(max(0.0, cos(r.y * 5.0 - r.x * 2.2)), 22.0);
  float edge = pow(1.0 - max(n.z, 0.0), 2.0);
  vec3 tint = palette(time * 0.013 + h * 0.11 + r.x * 0.14);
  vec3 col = mix(vec3(0.025, 0.034, 0.048), vec3(0.7, 0.75, 0.8), wide);
  col = mix(col, col * tint * 1.6, colorStrength);
  col += strip * mix(vec3(0.88, 0.94, 1.0), tint, colorStrength * 0.47) * 0.85;
  col += edge * mix(vec3(1.0),tint,colorStrength) * 0.3;
  float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898,78.233))) * 43758.5453);
  col += (grain - 0.5) * textureStrength;
  col *= 1.0 - 0.32 * length(uv - 0.5);
  gl_FragColor = vec4(col, 1.0);
}
`;

export default function LiquidMetal({settings={enabled:true,speed:1,color:0.53,texture:0.033}}:{settings?:Content["hero"]}) {
  const settingsRef=useRef(settings);
  useEffect(()=>{settingsRef.current=settings},[settings]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [available, setAvailable] = useState(false);
  const pausedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false, powerPreference: 'low-power' });
    if (!gl) return;
    const shaders: WebGLShader[] = [];
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
    };
    const vs = compile(gl.VERTEX_SHADER, vertex);
    const fs = compile(gl.FRAGMENT_SHADER, fragment);
    const program = gl.createProgram();
    if (!vs || !fs || !program) {
      shaders.forEach(s => gl.deleteShader(s));
      if (program) gl.deleteProgram(program);
      return;
    }
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      shaders.forEach(s => gl.deleteShader(s));
      gl.deleteProgram(program);
      return;
    }
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const resolution = gl.getUniformLocation(program, 'resolution');
    const time = gl.getUniformLocation(program, 'time');
    const color = gl.getUniformLocation(program, 'colorStrength');
    const texture = gl.getUniformLocation(program, 'textureStrength');
    let elapsed = 12;
    let visible = true;
    let frame = 0;
    let previous = 0;
    let lastDraw = 0;
    let lost = false;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    pausedRef.current = reduced.matches;
    const draw = () => {
      if (lost) return;
      gl.uniform1f(time, elapsed);
      gl.uniform1f(color,settingsRef.current.color);
      gl.uniform1f(texture,settingsRef.current.texture);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 1.25);
      canvas.width = Math.max(1, Math.round(rect.width * ratio));
      canvas.height = Math.max(1, Math.round(rect.height * ratio));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(resolution, canvas.width, canvas.height);
      draw();
    };
    const tick = (now: number) => {
      const delta = previous ? Math.min((now - previous) / 1000, 0.06) : 0;
      previous = now;
      if (visible && !document.hidden && !lost) {
        if (!pausedRef.current && settingsRef.current.enabled) elapsed += delta * settingsRef.current.speed;
        if (now - lastDraw >= 32) { lastDraw = now; draw(); }
      }
      frame = requestAnimationFrame(tick);
    };
    const preference = () => { pausedRef.current = reduced.matches; };
    const contextLost = (event: Event) => { event.preventDefault(); lost = true; setAvailable(false); };
    const resizeObserver = new ResizeObserver(resize);
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    resizeObserver.observe(canvas);
    intersection.observe(canvas);
    reduced.addEventListener('change', preference);
    canvas.addEventListener('webglcontextlost', contextLost);
    resize();
    setAvailable(true);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersection.disconnect();
      reduced.removeEventListener('change', preference);
      canvas.removeEventListener('webglcontextlost', contextLost);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      shaders.forEach(s => gl.deleteShader(s));
    };
  }, []);

  return <>
    <div className="metal-surface" aria-hidden="true"><canvas ref={canvasRef} style={{opacity:available ? 1 : 0}} /></div>
  </>;
}
