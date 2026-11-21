import { readFile, writeFile } from "node:fs/promises";

const originalPath = new URL("../src/legacy/SLZS.original.js", import.meta.url);
const outputPath = new URL("../src/legacy/SLZS.js", import.meta.url);

let src = (await readFile(originalPath, "utf8")).replace(/\r\n/g, "\n");
const applied = [];

function expectCount(from, expected = 1) {
  const count = src.split(from).length - 1;
  if (count !== expected) {
    throw new Error(`patch anchor count ${count}, expected ${expected}: ${from.slice(0, 80).replace(/\n/g, "\\n")}`);
  }
}

function exact(from, to, label, expected = 1) {
  expectCount(from, expected);
  src = src.split(from).join(to);
  applied.push(label);
}

function regex(re, to, label) {
  if (!re.test(src)) throw new Error(`patch regex not found: ${label}`);
  src = src.replace(re, to);
  applied.push(label);
}

// ---------------------------------------------------------------------------
// 1. 注入加速后端引用
// ---------------------------------------------------------------------------
exact(
  `  const runtime = vm.runtime;// 获取运行时环境`,
  `  const runtime = vm.runtime;// 获取运行时环境\n  const Accel = globalThis.DeepBlueAccel;`,
  "inject accel reference"
);

// ---------------------------------------------------------------------------
// 2. 补齐 getInfo 中缺失的输入参数
// ---------------------------------------------------------------------------
exact(
  `            opcode: "awbw_block", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "1w*2w矩阵计算[A]x[B]", // 积木显示文本
          },`,
  `            opcode: "awbw_block", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "1w*2w矩阵计算[A]x[B]", // 积木显示文本
            arguments: {
              A: { type: Scratch.ArgumentType.STRING, defaultValue: "[1,2,3]" },
              B: { type: Scratch.ArgumentType.STRING, defaultValue: "[1,4,7,2,5,8,3,6,9]" },
            },
          },`,
  "awbw arguments"
);

exact(
  `            opcode: "awbws_block", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "1w*2w矩阵计算[A]x[B] [C]", // 积木显示文本
            arguments: {
              C: { type: Scratch.ArgumentType.NUMBER, defaultValue: "输出向量长度" }, //  定义C参数，类型为数字，默认值为空
            },
          },`,
  `            opcode: "awbws_block", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "1w*2w矩阵计算[A]x[B] [C]", // 积木显示文本
            arguments: {
              A: { type: Scratch.ArgumentType.STRING, defaultValue: "[0.5,0.8]" },
              B: { type: Scratch.ArgumentType.STRING, defaultValue: "[0.1,0.2,0.3,0.4]" },
              C: { type: Scratch.ArgumentType.NUMBER, defaultValue: 2 },
            },
          },`,
  "awbws arguments"
);

exact(
  `            opcode: "MATRIX_RESHAPE_block", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "矩阵变换[A] [B]", // 积木显示文本
            arguments: {
              B: { type: Scratch.ArgumentType.STRING, defaultValue: "目标形状 [行,列]" }, //  定义A参数，类型为数字，默认值为空
            },
          },`,
  `            opcode: "MATRIX_RESHAPE_block", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "矩阵变换[A] [B]", // 积木显示文本
            arguments: {
              A: { type: Scratch.ArgumentType.STRING, defaultValue: "[1,2,3,4]" },
              B: { type: Scratch.ArgumentType.STRING, defaultValue: "[2,2]" },
            },
          },`,
  "reshape arguments"
);

for (const [opcode, text, def] of [
  ["RELU_block", "ReLU激活[A]", "[1,-2,3]"],
  ["ELU_block", "ELU激活[A]", "[1,-2,3]"],
  ["SWISH_block", "Swish激活[A]", "[1,-2,3]"],
  ["SIGMOID_block", "Sigmoid激活[A]", "[1,-2,3]"],
]) {
  exact(
    `            opcode: "${opcode}", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "${text}", // 积木显示文本
            color1: "#82abff", // 扩展主色调
          },`,
    `            opcode: "${opcode}", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "${text}", // 积木显示文本
            color1: "#82abff", // 扩展主色调
            arguments: {
              A: { type: Scratch.ArgumentType.STRING, defaultValue: "${def}" },
            },
          },`,
    `${opcode} arguments`
  );
}

