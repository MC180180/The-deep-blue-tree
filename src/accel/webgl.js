import { registerBackend, markAvailable, CONFIG } from "./common.js";

let ctx; // undefined = 尚未初始化，null = 不可用

const VERT = `#version 300 es
layout(location = 0) in vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const MATMUL_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uA;
uniform sampler2D uB;
uniform int uAc;
uniform int uBc;
out vec4 fragColor;
void main() {
  int row = int(gl_FragCoord.y);
  int col = int(gl_FragCoord.x);
  float sum = 0.0;
  for (int k = 0; k < uAc; k++) {
    sum += texelFetch(uA, ivec2(k, row), 0).r * texelFetch(uB, ivec2(col, k), 0).r;
  }
  fragColor = vec4(sum, 0.0, 0.0, 1.0);
}`;

const ELEMENTWISE_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uA;
uniform sampler2D uB;
uniform int uWidth;
uniform int uN;
uniform int uOp;
out vec4 fragColor;
void main() {
  int x = int(gl_FragCoord.x);
  int y = int(gl_FragCoord.y);
  int idx = y * uWidth + x;
  if (idx >= uN) {
    fragColor = vec4(0.0);
    return;
  }
  float av = texelFetch(uA, ivec2(x, y), 0).r;
  float bv = texelFetch(uB, ivec2(x, y), 0).r;
  float result = 0.0;
  if (uOp == 0) result = av + bv;
  else if (uOp == 1) result = av - bv;
  else if (uOp == 2) result = av * bv;
  else if (uOp == 3) result = bv == 0.0 ? 0.0 : av / bv;
  fragColor = vec4(result, 0.0, 0.0, 1.0);
}`;

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`WebGL2 shader compile failed: ${log}`);
  }
  return shader;
}

function program(gl, fragmentSource) {
  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const p = gl.createProgram();
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(p);
    gl.deleteProgram(p);
    throw new Error(`WebGL2 program link failed: ${log}`);
  }
  return p;
}

function packRGBA(data, width, height) {
  const packed = new Float32Array(width * height * 4);
  for (let i = 0; i < data.length; i++) {
    packed[i * 4] = data[i];
    packed[i * 4 + 3] = 1;
  }
  return packed;
}

function createTexture(gl, data, width, height) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const pixels = data ? packRGBA(data, width, height) : null;
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, pixels);
  return tex;
}

function createTarget(gl, width, height) {
  const texture = createTexture(gl, null, width, height);
  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
    gl.deleteFramebuffer(fbo);
    gl.deleteTexture(texture);
    throw new Error("WebGL2 float framebuffer incomplete");
  }
  return { texture, fbo };
}

function readTarget(gl, target, width, height, length) {
  const pixels = new Float32Array(width * height * 4);
  gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.FLOAT, pixels);
  const out = new Float64Array(length);
  for (let i = 0; i < length; i++) out[i] = pixels[i * 4];
  gl.deleteFramebuffer(target.fbo);
  gl.deleteTexture(target.texture);
  return out;
}

function initGL() {
  if (ctx !== undefined) return ctx;
  ctx = null;
  if (typeof document === "undefined") return ctx;

  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2", {
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
  });
  if (!gl || !gl.getExtension("EXT_color_buffer_float")) return ctx;

  const vao = gl.createVertexArray();
  const vbo = gl.createBuffer();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  ctx = {
    gl,
    vao,
    maxTexture: Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE), CONFIG.maxTextureSize),
    matProgram: program(gl, MATMUL_FRAG),
    elemProgram: program(gl, ELEMENTWISE_FRAG),
  };
  markAvailable("webgl2", true);
  return ctx;
}

function matmul(task, c) {
  const { gl, maxTexture, matProgram } = c;
  const [ar, ac] = task.aShape;
  const [, bc] = task.bShape;
  if (ac > maxTexture || ar > maxTexture || bc > maxTexture) {
    throw new Error("matrix exceeds WebGL2 texture limit");
  }

  const texA = createTexture(gl, task.a, ac, ar);
  const texB = createTexture(gl, task.b, bc, ac);
  const target = createTarget(gl, bc, ar);

  gl.viewport(0, 0, bc, ar);
  gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
  gl.useProgram(matProgram);
  gl.bindVertexArray(c.vao);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texA);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, texB);
  gl.uniform1i(gl.getUniformLocation(matProgram, "uA"), 0);
  gl.uniform1i(gl.getUniformLocation(matProgram, "uB"), 1);
  gl.uniform1i(gl.getUniformLocation(matProgram, "uAc"), ac);
  gl.uniform1i(gl.getUniformLocation(matProgram, "uBc"), bc);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  gl.bindVertexArray(null);

  gl.deleteTexture(texA);
  gl.deleteTexture(texB);
  return readTarget(gl, target, bc, ar, ar * bc);
}

function elementwise(task, c) {
  const { gl, maxTexture, elemProgram } = c;
  const n = task.a.length;
  const width = Math.min(n, maxTexture);
  const height = Math.ceil(n / width);
  if (height > maxTexture) throw new Error("array exceeds WebGL2 texture limit");

  const texA = createTexture(gl, task.a, width, height);
  const texB = createTexture(gl, task.b, width, height);
  const target = createTarget(gl, width, height);

  gl.viewport(0, 0, width, height);
  gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
  gl.useProgram(elemProgram);
  gl.bindVertexArray(c.vao);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texA);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, texB);
  gl.uniform1i(gl.getUniformLocation(elemProgram, "uA"), 0);
  gl.uniform1i(gl.getUniformLocation(elemProgram, "uB"), 1);
  gl.uniform1i(gl.getUniformLocation(elemProgram, "uWidth"), width);
  gl.uniform1i(gl.getUniformLocation(elemProgram, "uN"), n);
  gl.uniform1i(gl.getUniformLocation(elemProgram, "uOp"), { add: 0, sub: 1, mul: 2, div: 3 }[task.subOp] ?? -1);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  gl.bindVertexArray(null);

  gl.deleteTexture(texA);
  gl.deleteTexture(texB);
  return readTarget(gl, target, width, height, n);
}

registerBackend("webgl2", (task) => {
  const c = initGL();
  if (!c) throw new Error("WebGL2 unavailable");
  if (task.op === "matmul") return matmul(task, c);
  if (task.op === "elementwise") return elementwise(task, c);
  throw new Error(`WebGL2 backend does not support ${task.op}`);
});
