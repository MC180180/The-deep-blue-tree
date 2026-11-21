// 先初始化加速后端，再加载原扩展（原扩展会通过 globalThis.DeepBlueAccel 调用）
import "./accel/index.js";
import "./legacy/SLZS.js";