for (const [opcode, text, extra] of [
  ["MSE_LOSS_block", "均方误差损失MSE  预[A]真[B]", ""],
  ["BINARY_CROSS_ENTROPY_LOSS_block", "二元交叉熵损失BCE  预[A]真[B]", ""],
  ["HUBER_LOSS_block", "Huber损失  预[A]真[B]", `              C: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 },\n`],
]) {
  exact(
    `            opcode: "${opcode}", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "${text}", // 积木显示文本
            color1: "#ffa3ff", // 扩展主色调
          },`,
    `            opcode: "${opcode}", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "${text}", // 积木显示文本
            color1: "#ffa3ff", // 扩展主色调
            arguments: {
              A: { type: Scratch.ArgumentType.STRING, defaultValue: "[1,2,3]" },
              B: { type: Scratch.ArgumentType.STRING, defaultValue: "[0,1,1]" },
${extra}            },
          },`,
    `${opcode} arguments`
  );
}

for (const [opcode, text] of [
  ["DROPOUT_TRAIN_block", "训练时的Dropout层[A] 概率[B]"],
  ["DROPOUT_WITH_MASK_block", "带掩码输出的Dropout层[A] 概率[B]"],
  ["ALPHA_DROPOUT_block", "Alpha Dropout[A] 概率[B]"],
]) {
  const oldText = `            arguments: {
              B: { type: Scratch.ArgumentType.NUMBER, defaultValue: "0.1" }, //  定义A参数，类型为数字，默认值为空
            },`;
  const newText = `            arguments: {
              A: { type: Scratch.ArgumentType.STRING, defaultValue: "[1,2,3,4]" },
              B: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0.1 },
            },`;
  const chunk = `            opcode: "${opcode}", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "${text}", // 积木显示文本
            color1: "#42abff", // 扩展主色调
${oldText}
          },`;
  const replacement = `            opcode: "${opcode}", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "${text}", // 积木显示文本
            color1: "#42abff", // 扩展主色调
${newText}
          },`;
  exact(chunk, replacement, `${opcode} arguments`);
}

exact(
  `            opcode: "DROPOUT_EVAL_block", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "推理时的Dropout层[A]", // 积木显示文本
            color1: "#42abff", // 扩展主色调
          },`,
  `            opcode: "DROPOUT_EVAL_block", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "推理时的Dropout层[A]", // 积木显示文本
            color1: "#42abff", // 扩展主色调
            arguments: {
              A: { type: Scratch.ArgumentType.STRING, defaultValue: "[1,2,3,4]" },
            },
          },`,
  "DROPOUT_EVAL arguments"
);

exact(
  `              B: { type: Scratch.ArgumentType.NUMBER, defaultValue: "返回模式 (0=索引, 1=概率)" }, //  定义C参数，类型为数字，默认值为空`,
  `              B: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },`,
  "ONE_HOT_DECODE default"
);

exact(
  `            opcode: "RandomVariation_block", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "随机变异[A] 变异强度[B] 变异概率[C]", // 积木显示文本
            arguments: {
              B: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1.6" }, //  定义C参数，类型为数字，默认值为空A参数，类型为数字，默认值为空
              C: { type: Scratch.ArgumentType.NUMBER, defaultValue: "0.2" }, //  定义A参数，类型为数字，默认值为空
            },
          },`,
  `            opcode: "RandomVariation_block", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "随机变异[A] 变异强度[B] 变异概率[C]", // 积木显示文本
            arguments: {
              A: { type: Scratch.ArgumentType.STRING, defaultValue: "[1,2,3]" },
              B: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1.6 },
              C: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0.2 },
            },
          },`,
  "RandomVariation arguments"
);

