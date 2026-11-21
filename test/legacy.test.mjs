import assert from "node:assert/strict";
import { test } from "node:test";
import { pathToFileURL } from "node:url";
import path from "node:path";

let extension = null;

globalThis.Scratch = {
  extensions: {
    unsandboxed: true,
    register(instance) {
      extension = instance;
    },
  },
  Cast: {
    toString: String,
    toNumber: Number,
    toBoolean: Boolean,
  },
  translate: (value) => value,
  vm: {
    runtime: {
      getTargetForStage: () => ({
        lookupVariableByNameAndType: () => null,
      }),
    },
  },
  ArgumentType: {
    STRING: "string",
    NUMBER: "number",
    BOOLEAN: "boolean",
  },
  BlockType: {
    REPORTER: "reporter",
    COMMAND: "command",
    BOOLEAN: "Boolean",
  },
};
globalThis.Blockly = undefined;

const bundlePath = path.resolve("dist/SLZS.optimized.js");
await import(pathToFileURL(bundlePath).href);

test("打包后的扩展可以注册且积木参数完整", () => {
  assert.ok(extension, "extension was not registered");
  const info = extension.getInfo();
  assert.equal(info.id, "SLZS");
  assert.ok(info.blocks.some((b) => b.opcode === "ACCEL_STATUS_block"));

  for (const block of info.blocks) {
    if (typeof block !== "object" || !block.text) continue;
    const keys = Object.keys(block.arguments || {});
    for (const match of block.text.matchAll(/\[([A-Z]+)\]/g)) {
      assert.ok(keys.includes(match[1]), `${block.opcode} missing argument ${match[1]}`);
    }
  }
});

test("矩阵乘法与前向传播恢复正确", async () => {
  assert.equal(
    await extension.awbw_block({ A: "[1,2,3]", B: "[1,4,7,2,5,8,3,6,9]" }),
    "[14,32,50]"
  );
  const forward = JSON.parse(await extension.awbws_block({
    A: "[0.5,0.8]", B: "[0.1,0.2,0.3,0.4]", C: 2,
  }));
  assert.ok(Math.abs(forward[0] - 0.29) < 1e-12);
  assert.ok(Math.abs(forward[1] - 0.42) < 1e-12);
});

test("张量转置与独热编码计算错误已修复", () => {
  assert.equal(
    extension.TENSOR_TRANSPOSE_block({ A: "[[1,2,3],[4,5,6]]", B: 0, C: 1 }),
    "[[1,4],[2,5],[3,6]]"
  );
  assert.equal(extension.ONE_HOT_DECODE_block({ A: "[0,0,1,0]", B: 0 }), "[2]");
  const smoothed = JSON.parse(extension.ONE_HOT_SMOOTH_block({ A: "[0]", B: 3, C: 0.3 }))[0];
  assert.ok(Math.abs(smoothed[0] - 0.8) < 1e-12);
  assert.ok(Math.abs(smoothed[1] - 0.1) < 1e-12);
  assert.ok(Math.abs(smoothed.reduce((a, b) => a + b, 0) - 1) < 1e-12);
  assert.equal(extension.COSINE_SIMILARITY_block({ A: "[0,0]", B: "[1,2]" }), "0");
});

test("Adam 状态可以从 JSON 配置中恢复", () => {
  const first = JSON.parse(extension.UPDATE_WEIGHTS_block({
    A: "[0,0]",
    B: "[1,1]",
    C: "Adam",
    D: 0.1,
    E: '{"beta1":0.9,"beta2":0.999}',
  }));
  const second = JSON.parse(extension.UPDATE_WEIGHTS_block({
    A: JSON.stringify(first.weights),
    B: "[1,1]",
    C: "Adam",
    D: 0.1,
    E: JSON.stringify({ beta1: 0.9, beta2: 0.999, state: first.state }),
  }));

  assert.equal(first.state.t, 1);
  assert.equal(second.state.t, 2);
  assert.notDeepEqual(second.weights, first.weights);
});

test("多维张量乘法支持 batch 广播", async () => {
  const result = JSON.parse(await extension.MATRIX_ND_OP_block({
    A: "[1,2,3,4,5,6,7,8,9,10,11,12]",
    B: "[2,2,3]",
    C: "[1,0,0,1,1,1]",
    D: "[3,2]",
    E: "乘法",
  }));
  assert.deepEqual(result, [
    [[4, 5], [10, 11]],
    [[16, 17], [22, 23]],
  ]);
});
