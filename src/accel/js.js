import { registerBackend } from "./common.js";

function matmulF64(task) {
  const { a, b, aShape, bShape } = task;
  const [ar, ac] = aShape;
  const [br, bc] = bShape;
  const out = new Float64Array(ar * bc);

  // i-k-j 顺序对行主序 B 更缓存友好
  for (let i = 0; i < ar; i++) {
    const aRow = i * ac;
    const oRow = i * bc;
    for (let k = 0; k < ac; k++) {
      const av = a[aRow + k];
      if (av === 0) continue;
      const bRow = k * bc;
      for (let j = 0; j < bc; j++) {
        out[oRow + j] += av * b[bRow + j];
      }
    }
  }
  return out;
}

function elementwiseF64(task) {
  const { a, b, subOp } = task;
  const out = new Float64Array(a.length);
  for (let i = 0; i < a.length; i++) {
    if (subOp === "add") out[i] = a[i] + b[i];
    else if (subOp === "sub") out[i] = a[i] - b[i];
    else if (subOp === "mul") out[i] = a[i] * b[i];
    else if (subOp === "div") out[i] = b[i] === 0 ? 0 : a[i] / b[i];
    else out[i] = a[i];
  }
  return out;
}

registerBackend("js", (task) => {
  if (task.op === "matmul") return matmulF64(task);
  if (task.op === "elementwise") return elementwiseF64(task);
  throw new Error(`js backend does not support ${task.op}`);
});