// ---------------------------------------------------------------------------
// 3. 添加加速控制积木
// ---------------------------------------------------------------------------
const accelBlocks = `
          {
            opcode: "ACCEL_STATUS_block",
            blockType: Scratch.BlockType.REPORTER,
            text: "增强计算状态",
            color1: "#00b3a4",
            disableMonitor: true,
          },
          {
            opcode: "ACCEL_SET_THRESHOLD_block",
            blockType: Scratch.BlockType.REPORTER,
            text: "设置增强阈值[N]",
            color1: "#00b3a4",
            arguments: {
              N: { type: Scratch.ArgumentType.NUMBER, defaultValue: 4096 },
            },
          },
          {
            opcode: "ACCEL_SET_BACKEND_block",
            blockType: Scratch.BlockType.REPORTER,
            text: "强制后端[B]",
            color1: "#00b3a4",
            arguments: {
              B: { type: Scratch.ArgumentType.STRING, menu: "accel_backend" },
            },
          },
`;

regex(
  /\n        \],\n        \n        menus: \{/,
  `\n${accelBlocks}        ],\n        \n        menus: {`,
  "add accel blocks"
);

exact(
  `          match_moder: {
          acceptReporters: false,
          items: ["全局", "单个"],
          },
        },`,
  `          match_moder: {
          acceptReporters: false,
          items: ["全局", "单个"],
          },
          accel_backend: {
            acceptReporters: true,
            items: ["自动", "js", "wasm", "webgl2", "webgpu"],
          },
        },`,
  "add accel backend menu"
);

// ---------------------------------------------------------------------------
// 4. 核心矩阵计算改走加速层
// ---------------------------------------------------------------------------
const awbwNew = `async awbw_block({ A, B }) {
  try {
    const vector = Accel.toFlatFloat64(A);
    const matrix = Accel.toFlatFloat64(B);
    if (vector.length === 0) return "[]";

    const n = vector.length;
    if (matrix.length % n !== 0) return "[]";
    const m = matrix.length / n;

    const result = await Accel.matvec(vector, matrix, n, m);
    return JSON.stringify(Array.from(result));
  } catch (error) {
    return "[]";
  }
}`;
regex(
  /awbw_block\(\{ A, B \}\) \{[\s\S]*?\n\}\n\/\*\*\n \* 神经网络前向传播计算/,
  `${awbwNew}\n/**\n * 神经网络前向传播计算`,
  "replace awbw_block"
);

const awbwsNew = `async awbws_block({ A, B, C }) {
  try {
    const vector = Accel.toFlatFloat64(A);
    const weights = Accel.toFlatFloat64(B);
    const outputSize = Math.max(0, Math.floor(Number(C) || 0));
    if (vector.length === 0 || outputSize === 0) return "[]";

    const inputSize = vector.length;
    const expected = inputSize * outputSize;
    const fixedWeights = new Float64Array(expected);
    for (let i = 0; i < expected; i++) fixedWeights[i] = i < weights.length ? weights[i] : 0;

    const result = await Accel.matvec(vector, fixedWeights, inputSize, outputSize);
    return JSON.stringify(Array.from(result));
  } catch (error) {
    return "[]";
  }
}`;
regex(
  /awbws_block\(\{ A, B, C \}\) \{[\s\S]*?\n\}\n\/\*\*\n \* 随机变异极速版本/,
  `${awbwsNew}\n/**\n * 随机变异极速版本`,
  "replace awbws_block"
);

// ---------------------------------------------------------------------------
// 5. 修复 Adam / SGD 状态（E 是 JSON 字符串）
// ---------------------------------------------------------------------------
exact(
  `        const lr = parseFloat(D) || 0.01;`,
  `        const lr = parseFloat(D) || 0.01;

        let config = E;
        if (typeof config === "string") {
          try { config = JSON.parse(config); } catch (e) { config = {}; }
        }
        if (!config || typeof config !== "object") config = {};`,
  "parse optimizer config"
);

exact(
  `        let m_arr = new Array(n).fill(0);
        let v_arr = new Array(n).fill(0);
        let t = 1;`,
  `        let m_arr = new Array(n).fill(0);
        let v_arr = new Array(n).fill(0);
        let velocity_arr = new Array(n).fill(0);
        let t = 1;`,
  "add sgd velocity state"
);

exact(
  `            beta1 = Math.max(0.01, Math.min(0.999, parseFloat(E?.beta1) || 0.9));
            beta2 = Math.max(0.01, Math.min(0.999, parseFloat(E?.beta2) || 0.999));

            // 读取上一步状态
            if (E?.state) {
                const prevState = E.state;
                if (Array.isArray(prevState.m) && prevState.m.length === n) m_arr = [...prevState.m];
                if (Array.isArray(prevState.v) && prevState.v.length === n) v_arr = [...prevState.v];
                t = (prevState.t || 0) + 1;
            }
        } else if (optimizer === "SGD") {
            momentum = Math.max(0, Math.min(1, parseFloat(E?.momentum) || 0));
        }`,
  `            beta1 = Math.max(0.01, Math.min(0.999, parseFloat(config.beta1) || 0.9));
            beta2 = Math.max(0.01, Math.min(0.999, parseFloat(config.beta2) || 0.999));

            // 读取上一步状态
            if (config.state) {
                const prevState = config.state;
                if (Array.isArray(prevState.m) && prevState.m.length === n) m_arr = [...prevState.m];
                if (Array.isArray(prevState.v) && prevState.v.length === n) v_arr = [...prevState.v];
                t = (prevState.t || 0) + 1;
            }
        } else if (optimizer === "SGD") {
            momentum = Math.max(0, Math.min(1, parseFloat(config.momentum) || 0));
            if (config.state && Array.isArray(config.state.velocity) && config.state.velocity.length === n) {
                velocity_arr = [...config.state.velocity];
            }
        }`,
  "use parsed optimizer config"
);

exact(
  `        const new_m = new Array(n);
        const new_v = new Array(n);`,
  `        const new_m = new Array(n);
        const new_v = new Array(n);
        const new_velocity = new Array(n);`,
  "add velocity output"
);

exact(
  `            if (optimizer === "SGD") {
                updatedWeights[i] = flatWeights[i] - lr * grad;
            } else if (optimizer === "ADAM") {`,
  `            if (optimizer === "SGD") {
                velocity_arr[i] = momentum * velocity_arr[i] + grad;
                new_velocity[i] = velocity_arr[i];
                updatedWeights[i] = flatWeights[i] - lr * velocity_arr[i];
            } else if (optimizer === "ADAM") {`,
  "sgd momentum update"
);

exact(
  `        const newState = optimizer === "ADAM"
            ? { m: new_m, v: new_v, t: t }
            : null;`,
  `        const newState = optimizer === "ADAM"
            ? { m: new_m, v: new_v, t: t }
            : (momentum > 0 ? { velocity: new_velocity } : null);`,
  "optimizer state output"
);

// ---------------------------------------------------------------------------
// 6. 修复张量转置索引
// ---------------------------------------------------------------------------
exact(
  `        // 计算转置后的索引
        for (let i = 0; i < totalSize; i++) {
            // 计算原始索引
            let originalIndex = 0;
            let temp = i;
            for (let j = 0; j < dims.length; j++) {
                originalIndex += (temp % newDims[j]) * strides[j];
                temp = Math.floor(temp / newDims[j]);
            }
            
            result[i] = flatTensor[originalIndex];
        }`,
  `        // 计算转置后的索引：按新形状分解坐标，再交换两个维度
        for (let i = 0; i < totalSize; i++) {
            let rest = i;
            const coords = new Array(dims.length);
            for (let j = 0; j < dims.length; j++) {
                coords[j] = Math.floor(rest / newStrides[j]);
                rest %= newStrides[j];
            }
            const tmp = coords[dim1];
            coords[dim1] = coords[dim2];
            coords[dim2] = tmp;

            let originalIndex = 0;
            for (let j = 0; j < dims.length; j++) {
                originalIndex += coords[j] * strides[j];
            }
            result[i] = flatTensor[originalIndex];
        }`,
  "fix tensor transpose"
);

// ---------------------------------------------------------------------------
// 7. 其它数值错误
// ---------------------------------------------------------------------------
exact(
  `        const delta = Math.max(0.1, +C || 1.0);`,
  `        const delta = +C > 0 ? +C : 1.0;`,
  "huber gradient delta"
);

const oneHotParseNew = `    const parseToArray = (input) => {
        let value = input;
        if (typeof value === 'string') {
            try {
                value = JSON.parse(value);
            } catch (e) {
                value = value.trim().split(/[\\s,;]+/).filter(Boolean);
            }
        }
        const toNumber = (n) => {
            const v = Number(n);
            return Number.isFinite(v) ? v : 0;
        };
        if (!Array.isArray(value)) return [[toNumber(value)]];
        if (value.length === 0) return [];
        if (value.every(Array.isArray)) return value.map(row => row.map(toNumber));
        return [value.map(toNumber)];
    };`;

exact(
  `    const parseToArray = (input) => {
        if (typeof input === 'string') {
            try {
                return JSON.parse(input).map(item => {
                    if (Array.isArray(item)) {
                        return item.map(num => +num || 0);
                    }
                    return [+num || 0];
                });
            } catch (e) {
                // 如果解析失败，尝试按空格分割
                return input.trim().split(/\\s+/).map(num => +num || 0);
            }
        }
        return Array.isArray(input) ? input.flat().map(num => +num || 0) : [+input || 0];
    };`,
  oneHotParseNew,
  "multi label one hot parse shape"
);

exact(
  `    const parseToArray = (input) => {
        if (typeof input === 'string') {
            try {
                return JSON.parse(input).map(item => {
                    if (Array.isArray(item)) {
                        return item.map(num => +num || 0);
                    }
                    return [+num || 0];
                });
            } catch (e) {
                return input.trim().split(/\\s+/).map(num => +num || 0);
            }
        }
        return Array.isArray(input) ? input.flat().map(num => +num || 0) : [+input || 0];
    };`,
  oneHotParseNew,
  "one hot decode parse shape"
);

exact(
  `                encoding[index] = oneMinusSmooth;`,
  `                encoding[index] = oneMinusSmooth + smoothValue;`,
  "label smoothing sum"
);

exact(
  `        const cosine = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));`,
  `        const denom = Math.sqrt(normA) * Math.sqrt(normB);
        const cosine = denom === 0 ? 0 : dotProduct / denom;`,
  "cosine zero vector"
);

exact(
  `        const alpha = -1.7580993408473766; // SELU的alpha值
        const scale = 1.0507009873554805;  // SELU的scale值
        
        // Alpha dropout的参数
        const alphaPrime = -alpha * scale;`,
  `        // SELU 的 alpha' = -alpha * scale = -1.7580993408473766
        const alphaPrime = -1.6732632423543776 * 1.0507009873554805;
        const scale = 1.0507009873554805;  // SELU的scale值
        
        // Alpha dropout的参数`,
  "alpha dropout sign"
);

exact(
  `        const [targetRows, targetCols] = targetShape;`,
  `        const [targetRows, targetCols] = targetShape.map(v => Math.max(1, Math.floor(+v || 0)));`,
  "reshape integer dims"
);

// ---------------------------------------------------------------------------
// 8. 多维张量运算使用加速层，支持 batch matmul 广播
// ---------------------------------------------------------------------------
const ndOpNew = `async MATRIX_ND_OP_block({ A, B, C, D, E }) {
  const reshape = (arr, dims) => {
    if (dims.length === 1) return arr.slice(0, dims[0]);
    const size = dims.slice(1).reduce((a, b) => a * b, 1);
    const result = [];
    for (let i = 0; i < dims[0]; i++) {
      result.push(reshape(arr.slice(i * size, (i + 1) * size), dims.slice(1)));
    }
    return result;
  };

  const normalizeDims = (value) => {
    const raw = Accel.toFlatFloat64(value);
    const dims = Array.from(raw, (d) => Math.floor(d));
    if (dims.length === 0 || dims.some((d) => d <= 0)) return null;
    return dims;
  };

  try {
    const operation = String(E || "").toLowerCase();
    const dimsA = normalizeDims(B);
    if (!dimsA) return "[]";

    const flatA = Accel.toFlatFloat64(A);
    const countA = dimsA.reduce((a, b) => a * b, 1);
    if (flatA.length !== countA) return "[]";

    if (operation === "加法" || operation === "add") {
      const dimsB = normalizeDims(D);
      if (!dimsB || dimsA.length !== dimsB.length || dimsA.some((d, i) => d !== dimsB[i])) return "[]";
      const flatB = Accel.toFlatFloat64(C);
      if (flatB.length !== flatA.length) return "[]";
      const out = await Accel.elementwise("add", flatA, flatB);
      return JSON.stringify(reshape(Array.from(out), dimsA));
    }

    if (operation === "乘法" || operation === "mul" || operation === "matmul") {
      const dimsB = normalizeDims(D);
      if (!dimsB || dimsA.length < 2 || dimsB.length < 2) return "[]";
      const flatB = Accel.toFlatFloat64(C);
      const countB = dimsB.reduce((a, b) => a * b, 1);
      if (flatB.length !== countB) return "[]";
      const result = await Accel.batchMatmul(flatA, dimsA, flatB, dimsB);
      return JSON.stringify(reshape(Array.from(result.data), result.shape));
    }

    return "[]";
  } catch (error) {
    return "[]";
  }
}`;
regex(
  /MATRIX_ND_OP_block\(\{ A, B, C, D, E \}\) \{[\s\S]*?\n\}\/\/傻逼张量计算 麻烦死了！！！！/,
  `${ndOpNew}//傻逼张量计算 麻烦死了！！！！`,
  "replace MATRIX_ND_OP_block"
);

// ---------------------------------------------------------------------------
// 9. 加速控制积木实现
// ---------------------------------------------------------------------------
exact(
  `    // 将列表转换为数组字符串
    getListArray(args, util) {`,
  `    ACCEL_STATUS_block() {
      return JSON.stringify(Accel.getStatus());
    }

    ACCEL_SET_THRESHOLD_block({ N }) {
      return String(Accel.setEnhanceThreshold(N));
    }

    ACCEL_SET_BACKEND_block({ B }) {
      return Accel.setForcedBackend(B);
    }

    // 将列表转换为数组字符串
    getListArray(args, util) {`,
  "add accel methods"
);

// ---------------------------------------------------------------------------
// 10. 校验：所有积木 text 中的 [X] 都必须声明参数
// ---------------------------------------------------------------------------
{
  const infoStart = src.indexOf("getInfo() {");
  const infoEnd = src.indexOf("menus: {", infoStart);
  const section = src.slice(infoStart, infoEnd);
  const chunks = section.split(/opcode:\s*"/).slice(1);
  const problems = [];

  for (const chunk of chunks) {
    const opcode = chunk.slice(0, chunk.indexOf('"'));
    const textMatch = chunk.match(/text:\s*"([^"]*)"/);
    if (!textMatch) continue;
    const placeholders = [...textMatch[1].matchAll(/\[([A-Z]+)\]/g)].map((m) => m[1]);
    for (const key of placeholders) {
      if (!new RegExp(`\\b${key}:\\s*\\{`).test(chunk)) {
        problems.push(`${opcode}: missing ${key}`);
      }
    }
  }
  if (problems.length) throw new Error("getInfo argument check failed:\n" + problems.join("\n"));
  applied.push("verify getInfo arguments");
}

await writeFile(outputPath, src);
console.log(`patched legacy extension: ${applied.length} steps`);
console.log(applied.join("\n"));
