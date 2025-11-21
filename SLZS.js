// 扩展名称: 深蓝之树 (人工智能)
// 扩展ID: E_SLZS
// 描述: 提供大量运算符积木块，从指数运算到三角函数
// 作者: ELLRA - 蓝电 - MC180180 - BEJ180180  |  LoveAuska
// 许可证: MIT



//npm install @tensorflow/tfjs @tensorflow/tfjs-node-gpu

  if (!Scratch.extensions.unsandboxed) {
    throw new Error('Extension Name must run unsandboxed');
  }

((Scratch) => {
  "use strict"; // 启用严格模式

  // Base64编码的SVG图标数据
  const icon = "";

  const cast = Scratch.Cast; // Scratch类型转换工具
  const vm = Scratch.vm;
  const runtime = vm.runtime;// 获取运行时环境

   
  // 根据名称获取变量对象
  const getVarObjectFromName = function (name, util, type) {
    const stageTarget = runtime.getTargetForStage();
    const target = util.target;
    let listObject = Object.create(null);

    // 首先在舞台中查找
    listObject = stageTarget.lookupVariableByNameAndType(name, type);
    if (listObject) return listObject;
    // 如果没找到，在当前角色中查找
    listObject = target.lookupVariableByNameAndType(name, type);
    if (listObject) return listObject;
  };




  
  /**
   * 检查值是否实际不为零
   * 用于处理 Scratch 的特殊零值情况
   * @param {*} val - 要检查的值
   * @returns {boolean} - 如果值实际不为零则返回true
   */
  const isNotActuallyZero = (val) => {
    if (typeof val !== "string") return false;
    for (let i = 0; i < val.length; i++) {
      const code = val.charCodeAt(i);
      // '0'.charCodeAt(0) === 48 - 字符'0'的ASCII码
      // '\t'.charCodeAt(0) === 9 - 制表符的ASCII码
      // 包含制表符是为了兼容 scratch-www 有问题的 trim() polyfill
      // 参考: https://github.com/TurboWarp/scratch-vm/issues/115
      // 示例项目: https://scratch.mit.edu/projects/788261699/
      if (code === 48 || code === 9) {
        return false;
      }
    }
    return true;
  };

  /**
   * 精确比较两个值
   * 处理特殊情况如无穷大和NaN
   * @param {*} v1 - 第一个值
   * @param {*} v2 - 第二个值
   * @returns {number} - 比较结果：-1(小于), 0(等于), 1(大于)
   */
  const exactlyCompare = (v1, v2) => {
    let n1 = Number(v1);
    let n2 = Number(v2);
    
    // 处理特殊的零值情况
    if (n1 === 0 && isNotActuallyZero(v1)) {
      n1 = NaN;
    } else if (n2 === 0 && isNotActuallyZero(v2)) {
      n2 = NaN;
    }
    
    if (isNaN(n1) || isNaN(n2)) {
      // 至少有一个参数无法转换为数字
      // Scratch 将字符串比较视为不区分大小写，但这里不应该这样
      const s1 = String(v1);
      const s2 = String(v2);
      if (s1 < s2) {
        return -1;
      } else if (s1 > s2) {
        return 1;
      }
      return 0;
    }
    
    // 处理无穷大的特殊情况
    if (
      (n1 === Infinity && n2 === Infinity) ||
      (n1 === -Infinity && n2 === -Infinity)
    ) {
      return 0;
    }
    
    // 作为数字进行比较
    return n1 - n2;
  };

  /**
   * 转换为数字，保留NaN
   * 与Scratch的标准转换不同，这里不将NaN转换为0
   * @param {*} value - 要转换的值
   * @returns {number} - 转换后的数字
   */
  const toNaNNumber = (value) => {
    // 如果值已经是数字，我们不需要用Number()强制转换
    if (typeof value === "number") {
      // Scratch 在需要数字时将 NaN 视为 0，但这里不应该这样
      // 例如: 0 + NaN -> 0
      return value;
    }
    const n = Number(value);
    // Scratch 在需要数字时将 NaN 视为 0，但这里不应该这样
    // 例如: 0 + NaN -> 0
    return n;
  };

  /**
   * 检查值是否为真整数
   * @param {*} val - 要检查的值
   * @returns {boolean} - 如果是整数则返回true
   */
  const isTrueInt = (val) => {
    // 已经是数字的值
    if (typeof val === "number") {
      if (isNaN(val)) {
        // NaN 被视为整数
        return true;
      }
      // 如果是"整数"则为真 (例如: 2.0 和 2)
      return val === Math.floor(val);
    } else if (typeof val === "boolean") {
      // `True` 和 `false` 在 Scratch 转换后总是表示整数
      return true;
    } else if (typeof val === "string") {
      // 如果包含小数点，不认为是整数，但这里不应该这样
      const n = Number(val);
      if (isNaN(n)) {
        // NaN 被视为整数
        return true;
      }
      // 如果是"整数"则为真 (例如: 2.0 和 2)
      return n === Math.floor(n);
    }
    return false;
  };
  


  /**
   * Scratch 数学扩展类
   * 提供各种数学运算和比较功能的积木块
   */
  class ScratchSlzs {
    /**
     * 获取扩展信息
     * @returns {Object} 扩展配置对象
     */
    getInfo() {
      return {
        id: "SLZS", // 扩展唯一标识符
        name: Scratch.translate("深蓝之树"), // 扩展显示名称

        docsURI: 'https:mc180180.github.io', // 扩展文档链接

        color1: "#427bd1", // 扩展主色调
        

        menuIconURI: icon, // 扩展图标

        blocks: [
          // === 基础数学运算 ===
// 命令块：将数组ARRAY设置为列表LIST的内容
          {
            opcode: "getListArray",
            blockType: Scratch.BlockType.REPORTER,
            color1: "#1f1f1f", // 扩展主色调
            text: "[LIST]转为数组",
            disableMonitor: true,
            arguments: {
              LIST: {
                type: Scratch.ArgumentType.STRING,
                menu: "lists",
              },
            },
          },
          {
            opcode: "setListArray",
            blockType: Scratch.BlockType.COMMAND,
            color1: "#1f1f1f", // 扩展主色调
            text: "将[LIST]设为数组[ARRAY]",
            disableMonitor: true,
            arguments: {
              LIST: {
                type: Scratch.ArgumentType.STRING,
                menu: "lists",
              },
              ARRAY: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: '["apple","banana"]',
              },
            },
          },

'---',
            {
            opcode: "awbw_block", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "1w*2w矩阵计算[A]x[B]", // 积木显示文本
          },
            {
            opcode: "awbws_block", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "1w*2w矩阵计算[A]x[B] [C]", // 积木显示文本
            arguments: {
              C: { type: Scratch.ArgumentType.NUMBER, defaultValue: "输出向量长度" }, //  定义C参数，类型为数字，默认值为空
            },
          },
          '---',
          {
            opcode: "MATRIX_RESHAPE_block", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "矩阵变换[A] [B]", // 积木显示文本
            arguments: {
              B: { type: Scratch.ArgumentType.STRING, defaultValue: "目标形状 [行,列]" }, //  定义A参数，类型为数字，默认值为空
            },
          },
          '---',
          {
            opcode: "MATRIX_ND_CREATE_block", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "多维张量生成器[A][B]", // 积木显示文本
            color3: "#f2590d",
            arguments: {
              A: { type: Scratch.ArgumentType.STRING, defaultValue: "维度信息数组 [行,列,...]" }, //  定义C参数，类型为数字，默认值为空
              B: { type: Scratch.ArgumentType.STRING, defaultValue: "填充值 (可选)" }, //  定义C参数，类型为数字，默认值为空
            },
          },
          {
            opcode: "MATRIX_ND_OP_block", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "多维张量运算器[A][B][C][D][E]", // 积木显示文本
            color2: "#f2aaaa",
            color3: "#f2590d",
            arguments: {
              A: { type: Scratch.ArgumentType.STRING, defaultValue: "第一个矩阵" }, //  定义C参数，类型为数字，默认值为空
              B: { type: Scratch.ArgumentType.STRING, defaultValue: "第一个矩阵的维度信息" }, //  定义C参数，类型为数字，默认值为空
              C: { type: Scratch.ArgumentType.STRING, defaultValue: "第二个矩阵" }, //  定义C参数，类型为数字，默认值为空
              D: { type: Scratch.ArgumentType.STRING, defaultValue: "第二个矩阵的维度信息" }, //  定义C参数，类型为数字，默认值为空
              E: {
                type: Scratch.ArgumentType.STRING,
                menu: "operation",
              },

            },
          },
          {
            opcode: "TENSOR_TRANSPOSE_block", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "张量部分转置器[A][B][C]", // 积木显示文本
            color2: "#f2aaaa",
            color3: "#f2590d",
            arguments: {
              A: { type: Scratch.ArgumentType.STRING, defaultValue: "输入张量" }, //  定义C参数，类型为数字，默认值为空
              B: { type: Scratch.ArgumentType.STRING, defaultValue: "维度索引1" }, //  定义C参数，类型为数字，默认值为空
              C: { type: Scratch.ArgumentType.STRING, defaultValue: "维度索引1" }, //  定义C参数，类型为数字，默认值为空

            },
          },
          {
            opcode: "ARRAY_MERGE_SPLIT_block", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "多维张量[A] [B][C] [D]", // 积木显示文本
            color2: "#f2aaaa",
            color3: "#f2590d",
            arguments: {
              B: { type: Scratch.ArgumentType.STRING, defaultValue: "数组1" }, //  定义C参数，类型为数字，默认值为空
              C: { type: Scratch.ArgumentType.STRING, defaultValue: "数组2" }, //  定义C参数，类型为数字，默认值为空
              D: { type: Scratch.ArgumentType.NUMBER, defaultValue: "拆分维度中第几个(可选)" }, //  定义C参数，类型为数字，默认值为空
              A: {
                type: Scratch.ArgumentType.STRING,
                menu: "mode",
              },
            },
          },
          {
            opcode: "ARRAY_SHELL_block", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "[B][A][C]层", // 积木显示文本
            color2: "#f2aaaa",
            color3: "#f2590d",
            arguments: {
              B: { type: Scratch.ArgumentType.STRING, defaultValue: "数组" }, //  定义C参数，类型为数字，默认值为空
              C: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1" }, //  定义C参数，类型为数字，默认值为空
              A: {
                type: Scratch.ArgumentType.STRING,
                menu: "modee",
              },
            },
          },
          '---',
          {
            opcode: "RandomVariation_block", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "随机变异[A] 变异强度[B] 变异概率[C]", // 积木显示文本
            arguments: {
              B: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1.6" }, //  定义C参数，类型为数字，默认值为空A参数，类型为数字，默认值为空
              C: { type: Scratch.ArgumentType.NUMBER, defaultValue: "0.2" }, //  定义A参数，类型为数字，默认值为空
            },
          },
          '---',
           {
            opcode: "UPDATE_WEIGHTS_block",
            blockType: Scratch.BlockType.REPORTER,
            text: "用[C]优化器更新权重[A] 梯度[B] 学习率[D] 配置[E]",
            color1: "#225bb1",
            arguments: {
                A: { 
                    type: Scratch.ArgumentType.STRING, 
                    defaultValue: "[1,2,3]" 
                },
                B: { 
                    type: Scratch.ArgumentType.STRING, 
                    defaultValue: "[0.1,0.2,0.3]" 
                },
                C: {
                    type: Scratch.ArgumentType.STRING,
                    menu: "optimizer_type"  // ← 保留菜单：SGD / Adam
                },
                D: { 
                    type: Scratch.ArgumentType.NUMBER, 
                    defaultValue: 0.01 
                },
                E: {
                    type: Scratch.ArgumentType.STRING,
                    defaultValue: '{"beta1": 0.9, "beta2": 0.999}'  // ← 关键：去掉 menu，加默认 JSON
                    },
                },
            },
            {
            opcode: "UPDATE_BIAS_block",
            blockType: Scratch.BlockType.REPORTER,
            text: "更新偏置[A] 梯度[B] 学习率[C]",
            color1: "#225bb1", 
            arguments: {
                A: { type: Scratch.ArgumentType.STRING, defaultValue: "[0,0,0]" },
                B: { type: Scratch.ArgumentType.STRING, defaultValue: "[0.1,0.2,0.3]" },
                C: { type: Scratch.ArgumentType.NUMBER, defaultValue: "0.01" }
            }
           },
            '---',
          {
            opcode: "WEIGHT_QUANTIZE_block", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "权重量化[A] [B]bit", // 积木显示文本
            color1: "#225bb1",
            arguments: {
              A: { type: Scratch.ArgumentType.STRING, defaultValue: "权重数组" }, //  定义C参数，类型为数字，默认值为空A参数，类型为数字，默认值为空
              B: { type: Scratch.ArgumentType.NUMBER, defaultValue: "8" }, //  定义A参数，类型为数字，默认值为空
            },
          },
          {
            opcode: "FLOAT_PRECISION_block", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "限制浮点位数[A] [B]位数", // 积木显示文本
            color1: "#225bb1",
            arguments: {
              A: { type: Scratch.ArgumentType.STRING, defaultValue: "权重数组" }, //  定义C参数，类型为数字，默认值为空A参数，类型为数字，默认值为空
              B: { type: Scratch.ArgumentType.NUMBER, defaultValue: "4" }, //  定义A参数，类型为数字，默认值为空
            },
          },
          '---',
          {
            opcode: "WEIGHT_PRUNING_block", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "基于权重[A]的剪枝算法[B]", // 积木显示文本
            color1: "#225bb1",
            arguments: {
              A: { type: Scratch.ArgumentType.STRING, defaultValue: "权重数组" }, //  定义C参数，类型为数字，默认值为空A参数，类型为数字，默认值为空
              B: { type: Scratch.ArgumentType.NUMBER, defaultValue: "剪枝阈值 (0-1之间)" }, //  定义A参数，类型为数字，默认值为空
            },
          },
          {
            opcode: "ACTIVATION_PRUNING_block", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "基于激活[A]的剪枝[C]算法[B]", // 积木显示文本
            color1: "#225bb1",
            arguments: {
              A: { type: Scratch.ArgumentType.STRING, defaultValue: "激活值数组" }, //  定义C参数，类型为数字，默认值为空A参数，类型为数字，默认值为空
              B: { type: Scratch.ArgumentType.NUMBER, defaultValue: "剪枝阈值 (0-1之间)" }, //  定义A参数，类型为数字，默认值为空
              C: { type: Scratch.ArgumentType.NUMBER, defaultValue: "剪枝模式 (0=输出剪枝, 1=输入剪枝)" }, //  定义A参数，类型为数字，默认值为空
            },
          },
          {
            opcode: "STRUCTURED_PRUNING_block", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "结构化[A][B]的剪枝算法[C][D]", // 积木显示文本
            color1: "#225bb1",
            arguments: {
              A: { type: Scratch.ArgumentType.STRING, defaultValue: "权重数组" }, //  定义C参数，类型为数字，默认值为空A参数，类型为数字，默认值为空
              B: { type: Scratch.ArgumentType.NUMBER, defaultValue: "激活值数组" }, //  定义A参数，类型为数字，默认值为空
              C: { type: Scratch.ArgumentType.STRING, defaultValue: "权重剪枝阈值 (0-1之间)" }, //  定义C参数，类型为数字，默认值为空A参数，类型为数字，默认值为空
              D: { type: Scratch.ArgumentType.NUMBER, defaultValue: "激活剪枝阈值 (0-1之间)" }, //  定义A参数，类型为数字，默认值为空
            },
          },
          '---',
          {
            opcode: "MSE_GRADIENT_block", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "MSE损失梯度[A][B]", // 积木显示文本
            color1: "#727be1", // 扩展主色调
            arguments: {
              A: { type: Scratch.ArgumentType.STRING, defaultValue: "预测值数组" }, //  定义C参数，类型为数字，默认值为空A参数，类型为数字，默认值为空
              B: { type: Scratch.ArgumentType.STRING, defaultValue: "真实值数组" }, //  定义A参数，类型为数字，默认值为空
            },
          },
          {
            opcode: "CROSS_ENTROPY_GRADIENT_block", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "交叉熵损失梯度[A][B]", // 积木显示文本
            color1: "#727be1", // 扩展主色调
            arguments: {
              A: { type: Scratch.ArgumentType.STRING, defaultValue: "预测值数组" }, //  定义C参数，类型为数字，默认值为空A参数，类型为数字，默认值为空
              B: { type: Scratch.ArgumentType.STRING, defaultValue: "真实值数组" }, //  定义A参数，类型为数字，默认值为空
            },
          },
          {
            opcode: "HUBER_GRADIENT_block", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "Huber损失梯度[A][B] delta参数[C]", // 积木显示文本
            color1: "#727be1", // 扩展主色调
            arguments: {
              A: { type: Scratch.ArgumentType.STRING, defaultValue: "预测值数组" }, //  定义C参数，类型为数字，默认值为空A参数，类型为数字，默认值为空
              B: { type: Scratch.ArgumentType.STRING, defaultValue: "真实值数组" }, //  定义A参数，类型为数字，默认值为空
              C: { type: Scratch.ArgumentType.NUMBER, defaultValue: "1.0" }, //  定义A参数，类型为数字，默认值为空
            },
          },
          '---',
          {
            opcode: "ONE_HOT_block", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "基本独热编码[A][B]", // 积木显示文本
            color1: "#3bc1ff", // 扩展主色调
            arguments: {
              A: { type: Scratch.ArgumentType.STRING, defaultValue: "输入数组（类别索引）" }, //  定义C参数，类型为数字，默认值为空
              B: { type: Scratch.ArgumentType.NUMBER, defaultValue: "类别总数" }, //  定义C参数，类型为数字，默认值为空
            },
          },
          {
            opcode: "ONE_HOT_BATCH_block", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "批量独热编码[A][B]", // 积木显示文本
            color1: "#3bc1ff", // 扩展主色调
            arguments: {
              A: { type: Scratch.ArgumentType.STRING, defaultValue: "输入数组（类别索引）" }, //  定义C参数，类型为数字，默认值为空
              B: { type: Scratch.ArgumentType.NUMBER, defaultValue: "类别总数" }, //  定义C参数，类型为数字，默认值为空
            },
          },
          {
            opcode: "ONE_HOT_SMOOTH_block", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "带平滑的独热编码[A][B][C]", // 积木显示文本
            color1: "#3bc1ff", // 扩展主色调
            arguments: {
              A: { type: Scratch.ArgumentType.STRING, defaultValue: "输入数组（类别索引）" }, //  定义C参数，类型为数字，默认值为空
              B: { type: Scratch.ArgumentType.NUMBER, defaultValue: "类别总数" }, //  定义C参数，类型为数字，默认值为空
              C: { type: Scratch.ArgumentType.NUMBER, defaultValue: "平滑因子 (0-1之间)" }, //  定义C参数，类型为数字，默认值为空
            },
          },
          {
            opcode: "MULTI_LABEL_ONE_HOT_block", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "多标签独热编码[A][B]", // 积木显示文本
            color1: "#3bc1ff", // 扩展主色调
            arguments: {
              A: { type: Scratch.ArgumentType.STRING, defaultValue: "输入数组（类别索引）" }, //  定义C参数，类型为数字，默认值为空
              B: { type: Scratch.ArgumentType.NUMBER, defaultValue: "类别总数" }, //  定义C参数，类型为数字，默认值为空
            },
          },
          {
            opcode: "ONE_HOT_DECODE_block", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "独热解码[A][B]", // 积木显示文本
            color1: "#3bc1ff", // 扩展主色调
            arguments: {
              A: { type: Scratch.ArgumentType.STRING, defaultValue: "独热编码数组" }, //  定义C参数，类型为数字，默认值为空
              B: { type: Scratch.ArgumentType.NUMBER, defaultValue: "返回模式 (0=索引, 1=概率)" }, //  定义C参数，类型为数字，默认值为空
            },
          },
          '---',
          {
            opcode: "RELU_block", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "ReLU激活[A]", // 积木显示文本
            color1: "#82abff", // 扩展主色调
          },
          {
            opcode: "ELU_block", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "ELU激活[A]", // 积木显示文本
            color1: "#82abff", // 扩展主色调
          },
          {
            opcode: "SWISH_block", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "Swish激活[A]", // 积木显示文本
            color1: "#82abff", // 扩展主色调
          },
          {
            opcode: "SIGMOID_block", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "Sigmoid激活[A]", // 积木显示文本
            color1: "#82abff", // 扩展主色调
          },
          '---',
          {
            opcode: "MSE_LOSS_block", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "均方误差损失MSE  预[A]真[B]", // 积木显示文本
            color1: "#ffa3ff", // 扩展主色调
          },
          {
            opcode: "BINARY_CROSS_ENTROPY_LOSS_block", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "二元交叉熵损失BCE  预[A]真[B]", // 积木显示文本
            color1: "#ffa3ff", // 扩展主色调
          },
          {
            opcode: "HUBER_LOSS_block", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "Huber损失  预[A]真[B]", // 积木显示文本
            color1: "#ffa3ff", // 扩展主色调
          },
          '---',
          {
            opcode: "DROPOUT_TRAIN_block", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "训练时的Dropout层[A] 概率[B]", // 积木显示文本
            color1: "#42abff", // 扩展主色调
            arguments: {
              B: { type: Scratch.ArgumentType.NUMBER, defaultValue: "0.1" }, //  定义A参数，类型为数字，默认值为空
            },
          },
          {
            opcode: "DROPOUT_EVAL_block", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "推理时的Dropout层[A]", // 积木显示文本
            color1: "#42abff", // 扩展主色调
          },
          {
            opcode: "DROPOUT_WITH_MASK_block", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "带掩码输出的Dropout层[A] 概率[B]", // 积木显示文本
            color1: "#42abff", // 扩展主色调
            arguments: {
              B: { type: Scratch.ArgumentType.NUMBER, defaultValue: "0.1" }, //  定义A参数，类型为数字，默认值为空
            },
          },
          {
            opcode: "ALPHA_DROPOUT_block", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "Alpha Dropout[A] 概率[B]", // 积木显示文本
            color1: "#42abff", // 扩展主色调
            arguments: {
              B: { type: Scratch.ArgumentType.NUMBER, defaultValue: "0.1" }, //  定义A参数，类型为数字，默认值为空
            },
          },
          '---',
            {
            opcode: "DOT_PRODUCT_block", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "向量点积[A][B]", // 积木显示文本
            color1: "#61e051", // 扩展主色调
            arguments: {
              A: { type: Scratch.ArgumentType.STRING, defaultValue: "向量1" }, //  定义A参数，类型为数字，默认值为空
              B: { type: Scratch.ArgumentType.STRING, defaultValue: "向量2" }, //  定义A参数，类型为数字，默认值为空
            },
          },
          {
            opcode: "CROSS_PRODUCT_block", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "向量叉积[A][B]", // 积木显示文本
            color1: "#61e051", // 扩展主色调
            arguments: {
              A: { type: Scratch.ArgumentType.STRING, defaultValue: "3维向量1" }, //  定义A参数，类型为数字，默认值为空
              B: { type: Scratch.ArgumentType.STRING, defaultValue: "3维向量2" }, //  定义A参数，类型为数字，默认值为空
            },
          },
          {
            opcode: "EUCLIDEAN_DISTANCE_block", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "向量欧氏距离[A][B]", // 积木显示文本
            color1: "#61e051", // 扩展主色调
            arguments: {
              A: { type: Scratch.ArgumentType.STRING, defaultValue: "向量1" }, //  定义A参数，类型为数字，默认值为空
              B: { type: Scratch.ArgumentType.STRING, defaultValue: "向量2" }, //  定义A参数，类型为数字，默认值为空
            },
          },
          {
            opcode: "MANHATTAN_DISTANCE_block", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "向量曼哈顿距离[A][B]", // 积木显示文本
            color1: "#61e051", // 扩展主色调
            arguments: {
              A: { type: Scratch.ArgumentType.STRING, defaultValue: "向量1" }, //  定义A参数，类型为数字，默认值为空
              B: { type: Scratch.ArgumentType.STRING, defaultValue: "向量2" }, //  定义A参数，类型为数字，默认值为空
            },
          },
          {
            opcode: "COSINE_SIMILARITY_block", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "向量余弦相似度[A][B]", // 积木显示文本
            color1: "#61e051", // 扩展主色调
            arguments: {
              A: { type: Scratch.ArgumentType.STRING, defaultValue: "向量1" }, //  定义A参数，类型为数字，默认值为空
              B: { type: Scratch.ArgumentType.STRING, defaultValue: "向量2" }, //  定义A参数，类型为数字，默认值为空
            },
          },
          '---',
          {
            opcode: "NORMALIZE_VECTOR_block", // EEEEEEEEEEEE运算积木
            blockType: Scratch.BlockType.REPORTER, // 返回值类型积木
            text: "向量标准化[A][B]", // 积木显示文本
            color1: "#91e051", // 扩展主色调
            arguments: {
              A: { type: Scratch.ArgumentType.STRING, defaultValue: "向量" }, //  定义A参数，类型为数字，默认值为空
              B: { type: Scratch.ArgumentType.NUMBER, defaultValue: "范数类型 (0=L2范数, 1=L1范数, 2=无穷范数)" }, //  定义A参数，类型为数字，默认值为空
            },
          },
          '---',
          {
            opcode: "CHARACTER_TOKENIZER_block",
            blockType: Scratch.BlockType.REPORTER,
            text: "逐字符分词[A]",
            color1: "#d4a470", // 和其他分词器保持一致颜色
            arguments: {
                A: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "输入文本"
                }
            }
           },
           '---',
           
          {
            opcode: "ARRAY_TO_DICT_block",
            blockType: Scratch.BlockType.REPORTER,
            text: "数组[A][B]合并成字典",
            color1: "#ce9178", // 和其他分词器保持一致颜色
            arguments: {
                A: { type: Scratch.ArgumentType.STRING, defaultValue: "键" }, //  定义A参数，类型为数字，默认值为空
                B: { type: Scratch.ArgumentType.STRING, defaultValue: "值" }, //  定义A参数，类型为数字，默认值为空
            }
           },
           {
            opcode: "DICT_TO_ARRAY_block",
            blockType: Scratch.BlockType.REPORTER,
            text: "字典[A]转数组(矩阵)",
            color1: "#ce9178", // 和其他分词器保持一致颜色
            arguments: {
                A: { type: Scratch.ArgumentType.STRING, defaultValue: "输入字典" }, //  定义A参数，类型为数字，默认值为空
            }
           },
           {
            opcode: "DICT_LOOKUP_block",
            blockType: Scratch.BlockType.REPORTER,
            text: "在字典[A]中[C]查找[B]",
            color1: "#ce9178", // 和其他分词器保持一致颜色
            arguments: {
                A: { type: Scratch.ArgumentType.STRING, defaultValue: "输入字典" }, //  定义A参数，类型为数字，默认值为空
                B: { type: Scratch.ArgumentType.STRING, defaultValue: "查找键值" }, //  定义A参数，类型为数字，默认值为空
                C: {
                type: Scratch.ArgumentType.STRING,
                menu: "lookup_mode",
              },
            }
           },
           '---',
           {
            opcode: "FIND_REPLACE_block",
            blockType: Scratch.BlockType.REPORTER,
            text: "[D]查找[A]中的[B]替换为[C]",
            color1: "#ff4c4c", // 和其他分词器保持一致颜色
            arguments: {
                A: { type: Scratch.ArgumentType.STRING, defaultValue: "输入" }, //  定义A参数，类型为数字，默认值为空
                B: { type: Scratch.ArgumentType.STRING, defaultValue: "" }, //  定义A参数，类型为数字，默认值为空
                C: { type: Scratch.ArgumentType.STRING, defaultValue: "" }, //  定义A参数，类型为数字，默认值为空
                D: {
                type: Scratch.ArgumentType.STRING,
                menu: "match_moder",
              },
            }
           },

          







        ],
        
        menus: {
          lists: {
            acceptReporters: true,
            items: "_getLists",
          },
          operation: {
            acceptReporters: true,
            items: ["加法", "乘法"],
          },
          lookup_mode: {
            acceptReporters: false,
            items: ["键找值", "值找键"],
          },
          optimizer_type: {
          acceptReporters: false,
          items: ["SGD", "Adam"]
          },
          adam_params: {
              acceptReporters: true,
              items: ["无", "β₁=0.9, β₂=0.999"]
          },
          mode: {
          acceptReporters: true,
          items: ["合并", "拆分"],
          },
          modee: {
          acceptReporters: true,
          items: ["加壳", "拆壳"],
          },
          match_moder: {
          acceptReporters: false,
          items: ["全局", "单个"],
          },
        },
      };
    }











    // === 积木块实现方法 ===  E_block

/**
 * 矩阵乘法运算: 1维矩阵与2维矩阵相乘
 * @param {Object} param - 参数对象
 * @param {*} param.A - 1维矩阵 (1×n) 格式: [1,2,3]
 * @param {*} param.B - 2维矩阵 (n×m) 格式: [1,2,3,4,5,6]
 * @returns {string} 运算结果 (JSON数组格式字符串)
 */
awbw_block({ A, B }) {
    // 辅助函数：将输入转换为数组
    const parseToArray = (input) => {
        if (typeof input === 'string') {
            try {
                // 尝试解析JSON数组格式
                const parsed = JSON.parse(input);
                if (Array.isArray(parsed)) {
                    return parsed.map(num => parseFloat(num) || 0);
                }
            } catch (e) {
                // 如果JSON解析失败，尝试按空格分隔解析
                return input.trim().split(/\s+/).map(num => parseFloat(num) || 0);
            }
        }
        if (Array.isArray(input)) {
            return input.flat().map(num => parseFloat(num) || 0);
        }
        // 如果是单个数字，转换为数组
        const num = parseFloat(input);
        return isNaN(num) ? [] : [num];
    };

    try {
        // 解析1维矩阵 (向量)
        const vector = parseToArray(A);
        const matrix2DFlat = parseToArray(B);
        
        // 基本验证
        if (vector.length === 0) {
            return "[]";
        }
        
        const n = vector.length; // 1维矩阵的长度
        
        // 计算2维矩阵的列数
        if (matrix2DFlat.length % n !== 0) {
            // 如果不能整除，返回空数组
            return "[]";
        }
        
        const m = matrix2DFlat.length / n; // 2维矩阵的列数
        
        // 将扁平的2维矩阵重构为2维数组 (n×m)
        const matrix2D = [];
        for (let i = 0; i < n; i++) {
            matrix2D[i] = [];
            for (let j = 0; j < m; j++) {
                const index = i * m + j;
                matrix2D[i][j] = matrix2DFlat[index];
            }
        }
        
        // 执行矩阵乘法: vector (1×n) × matrix2D (n×m) = result (1×m)
        const result = [];
        for (let j = 0; j < m; j++) {
            let sum = 0;
            for (let i = 0; i < n; i++) {
                sum += vector[i] * matrix2D[i][j];
            }
            result[j] = sum;
        }
        
        // 将结果数组转换为JSON格式字符串
        return JSON.stringify(result);
        
    } catch (error) {
        // 出错时返回空数组，保持积木块的稳定性
        return "[]";
    }
}
/**
 * 神经网络前向传播计算: 输入层×权重矩阵=输出层
 * @param {Object} param - 参数对象
 * @param {*} param.A - 输入层向量 (1×n) 格式: [1,2,3]
 * @param {*} param.B - 权重矩阵 (n×m) 格式: [w11,w12,...,w1m,w21,w22,...,wnm]
 * @param {*} param.C - 输出层神经元数量 (m)
 * @returns {string} 运算结果 (JSON数组格式字符串)
 */
awbws_block({ A, B, C }) {
    // 辅助函数：将输入转换为数组
    const parseToArray = (input) => {
        if (typeof input === 'string') {
            try {
                // 尝试解析JSON数组格式
                const parsed = JSON.parse(input);
                if (Array.isArray(parsed)) {
                    return parsed.map(num => parseFloat(num) || 0);
                }
            } catch (e) {
                // 如果JSON解析失败，尝试按空格分隔解析
                return input.trim().split(/\s+/).map(num => parseFloat(num) || 0);
            }
        }
        if (Array.isArray(input)) {
            return input.flat().map(num => parseFloat(num) || 0);
        }
        // 如果是单个数字，转换为数组
        const num = parseFloat(input);
        return isNaN(num) ? [] : [num];
    };

    // 辅助函数：将输入转换为数字
    const parseToNumber = (input) => {
        const num = parseFloat(input);
        return isNaN(num) ? 0 : Math.floor(Math.abs(num)); // 确保是正整数
    };

    try {
        // 解析输入参数
        const inputVector = parseToArray(A);        // 输入层向量 (1×n)
        const weightMatrix = parseToArray(B);       // 权重矩阵扁平化 (n×m)
        const outputSize = parseToNumber(C);        // 输出层大小 m
        
        // 基本验证
        if (inputVector.length === 0 || outputSize === 0) {
            return "[]";
        }
        
        const inputSize = inputVector.length;       // 输入层大小 n
        const expectedWeightCount = inputSize * outputSize;  // 期望的权重数量
        
        // 验证权重矩阵大小
        if (weightMatrix.length !== expectedWeightCount) {
            // 如果权重数量不匹配，返回空数组或用0补齐/截断
            while (weightMatrix.length < expectedWeightCount) {
                weightMatrix.push(0);
            }
            if (weightMatrix.length > expectedWeightCount) {
                weightMatrix.splice(expectedWeightCount);
            }
        }
        
        // 将扁平的权重矩阵重构为2维数组 (n×m)
        // weightMatrix[i][j] 表示从输入神经元i到输出神经元j的权重
        const weights2D = [];
        for (let i = 0; i < inputSize; i++) {
            weights2D[i] = [];
            for (let j = 0; j < outputSize; j++) {
                const index = i * outputSize + j;
                weights2D[i][j] = weightMatrix[index];
            }
        }
        
        // 执行神经网络前向传播: input (1×n) × weights (n×m) = output (1×m)
        const outputVector = [];
        for (let j = 0; j < outputSize; j++) {
            let sum = 0;
            for (let i = 0; i < inputSize; i++) {
                sum += inputVector[i] * weights2D[i][j];
            }
            outputVector[j] = sum;
        }
        
        // 将结果转换为JSON格式字符串
        return JSON.stringify(outputVector);
        
    } catch (error) {
        // 出错时返回空数组，保持积木块的稳定性
        return "[]";
    }
}
/**
 * 随机变异极速版本 - 支持多维数组
 */
RandomVariation_block({ A, B, C }) {
    const parse = (input) => {
        if (typeof input === 'string') {
            try {
                return JSON.parse(input);
            } catch (e) {
                return input.trim().split(/\s+/).map(num => +num || 0);
            }
        }
        return input;
    };

    // 递归随机变异函数
    const randomVariation = (array, strength, probability) => {
        if (!Array.isArray(array)) {
            // 如果是数字，应用随机变异
            return Math.random() < probability ? 
                array + (Math.random() * 2 - 1) * strength : 
                array;
        }

        // 如果是数组，递归处理每个元素
        return array.map(item => randomVariation(item, strength, probability));
    };

    try {
        const array = parse(A);
        const strength = +B || 1;    // 变异强度，默认为1
        const probability = +C || 0.1; // 变异概率，默认为0.1
        
        if (!array) {
            return "[]";
        }
        
        // 应用随机变异
        const result = randomVariation(array, strength, probability);
        
        return JSON.stringify(result);
        
    } catch (error) {
        return "[]";
    }
}

/**
 * 超极速版本 - 支持多维数组的RELU
 */
RELU_block({ A }) {
    const a = Array.isArray(A) ? A : JSON.parse(A);
    
    // 递归处理多维数组
    const relu = (arr) => {
        if (!Array.isArray(arr)) {
            // 如果是数字，应用ReLU
            return arr > 0 ? arr : 0;
        }
        
        // 如果是数组，递归处理每个元素
        return arr.map(item => relu(item));
    };
    
    return JSON.stringify(relu(a));
}

/**
 * ELU激活函数 - 支持多维数组 (α=1.0)
 */
ELU_block({ A }) {
    const a = Array.isArray(A) ? A : JSON.parse(A);
    
    // 递归处理多维数组
    const elu = (arr) => {
        if (!Array.isArray(arr)) {
            // 如果是数字，应用ELU
            return arr > 0 ? arr : Math.exp(arr) - 1;
        }
        
        // 如果是数组，递归处理每个元素
        return arr.map(item => elu(item));
    };
    
    return JSON.stringify(elu(a));
}

/**
 * Swish激活函数 - 支持多维数组 (β=1.0)
 */
SWISH_block({ A }) {
    const a = Array.isArray(A) ? A : JSON.parse(A);
    
    // 递归处理多维数组
    const swish = (arr) => {
        if (!Array.isArray(arr)) {
            // 如果是数字，应用Swish
            return arr / (1 + Math.exp(-arr));
        }
        
        // 如果是数组，递归处理每个元素
        return arr.map(item => swish(item));
    };
    
    return JSON.stringify(swish(a));
}

/**
 * Sigmoid激活函数 - 支持多维数组
 */
SIGMOID_block({ A }) {
    const a = Array.isArray(A) ? A : JSON.parse(A);
    
    // 递归处理多维数组
    const sigmoid = (arr) => {
        if (!Array.isArray(arr)) {
            // 如果是数字，应用Sigmoid
            return 1 / (1 + Math.exp(-arr));
        }
        
        // 如果是数组，递归处理每个元素
        return arr.map(item => sigmoid(item));
    };
    
    return JSON.stringify(sigmoid(a));
}

/**
 * 多线程矩阵乘法运算
 */
awbwCPU_block({ A, B }) {
    const parseToArray = (input) => {
        if (typeof input === 'string') {
            try {
                return JSON.parse(input).map(num => +num || 0);
            } catch (e) {
                return input.trim().split(/\s+/).map(num => +num || 0);
            }
        }
        return Array.isArray(input) ? input.flat().map(num => +num || 0) : [+input || 0];
    };

    // Worker代码字符串
    const workerCode = `
        self.onmessage = function(e) {
            const { vector, matrix, n, m, startCol, endCol, workerId } = e.data;
            const result = [];
            
            for (let j = startCol; j < endCol; j++) {
                let sum = 0;
                for (let i = 0; i < n; i++) {
                    sum += vector[i] * matrix[i * m + j];
                }
                result.push(sum);
            }
            
            self.postMessage({ result, workerId, startCol });
        };
    `;

    // 多线程计算函数
    const multiThreadCompute = async (vector, matrix, n, m) => {
        // 检查是否支持Web Workers
        if (typeof Worker === 'undefined') {
            return singleThreadOptimized(vector, matrix, n, m);
        }

        try {
            // 创建Worker URL
            const blob = new Blob([workerCode], { type: 'application/javascript' });
            const workerUrl = URL.createObjectURL(blob);
            
            // 确定线程数量（通常为CPU核心数，最多8个）
            const numThreads = Math.min(navigator.hardwareConcurrency || 4, 8, m);
            const colsPerThread = Math.ceil(m / numThreads);
            
            const workers = [];
            const promises = [];
            
            // 创建Workers并分配任务
            for (let i = 0; i < numThreads; i++) {
                const startCol = i * colsPerThread;
                const endCol = Math.min(startCol + colsPerThread, m);
                
                if (startCol >= m) break;
                
                const worker = new Worker(workerUrl);
                workers.push(worker);
                
                const promise = new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        reject(new Error('Worker timeout'));
                    }, 5000); // 5秒超时
                    
                    worker.onmessage = (e) => {
                        clearTimeout(timeout);
                        resolve(e.data);
                    };
                    
                    worker.onerror = (error) => {
                        clearTimeout(timeout);
                        reject(error);
                    };
                });
                
                promises.push(promise);
                
                // 发送任务数据
                worker.postMessage({
                    vector,
                    matrix,
                    n,
                    m,
                    startCol,
                    endCol,
                    workerId: i
                });
            }
            
            // 等待所有Worker完成
            const results = await Promise.all(promises);
            
            // 清理Workers
            workers.forEach(worker => worker.terminate());
            URL.revokeObjectURL(workerUrl);
            
            // 合并结果
            const finalResult = new Array(m);
            results.forEach(({ result, startCol }) => {
                for (let i = 0; i < result.length; i++) {
                    finalResult[startCol + i] = result[i];
                }
            });
            
            return finalResult;
            
        } catch (error) {
            console.warn('Multi-threading failed, using single thread:', error);
            return singleThreadOptimized(vector, matrix, n, m);
        }
    };

    // 单线程优化版本（回退方案）
    const singleThreadOptimized = (vector, matrix, n, m) => {
        const result = new Float32Array(m);
        const vec = new Float32Array(vector);
        const mat = new Float32Array(matrix);
        
        // 4路展开优化
        for (let j = 0; j < m; j += 4) {
            let s0 = 0, s1 = 0, s2 = 0, s3 = 0;
            
            for (let i = 0; i < n; i++) {
                const v = vec[i];
                const base = i * m + j;
                
                if (j < m) s0 += v * mat[base];
                if (j + 1 < m) s1 += v * mat[base + 1];
                if (j + 2 < m) s2 += v * mat[base + 2];
                if (j + 3 < m) s3 += v * mat[base + 3];
            }
            
            if (j < m) result[j] = s0;
            if (j + 1 < m) result[j + 1] = s1;
            if (j + 2 < m) result[j + 2] = s2;
            if (j + 3 < m) result[j + 3] = s3;
        }
        
        return Array.from(result);
    };

    // 同步包装器（因为积木块需要同步返回）
    const syncMultiThread = (vector, matrix, n, m) => {
        // 对于小矩阵，直接使用单线程
        if (m < 100) {
            return singleThreadOptimized(vector, matrix, n, m);
        }
        
        // 尝试使用SharedArrayBuffer进行同步多线程
        if (typeof SharedArrayBuffer !== 'undefined') {
            try {
                return sharedArrayBufferCompute(vector, matrix, n, m);
            } catch (e) {
                return singleThreadOptimized(vector, matrix, n, m);
            }
        }
        
        return singleThreadOptimized(vector, matrix, n, m);
    };

    // SharedArrayBuffer版本（同步多线程）
    const sharedArrayBufferCompute = (vector, matrix, n, m) => {
        const numThreads = Math.min(navigator.hardwareConcurrency || 4, 4, m);
        const sharedResult = new SharedArrayBuffer(m * 8); // Float64Array
        const resultView = new Float64Array(sharedResult);
        
        const workerCodeShared = `
            self.onmessage = function(e) {
                const { vector, matrix, n, m, startCol, endCol, sharedBuffer } = e.data;
                const result = new Float64Array(sharedBuffer);
                
                for (let j = startCol; j < endCol; j++) {
                    let sum = 0;
                    for (let i = 0; i < n; i++) {
                        sum += vector[i] * matrix[i * m + j];
                    }
                    result[j] = sum;
                }
                
                self.postMessage('done');
            };
        `;
        
        const blob = new Blob([workerCodeShared], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        
        const workers = [];
        let completedWorkers = 0;
        const colsPerThread = Math.ceil(m / numThreads);
        
        for (let i = 0; i < numThreads; i++) {
            const startCol = i * colsPerThread;
            const endCol = Math.min(startCol + colsPerThread, m);
            
            if (startCol >= m) break;
            
            const worker = new Worker(workerUrl);
            workers.push(worker);
            
            worker.onmessage = () => {
                completedWorkers++;
            };
            
            worker.postMessage({
                vector,
                matrix,
                n,
                m,
                startCol,
                endCol,
                sharedBuffer: sharedResult
            });
        }
        
        // 简单的忙等待（在实际应用中应该避免）
        const startTime = Date.now();
        while (completedWorkers < workers.length && Date.now() - startTime < 1000) {
            // 等待所有worker完成
        }
        
        workers.forEach(worker => worker.terminate());
        URL.revokeObjectURL(workerUrl);
        
        return Array.from(resultView);
    };

    try {
        const vector = parseToArray(A);
        const matrix2DFlat = parseToArray(B);
        
        if (vector.length === 0) return "[]";
        
        const n = vector.length;
        const m = matrix2DFlat.length / n;
        
        if (matrix2DFlat.length % n !== 0) return "[]";
        
        const result = syncMultiThread(vector, matrix2DFlat, n, m);
        return JSON.stringify(result);
        
    } catch (error) {
        return "[]";
    }
}
/**
 * 均方误差损失函数 - 支持多维数组
 * @param {Object} param - 参数对象
 * @param {*} param.A - 预测值数组
 * @param {*} param.B - 真实值数组
 * @returns {string} 损失值
 */
MSE_LOSS_block({ A, B }) {
    const parse = (input) => {
        if (typeof input === 'string') {
            try {
                return JSON.parse(input);
            } catch (e) {
                return input.trim().split(/\s+/).map(num => +num || 0);
            }
        }
        return input;
    };

    // 递归计算MSE
    const computeMSE = (pred, actual) => {
        if (!Array.isArray(pred) && !Array.isArray(actual)) {
            // 如果都是标量，直接计算平方误差
            const diff = pred - actual;
            return diff * diff;
        }

        if (Array.isArray(pred) && Array.isArray(actual)) {
            // 如果都是数组，递归计算每个元素
            if (pred.length !== actual.length) {
                return 0;
            }
            
            const errors = pred.map((p, i) => computeMSE(p, actual[i]));
            
            // 如果子元素是数字，计算平均值
            if (errors.every(e => typeof e === 'number')) {
                return errors.reduce((sum, e) => sum + e, 0) / errors.length;
            }
            
            // 如果子元素是数组，保持结构
            return errors;
        }

        return 0;
    };

    try {
        const predicted = parse(A);
        const actual = parse(B);
        
        if (!predicted || !actual) {
            return "0";
        }
        
        const mse = computeMSE(predicted, actual);
        
        // 确保返回数字
        const result = typeof mse === 'number' ? mse : 
            (Array.isArray(mse) ? mse.flat(Infinity).reduce((sum, val) => sum + val, 0) / mse.flat(Infinity).length : 0);
        
        return result.toString();
        
    } catch (error) {
        return "0";
    }
}

/**
 * 二元交叉熵损失函数 - 支持多维数组
 * @param {Object} param - 参数对象
 * @param {*} param.A - 预测概率数组 (0-1之间)
 * @param {*} param.B - 真实标签数组 (0或1)
 * @returns {string} 损失值
 */
BINARY_CROSS_ENTROPY_LOSS_block({ A, B }) {
    const parse = (input) => {
        if (typeof input === 'string') {
            try {
                return JSON.parse(input);
            } catch (e) {
                return input.trim().split(/\s+/).map(num => +num || 0);
            }
        }
        return input;
    };

    const epsilon = 1e-15;

    // 递归计算二元交叉熵
    const computeBCE = (pred, actual) => {
        if (!Array.isArray(pred) && !Array.isArray(actual)) {
            // 如果都是标量，直接计算交叉熵
            const p = Math.max(epsilon, Math.min(1 - epsilon, pred));
            const y = actual;
            return -(y * Math.log(p) + (1 - y) * Math.log(1 - p));
        }

        if (Array.isArray(pred) && Array.isArray(actual)) {
            // 如果都是数组，递归计算每个元素
            if (pred.length !== actual.length) {
                return 0;
            }
            
            const losses = pred.map((p, i) => computeBCE(p, actual[i]));
            
            // 如果子元素是数字，计算平均值
            if (losses.every(l => typeof l === 'number')) {
                return losses.reduce((sum, l) => sum + l, 0) / losses.length;
            }
            
            // 如果子元素是数组，保持结构
            return losses;
        }

        return 0;
    };

    try {
        const predicted = parse(A);
        const actual = parse(B);
        
        if (!predicted || !actual) {
            return "0";
        }
        
        const bce = computeBCE(predicted, actual);
        
        // 确保返回数字
        const result = typeof bce === 'number' ? bce : 
            (Array.isArray(bce) ? bce.flat(Infinity).reduce((sum, val) => sum + val, 0) / bce.flat(Infinity).length : 0);
        
        return result.toString();
        
    } catch (error) {
        return "0";
    }
}

/**
 * Huber损失函数 - 支持多维数组
 * @param {Object} param - 参数对象
 * @param {*} param.A - 预测值数组
 * @param {*} param.B - 真实值数组
 * @param {*} param.C - delta参数 (默认1.0)
 * @returns {string} 损失值
 */
HUBER_LOSS_block({ A, B, C }) {
    const parse = (input) => {
        if (typeof input === 'string') {
            try {
                return JSON.parse(input);
            } catch (e) {
                return input.trim().split(/\s+/).map(num => +num || 0);
            }
        }
        return input;
    };

    // 递归计算Huber损失
    const computeHuber = (pred, actual, delta) => {
        if (!Array.isArray(pred) && !Array.isArray(actual)) {
            // 如果都是标量，直接计算Huber损失
            const diff = Math.abs(pred - actual);
            if (diff <= delta) {
                return 0.5 * diff * diff;
            } else {
                return delta * diff - 0.5 * delta * delta;
            }
        }

        if (Array.isArray(pred) && Array.isArray(actual)) {
            // 如果都是数组，递归计算每个元素
            if (pred.length !== actual.length) {
                return 0;
            }
            
            const losses = pred.map((p, i) => computeHuber(p, actual[i], delta));
            
            // 如果子元素是数字，计算平均值
            if (losses.every(l => typeof l === 'number')) {
                return losses.reduce((sum, l) => sum + l, 0) / losses.length;
            }
            
            // 如果子元素是数组，保持结构
            return losses;
        }

        return 0;
    };

    try {
        const predicted = parse(A);
        const actual = parse(B);
        const delta = +C || 1.0;
        
        if (!predicted || !actual) {
            return "0";
        }
        
        const huber = computeHuber(predicted, actual, delta);
        
        // 确保返回数字
        const result = typeof huber === 'number' ? huber : 
            (Array.isArray(huber) ? huber.flat(Infinity).reduce((sum, val) => sum + val, 0) / huber.flat(Infinity).length : 0);
        
        return result.toString();
        
    } catch (error) {
        return "0";
    }
}

/**
 * Dropout层 - 训练模式
 * @param {Object} param - 参数对象
 * @param {*} param.A - 输入数组
 * @param {*} param.B - Dropout概率 (0-1之间)
 * @returns {string} 输出数组 (JSON格式)
 */
DROPOUT_TRAIN_block({ A, B }) {
    const parseToArray = (input) => {
        if (typeof input === 'string') {
            try {
                return JSON.parse(input).map(num => +num || 0);
            } catch (e) {
                return input.trim().split(/\s+/).map(num => +num || 0);
            }
        }
        return Array.isArray(input) ? input.flat().map(num => +num || 0) : [+input || 0];
    };

    try {
        const input = parseToArray(A);
        const dropoutRate = Math.max(0, Math.min(1, +B || 0)); // 限制在0-1之间
        
        if (input.length === 0) {
            return "[]";
        }
        
        const keepProb = 1 - dropoutRate;
        const result = new Array(input.length);
        
        // 训练时：随机丢弃神经元并缩放保留的神经元
        for (let i = 0; i < input.length; i++) {
            if (Math.random() < keepProb) {
                // 保留神经元，并按1/keepProb缩放以保持期望值不变
                result[i] = input[i] / keepProb;
            } else {
                // 丢弃神经元
                result[i] = 0;
            }
        }
        
        return JSON.stringify(result);
        
    } catch (error) {
        return "[]";
    }
}
/**
 * Dropout层 - 推理模式 (直接传递输入)
 * @param {Object} param - 参数对象
 * @param {*} param.A - 输入数组
 * @returns {string} 输出数组 (与输入相同)
 */
DROPOUT_EVAL_block({ A }) {
    const parseToArray = (input) => {
        if (typeof input === 'string') {
            try {
                return JSON.parse(input).map(num => +num || 0);
            } catch (e) {
                return input.trim().split(/\s+/).map(num => +num || 0);
            }
        }
        return Array.isArray(input) ? input.flat().map(num => +num || 0) : [+input || 0];
    };

    try {
        const input = parseToArray(A);
        
        if (input.length === 0) {
            return "[]";
        }
        
        // 推理时：直接返回输入，不进行dropout
        return JSON.stringify(input);
        
    } catch (error) {
        return "[]";
    }
}
/**
 * Dropout层 - 带掩码输出
 * @param {Object} param - 参数对象
 * @param {*} param.A - 输入数组
 * @param {*} param.B - Dropout概率
 * @returns {string} 输出格式: {"output": [...], "mask": [...]}
 */
DROPOUT_WITH_MASK_block({ A, B }) {
    const parseToArray = (input) => {
        if (typeof input === 'string') {
            try {
                return JSON.parse(input).map(num => +num || 0);
            } catch (e) {
                return input.trim().split(/\s+/).map(num => +num || 0);
            }
        }
        return Array.isArray(input) ? input.flat().map(num => +num || 0) : [+input || 0];
    };

    try {
        const input = parseToArray(A);
        const dropoutRate = Math.max(0, Math.min(1, +B || 0));
        
        if (input.length === 0) {
            return JSON.stringify({output: [], mask: []});
        }
        
        const keepProb = 1 - dropoutRate;
        const output = new Array(input.length);
        const mask = new Array(input.length);
        
        for (let i = 0; i < input.length; i++) {
            const keep = Math.random() < keepProb;
            mask[i] = keep ? 1 : 0;
            
            if (keep) {
                output[i] = input[i] / keepProb;
            } else {
                output[i] = 0;
            }
        }
        
        return JSON.stringify({
            output: output,
            mask: mask
        });
        
    } catch (error) {
        return JSON.stringify({output: [], mask: []});
    }
}
/**
 * Alpha Dropout层 - 保持均值和方差
 * @param {Object} param - 参数对象
 * @param {*} param.A - 输入数组
 * @param {*} param.B - Dropout概率
 * @returns {string} 输出数组
 */
ALPHA_DROPOUT_block({ A, B }) {
    const parseToArray = (input) => {
        if (typeof input === 'string') {
            try {
                return JSON.parse(input).map(num => +num || 0);
            } catch (e) {
                return input.trim().split(/\s+/).map(num => +num || 0);
            }
        }
        return Array.isArray(input) ? input.flat().map(num => +num || 0) : [+input || 0];
    };

    try {
        const input = parseToArray(A);
        const dropoutRate = Math.max(0, Math.min(1, +B || 0));
        
        if (input.length === 0 || dropoutRate === 0) {
            return JSON.stringify(input);
        }
        
        const keepProb = 1 - dropoutRate;
        const alpha = -1.7580993408473766; // SELU的alpha值
        const scale = 1.0507009873554805;  // SELU的scale值
        
        // Alpha dropout的参数
        const alphaPrime = -alpha * scale;
        const a = Math.sqrt(keepProb + alphaPrime * alphaPrime * keepProb * (1 - keepProb));
        const b = -a * alphaPrime * (1 - keepProb);
        
        const result = new Array(input.length);
        
        for (let i = 0; i < input.length; i++) {
            if (Math.random() < keepProb) {
                result[i] = (a * input[i] + b);
            } else {
                result[i] = (a * alphaPrime + b);
            }
        }
        
        return JSON.stringify(result);
        
    } catch (error) {
        return "[]";
    }
}
/**
 * 向量点积运算
 * @param {Object} param - 参数对象
 * @param {*} param.A - 第一个向量
 * @param {*} param.B - 第二个向量
 * @returns {string} 点积结果
 */
DOT_PRODUCT_block({ A, B }) {
    const parseToArray = (input) => {
        if (typeof input === 'string') {
            try {
                return JSON.parse(input).map(num => +num || 0);
            } catch (e) {
                return input.trim().split(/\s+/).map(num => +num || 0);
            }
        }
        return Array.isArray(input) ? input.flat().map(num => +num || 0) : [+input || 0];
    };

    try {
        const vecA = parseToArray(A);
        const vecB = parseToArray(B);
        
        if (vecA.length !== vecB.length || vecA.length === 0) {
            return "0";
        }
        
        let dot = 0;
        for (let i = 0; i < vecA.length; i++) {
            dot += vecA[i] * vecB[i];
        }
        
        return dot.toString();
        
    } catch (error) {
        return "0";
    }
}
/**
 * 向量叉积运算 (仅限3维向量)
 * @param {Object} param - 参数对象
 * @param {*} param.A - 第一个3维向量
 * @param {*} param.B - 第二个3维向量
 * @returns {string} 叉积结果向量 (JSON格式)
 */
CROSS_PRODUCT_block({ A, B }) {
    const parseToArray = (input) => {
        if (typeof input === 'string') {
            try {
                return JSON.parse(input).map(num => +num || 0);
            } catch (e) {
                return input.trim().split(/\s+/).map(num => +num || 0);
            }
        }
        return Array.isArray(input) ? input.flat().map(num => +num || 0) : [+input || 0];
    };

    try {
        const vecA = parseToArray(A);
        const vecB = parseToArray(B);
        
        // 确保是3维向量
        if (vecA.length !== 3 || vecB.length !== 3) {
            return "[]";
        }
        
        const result = [
            vecA[1] * vecB[2] - vecA[2] * vecB[1],
            vecA[2] * vecB[0] - vecA[0] * vecB[2],
            vecA[0] * vecB[1] - vecA[1] * vecB[0]
        ];
        
        return JSON.stringify(result);
        
    } catch (error) {
        return "[]";
    }
}
/**
 * 向量欧氏距离
 * @param {Object} param - 参数对象
 * @param {*} param.A - 第一个向量
 * @param {*} param.B - 第二个向量
 * @returns {string} 距离结果
 */
EUCLIDEAN_DISTANCE_block({ A, B }) {
    const parseToArray = (input) => {
        if (typeof input === 'string') {
            try {
                return JSON.parse(input).map(num => +num || 0);
            } catch (e) {
                return input.trim().split(/\s+/).map(num => +num || 0);
            }
        }
        return Array.isArray(input) ? input.flat().map(num => +num || 0) : [+input || 0];
    };

    try {
        const vecA = parseToArray(A);
        const vecB = parseToArray(B);
        
        if (vecA.length !== vecB.length || vecA.length === 0) {
            return "0";
        }
        
        let sum = 0;
        for (let i = 0; i < vecA.length; i++) {
            const diff = vecA[i] - vecB[i];
            sum += diff * diff;
        }
        
        return Math.sqrt(sum).toString();
        
    } catch (error) {
        return "0";
    }
}
/**
 * 向量曼哈顿距离
 * @param {Object} param - 参数对象
 * @param {*} param.A - 第一个向量
 * @param {*} param.B - 第二个向量
 * @returns {string} 距离结果
 */
MANHATTAN_DISTANCE_block({ A, B }) {
    const parseToArray = (input) => {
        if (typeof input === 'string') {
            try {
                return JSON.parse(input).map(num => +num || 0);
            } catch (e) {
                return input.trim().split(/\s+/).map(num => +num || 0);
            }
        }
        return Array.isArray(input) ? input.flat().map(num => +num || 0) : [+input || 0];
    };

    try {
        const vecA = parseToArray(A);
        const vecB = parseToArray(B);
        
        if (vecA.length !== vecB.length || vecA.length === 0) {
            return "0";
        }
        
        let distance = 0;
        for (let i = 0; i < vecA.length; i++) {
            distance += Math.abs(vecA[i] - vecB[i]);
        }
        
        return distance.toString();
        
    } catch (error) {
        return "0";
    }
}
/**
 * 向量余弦相似度
 * @param {Object} param - 参数对象
 * @param {*} param.A - 第一个向量
 * @param {*} param.B - 第二个向量
 * @returns {string} 相似度结果 (-1到1之间)
 */
COSINE_SIMILARITY_block({ A, B }) {
    const parseToArray = (input) => {
        if (typeof input === 'string') {
            try {
                return JSON.parse(input).map(num => +num || 0);
            } catch (e) {
                return input.trim().split(/\s+/).map(num => +num || 0);
            }
        }
        return Array.isArray(input) ? input.flat().map(num => +num || 0) : [+input || 0];
    };

    try {
        const vecA = parseToArray(A);
        const vecB = parseToArray(B);
        
        if (vecA.length !== vecB.length || vecA.length === 0) {
            return "0";
        }
        
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        
        const cosine = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
        
        // 限制在[-1, 1]范围内，避免浮点误差
        return Math.max(-1, Math.min(1, cosine)).toString();
        
    } catch (error) {
        return "0";
    }
}
/**
 * 向量标准化
 * @param {Object} param - 参数对象
 * @param {*} param.A - 输入向量
 * @param {*} param.B - 范数类型 (0=L2范数, 1=L1范数, 2=无穷范数)
 * @returns {string} 标准化后的向量 (JSON格式)
 */
NORMALIZE_VECTOR_block({ A, B }) {
    const parseToArray = (input) => {
        if (typeof input === 'string') {
            try {
                return JSON.parse(input).map(num => +num || 0);
            } catch (e) {
                return input.trim().split(/\s+/).map(num => +num || 0);
            }
        }
        return Array.isArray(input) ? input.flat().map(num => +num || 0) : [+input || 0];
    };

    try {
        const vec = parseToArray(A);
        const normType = +B || 0; // 默认L2范数
        
        if (vec.length === 0) {
            return "[]";
        }
        
        let norm = 0;
        
        // 计算范数
        if (normType === 0) { // L2范数
            for (let i = 0; i < vec.length; i++) {
                norm += vec[i] * vec[i];
            }
            norm = Math.sqrt(norm);
        } else if (normType === 1) { // L1范数
            for (let i = 0; i < vec.length; i++) {
                norm += Math.abs(vec[i]);
            }
        } else { // 无穷范数
            for (let i = 0; i < vec.length; i++) {
                norm = Math.max(norm, Math.abs(vec[i]));
            }
        }
        
        // 避免除以0
        if (norm === 0) {
            return JSON.stringify(vec.map(() => 0));
        }
        
        // 标准化
        const result = vec.map(x => x / norm);
        return JSON.stringify(result);
        
    } catch (error) {
        return "[]";
    }
}

/**
 * MSE损失梯度计算
 * @param {Object} param - 参数对象
 * @param {*} param.A - 预测值数组
 * @param {*} param.B - 真实值数组
 * @returns {string} 梯度矩阵 (JSON格式)
 */
MSE_GRADIENT_block({ A, B }) {
    const parseToArray = (input) => {
        if (typeof input !== 'string') return input;
        try {
            return JSON.parse(input);
        } catch (e) {
            return input.trim().split(/\s+/).map(n => +n || 0);
        }
    };

    const flatten = (arr) => {
        const result = [];
        const stack = [arr];
        while (stack.length) {
            const current = stack.pop();
            if (Array.isArray(current)) {
                for (let i = current.length - 1; i >= 0; i--) {
                    stack.push(current[i]);
                }
            } else {
                result.push(current);
            }
        }
        return result;
    };

    const reshape = (arr, dims) => {
        if (dims.length === 1) return arr.slice(0, dims[0]);
        
        const result = [];
        const size = dims.slice(1).reduce((a, b) => a * b, 1);
        
        for (let i = 0; i < dims[0]; i++) {
            result.push(reshape(arr.slice(i * size, (i + 1) * size), dims.slice(1)));
        }
        return result;
    };

    try {
        const predicted = parseToArray(A);
        const actual = parseToArray(B);
        
        if (!Array.isArray(predicted) || !Array.isArray(actual)) {
            return "[]";
        }
        
        // 获取维度信息
        const getDims = (arr) => {
            const dims = [];
            let current = arr;
            while (Array.isArray(current)) {
                dims.push(current.length);
                current = current[0];
            }
            return dims;
        };
        
        const dimsPredicted = getDims(predicted);
        const dimsActual = getDims(actual);
        
        // 检查维度是否匹配
        if (dimsPredicted.length !== dimsActual.length || 
            dimsPredicted.some((d, i) => d !== dimsActual[i])) {
            return "[]";
        }
        
        // 扁平化数组
        const flatPredicted = flatten(predicted);
        const flatActual = flatten(actual);
        const n = flatPredicted.length;
        
        // 计算梯度：d(MSE)/dy = 2/n * (y - y_true)
        const gradients = new Array(n);
        for (let i = 0; i < n; i++) {
            gradients[i] = 2 * (flatPredicted[i] - flatActual[i]) / n;
        }
        
        // 重塑为原始维度
        return JSON.stringify(reshape(gradients, dimsPredicted));
        
    } catch (error) {
        return "[]";
    }
}
/**
 * 交叉熵损失梯度计算
 * @param {Object} param - 参数对象
 * @param {*} param.A - 预测概率数组 (softmax输出)
 * @param {*} param.B - 真实标签数组 (one-hot编码)
 * @returns {string} 梯度矩阵 (JSON格式)
 */
CROSS_ENTROPY_GRADIENT_block({ A, B }) {
    const parseToArray = (input) => {
        if (typeof input !== 'string') return input;
        try {
            return JSON.parse(input);
        } catch (e) {
            return input.trim().split(/\s+/).map(n => +n || 0);
        }
    };

    const flatten = (arr) => {
        const result = [];
        const stack = [arr];
        while (stack.length) {
            const current = stack.pop();
            if (Array.isArray(current)) {
                for (let i = current.length - 1; i >= 0; i--) {
                    stack.push(current[i]);
                }
            } else {
                result.push(current);
            }
        }
        return result;
    };

    const reshape = (arr, dims) => {
        if (dims.length === 1) return arr.slice(0, dims[0]);
        
        const result = [];
        const size = dims.slice(1).reduce((a, b) => a * b, 1);
        
        for (let i = 0; i < dims[0]; i++) {
            result.push(reshape(arr.slice(i * size, (i + 1) * size), dims.slice(1)));
        }
        return result;
    };

    try {
        const predicted = parseToArray(A);
        const actual = parseToArray(B);
        
        if (!Array.isArray(predicted) || !Array.isArray(actual)) {
            return "[]";
        }
        
        // 获取维度信息
        const getDims = (arr) => {
            const dims = [];
            let current = arr;
            while (Array.isArray(current)) {
                dims.push(current.length);
                current = current[0];
            }
            return dims;
        };
        
        const dimsPredicted = getDims(predicted);
        const dimsActual = getDims(actual);
        
        // 检查维度是否匹配
        if (dimsPredicted.length !== dimsActual.length || 
            dimsPredicted.some((d, i) => d !== dimsActual[i])) {
            return "[]";
        }
        
        // 扁平化数组
        const flatPredicted = flatten(predicted);
        const flatActual = flatten(actual);
        const n = flatPredicted.length;
        
        // 计算梯度：d(CrossEntropy)/dy = y - y_true
        const gradients = new Array(n);
        for (let i = 0; i < n; i++) {
            gradients[i] = flatPredicted[i] - flatActual[i];
        }
        
        // 重塑为原始维度
        return JSON.stringify(reshape(gradients, dimsPredicted));
        
    } catch (error) {
        return "[]";
    }
}
/**
 * Huber损失梯度计算
 * @param {Object} param - 参数对象
 * @param {*} param.A - 预测值数组
 * @param {*} param.B - 真实值数组
 * @param {*} param.C - delta参数 (默认1.0)
 * @returns {string} 梯度矩阵 (JSON格式)
 */
HUBER_GRADIENT_block({ A, B, C }) {
    const parseToArray = (input) => {
        if (typeof input !== 'string') return input;
        try {
            return JSON.parse(input);
        } catch (e) {
            return input.trim().split(/\s+/).map(n => +n || 0);
        }
    };

    const flatten = (arr) => {
        const result = [];
        const stack = [arr];
        while (stack.length) {
            const current = stack.pop();
            if (Array.isArray(current)) {
                for (let i = current.length - 1; i >= 0; i--) {
                    stack.push(current[i]);
                }
            } else {
                result.push(current);
            }
        }
        return result;
    };

    const reshape = (arr, dims) => {
        if (dims.length === 1) return arr.slice(0, dims[0]);
        
        const result = [];
        const size = dims.slice(1).reduce((a, b) => a * b, 1);
        
        for (let i = 0; i < dims[0]; i++) {
            result.push(reshape(arr.slice(i * size, (i + 1) * size), dims.slice(1)));
        }
        return result;
    };

    try {
        const predicted = parseToArray(A);
        const actual = parseToArray(B);
        const delta = Math.max(0.1, +C || 1.0);
        
        if (!Array.isArray(predicted) || !Array.isArray(actual)) {
            return "[]";
        }
        
        // 获取维度信息
        const getDims = (arr) => {
            const dims = [];
            let current = arr;
            while (Array.isArray(current)) {
                dims.push(current.length);
                current = current[0];
            }
            return dims;
        };
        
        const dimsPredicted = getDims(predicted);
        const dimsActual = getDims(actual);
        
        // 检查维度是否匹配
        if (dimsPredicted.length !== dimsActual.length || 
            dimsPredicted.some((d, i) => d !== dimsActual[i])) {
            return "[]";
        }
        
        // 扁平化数组
        const flatPredicted = flatten(predicted);
        const flatActual = flatten(actual);
        const n = flatPredicted.length;
        
        // 计算梯度
        const gradients = new Array(n);
        for (let i = 0; i < n; i++) {
            const diff = flatPredicted[i] - flatActual[i];
            if (Math.abs(diff) <= delta) {
                gradients[i] = diff;
            } else {
                gradients[i] = delta * (diff > 0 ? 1 : -1);
            }
        }
        
        // 重塑为原始维度
        return JSON.stringify(reshape(gradients, dimsPredicted));
        
    } catch (error) {
        return "[]";
    }
}



/**
 * 独热编码
 * @param {Object} param - 参数对象
 * @param {*} param.A - 输入数组（类别索引）
 * @param {*} param.B - 类别总数
 * @returns {string} 独热编码结果 (JSON格式)
 */
ONE_HOT_block({ A, B }) {
    const parseToArray = (input) => {
        if (typeof input === 'string') {
            try {
                return JSON.parse(input).map(num => +num || 0);
            } catch (e) {
                return input.trim().split(/\s+/).map(num => +num || 0);
            }
        }
        return Array.isArray(input) ? input.flat().map(num => +num || 0) : [+input || 0];
    };

    try {
        const indices = parseToArray(A);
        const numClasses = Math.max(1, Math.floor(Math.abs(+B || 0)));
        
        if (indices.length === 0) {
            return "[]";
        }
        
        const result = [];
        
        for (let i = 0; i < indices.length; i++) {
            const index = Math.floor(indices[i]);
            const encoding = new Array(numClasses).fill(0);
            
            // 确保索引在有效范围内
            if (index >= 0 && index < numClasses) {
                encoding[index] = 1;
            }
            
            result.push(encoding);
        }
        
        return JSON.stringify(result);
        
    } catch (error) {
        return "[]";
    }
}
/**
 * 批量独热编码 - 优化版本
 * @param {Object} param - 参数对象
 * @param {*} param.A - 输入数组（类别索引）
 * @param {*} param.B - 类别总数
 * @returns {string} 独热编码结果 (JSON格式)
 */
ONE_HOT_BATCH_block({ A, B }) {
    const parseToArray = (input) => {
        if (typeof input === 'string') {
            try {
                return JSON.parse(input).map(num => +num || 0);
            } catch (e) {
                return input.trim().split(/\s+/).map(num => +num || 0);
            }
        }
        return Array.isArray(input) ? input.flat().map(num => +num || 0) : [+input || 0];
    };

    try {
        const indices = parseToArray(A);
        const numClasses = Math.max(1, Math.floor(Math.abs(+B || 0)));
        
        if (indices.length === 0) {
            return "[]";
        }
        
        // 预分配结果数组
        const batchSize = indices.length;
        const result = new Array(batchSize);
        
        // 预分配每个编码数组
        const template = new Array(numClasses).fill(0);
        
        for (let i = 0; i < batchSize; i++) {
            const encoding = template.slice(); // 复制模板
            const index = Math.floor(indices[i]);
            
            if (index >= 0 && index < numClasses) {
                encoding[index] = 1;
            }
            
            result[i] = encoding;
        }
        
        return JSON.stringify(result);
        
    } catch (error) {
        return "[]";
    }
}
/**
 * 带平滑的独热编码 (用于标签平滑)
 * @param {Object} param - 参数对象
 * @param {*} param.A - 输入数组（类别索引）
 * @param {*} param.B - 类别总数
 * @param {*} param.C - 平滑因子 (0-1之间)
 * @returns {string} 独热编码结果 (JSON格式)
 */
ONE_HOT_SMOOTH_block({ A, B, C }) {
    const parseToArray = (input) => {
        if (typeof input === 'string') {
            try {
                return JSON.parse(input).map(num => +num || 0);
            } catch (e) {
                return input.trim().split(/\s+/).map(num => +num || 0);
            }
        }
        return Array.isArray(input) ? input.flat().map(num => +num || 0) : [+input || 0];
    };

    try {
        const indices = parseToArray(A);
        const numClasses = Math.max(1, Math.floor(Math.abs(+B || 0)));
        const smoothing = Math.max(0, Math.min(1, +C || 0)); // 限制在0-1之间
        
        if (indices.length === 0) {
            return "[]";
        }
        
        const result = [];
        const smoothValue = smoothing / numClasses;
        const oneMinusSmooth = 1 - smoothing;
        
        for (let i = 0; i < indices.length; i++) {
            const index = Math.floor(indices[i]);
            const encoding = new Array(numClasses).fill(smoothValue);
            
            if (index >= 0 && index < numClasses) {
                encoding[index] = oneMinusSmooth;
            }
            
            result.push(encoding);
        }
        
        return JSON.stringify(result);
        
    } catch (error) {
        return "[]";
    }
}
/**
 * 多标签独热编码
 * @param {Object} param - 参数对象
 * @param {*} param.A - 输入数组（类别索引列表）
 * @param {*} param.B - 类别总数
 * @returns {string} 独热编码结果 (JSON格式)
 */
MULTI_LABEL_ONE_HOT_block({ A, B }) {
    const parseToArray = (input) => {
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
                return input.trim().split(/\s+/).map(num => +num || 0);
            }
        }
        return Array.isArray(input) ? input.flat().map(num => +num || 0) : [+input || 0];
    };

    try {
        const labelLists = parseToArray(A);
        const numClasses = Math.max(1, Math.floor(Math.abs(+B || 0)));
        
        if (labelLists.length === 0) {
            return "[]";
        }
        
        const result = [];
        
        for (let i = 0; i < labelLists.length; i++) {
            const labels = Array.isArray(labelLists[i]) ? labelLists[i] : [labelLists[i]];
            const encoding = new Array(numClasses).fill(0);
            
            for (const label of labels) {
                const index = Math.floor(label);
                if (index >= 0 && index < numClasses) {
                    encoding[index] = 1;
                }
            }
            
            result.push(encoding);
        }
        
        return JSON.stringify(result);
        
    } catch (error) {
        return "[]";
    }
}
/**
 * 独热编码解码
 * @param {Object} param - 参数对象
 * @param {*} param.A - 独热编码数组
 * @param {*} param.B - 返回模式 (0=索引, 1=概率)
 * @returns {string} 解码结果 (JSON格式)
 */
ONE_HOT_DECODE_block({ A, B }) {
    const parseToArray = (input) => {
        if (typeof input === 'string') {
            try {
                return JSON.parse(input).map(item => {
                    if (Array.isArray(item)) {
                        return item.map(num => +num || 0);
                    }
                    return [+num || 0];
                });
            } catch (e) {
                return input.trim().split(/\s+/).map(num => +num || 0);
            }
        }
        return Array.isArray(input) ? input.flat().map(num => +num || 0) : [+input || 0];
    };

    try {
        const oneHotArrays = parseToArray(A);
        const mode = +B || 0; // 0=返回索引，1=返回概率
        
        if (oneHotArrays.length === 0) {
            return "[]";
        }
        
        const result = [];
        
        for (const oneHot of oneHotArrays) {
            if (!Array.isArray(oneHot)) {
                result.push(0);
                continue;
            }
            
            let maxValue = -Infinity;
            let maxIndex = 0;
            
            for (let i = 0; i < oneHot.length; i++) {
                if (oneHot[i] > maxValue) {
                    maxValue = oneHot[i];
                    maxIndex = i;
                }
            }
            
            result.push(mode === 0 ? maxIndex : maxValue);
        }
        
        return JSON.stringify(result);
        
    } catch (error) {
        return "[]";
    }
}


/**
 * 矩阵形状转换器
 * @param {Object} param - 参数对象
 * @param {*} param.A - 输入矩阵
 * @param {*} param.B - 目标形状 [行,列]
 * @returns {string} 转换后的矩阵 (JSON格式)
 */
MATRIX_RESHAPE_block({ A, B }) {
    const parseToArray = (input) => {
        if (typeof input === 'string') {
            try {
                return JSON.parse(input);
            } catch (e) {
                return input.trim().split(/\s+/).map(num => +num || 0);
            }
        }
        // 如果是数组，直接返回
        if (Array.isArray(input)) {
            return input;
        }
        // 如果是单个数字，转换为数组
        return [+input || 0];
    };

    try {
        const matrix = parseToArray(A);
        const targetShape = parseToArray(B);
        
        // 验证输入
        if (!Array.isArray(matrix)) {
            return "[]";
        }
        
        // 扁平化输入矩阵
        const flattenMatrix = (arr) => {
            const result = [];
            const stack = [arr];
            while (stack.length) {
                const current = stack.pop();
                if (Array.isArray(current)) {
                    for (let i = current.length - 1; i >= 0; i--) {
                        stack.push(current[i]);
                    }
                } else {
                    result.push(current);
                }
            }
            return result;
        };
        
        const flatMatrix = flattenMatrix(matrix);
        
        // 验证目标形状
        if (!Array.isArray(targetShape) || targetShape.length !== 2) {
            return "[]";
        }
        
        const [targetRows, targetCols] = targetShape;
        
        if (targetRows <= 0 || targetCols <= 0) {
            return "[]";
        }
        
        // 检查元素数量是否匹配
        const totalElements = targetRows * targetCols;
        if (flatMatrix.length !== totalElements) {
            return "[]";
        }
        
        // 重塑矩阵
        const result = [];
        for (let i = 0; i < targetRows; i++) {
            const row = [];
            for (let j = 0; j < targetCols; j++) {
                row.push(flatMatrix[i * targetCols + j]);
            }
            result.push(row);
        }
        
        return JSON.stringify(result);
        
    } catch (error) {
        return "[]";
    }
}


/**
 * 神经网络偏置梯度计算 - 支持多维数组
 * @param {Object} param - 参数对象
 * @param {*} param.A - 上一层误差
 * @returns {string} 偏置梯度 (JSON格式)
 */
BIAS_GRADIENT_block({ A }) {
    const parse = (input) => {
        if (typeof input === 'string') {
            try {
                return JSON.parse(input);
            } catch (e) {
                return input.trim().split(/\s+/).map(num => +num || 0);
            }
        }
        return input;
    };

    // 递归计算梯度
    const computeGradient = (error) => {
        if (!Array.isArray(error)) {
            // 如果是标量，直接返回
            return error;
        }

        // 检查是否需要沿特定维度求和
        if (error.every(item => Array.isArray(item))) {
            // 如果所有元素都是数组，递归计算每个子数组的梯度
            return error.map(subArray => computeGradient(subArray));
        } else {
            // 如果是数字数组，计算它们的和
            return error.reduce((sum, val) => sum + val, 0);
        }
    };

    try {
        const error = parse(A);  // 上一层误差
        
        if (!error) {
            return "[]";
        }
        
        // 计算梯度
        const gradient = computeGradient(error);
        
        // 确保结果至少是一个数组
        const result = Array.isArray(gradient) ? gradient : [gradient];
        
        return JSON.stringify(result);
        
    } catch (error) {
        return "[]";
    }
}
 //这个是king制作 经过张量优化
/**
 * 多维矩阵生成器
 * @param {Object} param - 参数对象
 * @param {*} param.A - 维度信息数组 [行,列,...]
 * @param {*} param.B - 填充值 (可选)
 * @returns {string} 生成的多维矩阵 (JSON格式)
 */
MATRIX_ND_CREATE_block({ A, B }) {
    const parse = (input) => {
        if (typeof input !== 'string') return input;
        try {
            return JSON.parse(input);
        } catch (e) {
            return input.trim().split(/\s+/).map(n => +n || 0);
        }
    };

    try {
        const dims = parse(A);
        const fillValue = B !== undefined ? +B : 0;
        
        // 验证维度
        if (!Array.isArray(dims) || dims.length === 0 || dims.some(d => d <= 0)) {
            return "[]";
        }
        
        // 递归生成矩阵
        const create = (dimensions, depth = 0) => {
            if (depth === dimensions.length - 1) {
                return new Array(dimensions[depth]).fill(fillValue);
            }
            
            const matrix = [];
            for (let i = 0; i < dimensions[depth]; i++) {
                matrix.push(create(dimensions, depth + 1));
            }
            return matrix;
        };
        
        return JSON.stringify(create(dims));
        
    } catch (error) {
        return "[]";
    }
}
/**
 * 将文本逐字符拆分为数组（最基础的分词）
 * @param {Object} param - 参数对象
 * @param {*} param.A - 输入文本字符串
 * @returns {string} 拆分后的字符数组（JSON格式字符串）
 */
CHARACTER_TOKENIZER_block({ A }) {
  try {
    const text = String(A || "");
    
    if (!text) {
      return "[]";
    }

    // 直接按空字符串分割，得到每个字符组成的数组
    const tokens = text.split("");
    
    return JSON.stringify(tokens);
    
  } catch (error) {
    return "[]"; // 出错时返回空数组
  }
}//love auska
/**
 * 简化版多维矩阵运算器
 * @param {Object} param - 参数对象
 * @param {*} param.A - 第一个矩阵
 * @param {*} param.B - 第一个矩阵的维度信息
 * @param {*} param.C - 第二个矩阵
 * @param {*} param.D - 第二个矩阵的维度信息
 * @param {*} param.E - 运算类型 ("加法"/"乘法")
 * @returns {string} 运算结果 (JSON格式)
 */
MATRIX_ND_OP_block({ A, B, C, D, E }) {
    const parse = (input) => {
        if (typeof input !== 'string') return input;
        try {
            return JSON.parse(input);
        } catch (e) {
            return input.trim().split(/\s+/).map(n => +n || 0);
        }
    };

    try {
        // 解析输入
        const matrixA = parse(A);
        const dimsA = parse(B);
        const matrixB = C ? parse(C) : null;
        const dimsB = D ? parse(D) : null;
        const operation = String(E || "").toLowerCase();
        
        // 基本验证
        if (!matrixA || !dimsA || dimsA.length === 0) return "[]";
        
        // 工具函数：扁平化
        const flatten = (arr) => {
            const result = [];
            const stack = [arr];
            while (stack.length) {
                const current = stack.pop();
                if (Array.isArray(current)) {
                    for (let i = current.length - 1; i >= 0; i--) {
                        stack.push(current[i]);
                    }
                } else {
                    result.push(current);
                }
            }
            return result;
        };
        
        // 工具函数：重塑
        const reshape = (arr, dims) => {
            if (dims.length === 1) return arr.slice(0, dims[0]);
            
            const result = [];
            const size = dims.slice(1).reduce((a, b) => a * b, 1);
            
            for (let i = 0; i < dims[0]; i++) {
                result.push(reshape(arr.slice(i * size, (i + 1) * size), dims.slice(1)));
            }
            return result;
        };
        
        // 扁平化矩阵A
        const flatA = flatten(matrixA);
        
        switch (operation) {
            case "加法":
                // 验证矩阵B
                if (!matrixB || !dimsB || dimsA.length !== dimsB.length || 
                    dimsA.some((d, i) => d !== dimsB[i])) {
                    return "[]";
                }
                
                const flatB = flatten(matrixB);
                if (flatA.length !== flatB.length) return "[]";
                
                // 执行加法
                const sumResult = flatA.map((val, i) => val + flatB[i]);
                return JSON.stringify(reshape(sumResult, dimsA));
                
            case "乘法":
                // 验证矩阵B
                if (!matrixB || !dimsB || dimsA.length < 2 || dimsB.length < 2 ||
                    dimsA[dimsA.length - 1] !== dimsB[0]) {
                    return "[]";
                }
                
                const flatB2 = flatten(matrixB);
                
                // 计算结果维度
                const resultDims = [...dimsA];
                resultDims[resultDims.length - 1] = dimsB[dimsB.length - 1];
                
                // 执行矩阵乘法
                const m = dimsA[dimsA.length - 2];
                const n = dimsA[dimsA.length - 1];
                const p = dimsB[dimsB.length - 1];
                const mulResult = new Array(m * p);
                
                for (let i = 0; i < m; i++) {
                    for (let j = 0; j < p; j++) {
                        let sum = 0;
                        for (let k = 0; k < n; k++) {
                            sum += flatA[i * n + k] * flatB2[k * p + j];
                        }
                        mulResult[i * p + j] = sum;
                    }
                }
                
                return JSON.stringify(reshape(mulResult, resultDims));
                
            default:
                return "[]";
        }
        
    } catch (error) {
        return "[]";
    }
}//傻逼张量计算 麻烦死了！！！！

/**
 * 数组合并成字典 - 灵活格式
 * @param {Object} param - 参数对象
 * @param {*} param.A - 键数组
 * @param {*} param.B - 值数组
 * @returns {string} 生成的字典 (JSON格式)
 */
ARRAY_TO_DICT_block({ A, B }) {
    const parseToArray = (input) => {
        if (typeof input !== 'string') return input;
        try {
            // 如果是JSON格式，直接解析
            return JSON.parse(input);
        } catch (e) {
            // 如果不是JSON，简单处理
            const trimmed = input.trim();
            if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                // 移除方括号并分割
                return trimmed.slice(1, -1).split(',').map(item => {
                    item = item.trim();
                    // 如果是数字，转换为数字
                    if (!isNaN(item) && item !== '') {
                        return Number(item);
                    }
                    return item;
                });
            }
            // 如果没有方括号，按空格分割
            return input.trim().split(/\s+/).map(item => {
                if (!isNaN(item) && item !== '') {
                    return Number(item);
                }
                return item;
            });
        }
    };

    try {
        const keys = parseToArray(A);
        const values = parseToArray(B);
        
        if (!Array.isArray(keys) || !Array.isArray(values) || 
            keys.length === 0 || values.length === 0) {
            return "{}";
        }
        
        const dict = {};
        const minLength = Math.min(keys.length, values.length);
        
        for (let i = 0; i < minLength; i++) {
            dict[keys[i]] = values[i];
        }
        
        return JSON.stringify(dict);
        
    } catch (error) {
        return "{}";
    }
}



/**
 * 字典转矩阵 - 支持直接对象格式
 * @param {Object} param - 参数对象
 * @param {*} param.A - 输入字典
 * @returns {string} 输出矩阵 (JSON格式)
 */
DICT_TO_ARRAY_block({ A }) {
    const parseToObject = (input) => {
        if (typeof input !== 'string') return input;
        try {
            // 尝试解析JSON
            return JSON.parse(input);
        } catch (e) {
            // 如果不是JSON，尝试解析对象字面量
            const trimmed = input.trim();
            if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                // 移除大括号
                const content = trimmed.slice(1, -1);
                const pairs = content.split(',');
                const obj = {};
                
                for (const pair of pairs) {
                    const [key, value] = pair.split(':').map(s => s.trim());
                    // 尝试转换为数字
                    obj[key] = isNaN(value) ? value : Number(value);
                }
                return obj;
            }
            return {};
        }
    };

    try {
        let dict = parseToObject(A);
        
        if (typeof dict !== 'object' || dict === null) {
            return "[]";
        }
        
        // 获取所有键和值
        const keys = Object.keys(dict);
        const values = keys.map(key => dict[key]);
        
        // 组合成 [[keys], [values]] 格式
        const result = [keys, values];
        return JSON.stringify(result);
        
    } catch (error) {
        return "[]";
    }
}



/**
 * 字典查找器
 * @param {Object} param - 参数对象
 * @param {*} param.A - 输入字典
 * @param {*} param.B - 查找键值
 * @param {*} param.C - 查找模式 (0=键找值, 1=值找键)
 * @returns {string} 查找结果
 */
DICT_LOOKUP_block({ A, B, C }) {
    try {
        const dict = typeof A === 'string' ? JSON.parse(A) : A;
        const searchValue = B;
        const mode = +C || 0; // 0=键找值, 1=值找键
        
        if (typeof dict !== 'object' || dict === null) {
            return "[]";
        }
        
        switch (mode) {
            case 0: // 键找值
                const result = dict[searchValue];
                return result !== undefined ? JSON.stringify(result) : "[]";
                
            case 1: // 值找键
                const matchingKeys = Object.keys(dict).filter(key => dict[key] === searchValue);
                return JSON.stringify(matchingKeys);
                
            default:
                return "[]";
        }
        
    } catch (error) {
        return "[]";
    }
}


/**
 * 权重量化 - 支持多维数组和可调bit位
 * @param {Object} param - 参数对象
 * @param {*} param.A - 输入权重数组
 * @param {*} param.B - 量化位数 (1-32)
 * @returns {string} 量化后的权重数组 (JSON格式)
 */
WEIGHT_QUANTIZE_block({ A, B }) {
    const parseToArray = (input) => {
        if (typeof input !== 'string') return input;
        try {
            return JSON.parse(input);
        } catch (e) {
            return input.trim().split(/\s+/).map(n => +n || 0);
        }
    };

    // 递归量化函数
    const quantizeRecursive = (arr, bits) => {
        if (!Array.isArray(arr)) {
            // 如果是数字，进行量化
            const maxVal = Math.pow(2, bits - 1) - 1;
            const minVal = -Math.pow(2, bits - 1);
            const scale = Math.pow(2, bits - 1);
            
            // 量化到指定位数
            const quantized = Math.round(arr * scale) / scale;
            
            // 确保在范围内
            return Math.max(minVal, Math.min(maxVal, quantized));
        }
        
        // 如果是数组，递归处理每个元素
        return arr.map(item => quantizeRecursive(item, bits));
    };

    try {
        const weights = parseToArray(A);
        const bits = Math.max(1, Math.min(32, Math.floor(+B || 8))); // 限制在1-32位
        
        if (!Array.isArray(weights)) {
            return "[]";
        }
        
        // 执行量化
        const quantizedWeights = quantizeRecursive(weights, bits);
        
        return JSON.stringify(quantizedWeights);
        
    } catch (error) {
        return "[]";
    }
}
/**
 * 限制浮点位数 - 基础版
 * @param {Object} param - 参数对象
 * @param {*} param.A - 输入数组
 * @param {*} param.B - 保留的小数位数
 * @returns {string} 处理后的数组 (JSON格式)
 */
FLOAT_PRECISION_block({ A, B }) {
    const parseToArray = (input) => {
        if (typeof input !== 'string') return input;
        try {
            return JSON.parse(input);
        } catch (e) {
            return input.trim().split(/\s+/).map(n => +n || 0);
        }
    };

    // 递归处理函数
    const limitPrecision = (arr, precision) => {
        if (!Array.isArray(arr)) {
            // 如果是数字，限制小数位数
            const factor = Math.pow(10, precision);
            return Math.round(arr * factor) / factor;
        }
        
        // 如果是数组，递归处理每个元素
        return arr.map(item => limitPrecision(item, precision));
    };

    try {
        const array = parseToArray(A);
        const precision = Math.max(0, Math.floor(+B || 2)); // 默认保留2位小数
        
        if (!Array.isArray(array)) {
            return "[]";
        }
        
        // 执行精度限制
        const result = limitPrecision(array, precision);
        
        return JSON.stringify(result);
        
    } catch (error) {
        return "[]";
    }
}
/**
 * 基于权重的剪枝算法
 * @param {Object} param - 参数对象
 * @param {*} param.A - 权重数组
 * @param {*} param.B - 剪枝阈值 (0-1之间)
 * @returns {string} 剪枝后的权重数组 (JSON格式)
 */
WEIGHT_PRUNING_block({ A, B }) {
    const parseToArray = (input) => {
        if (typeof input !== 'string') return input;
        try {
            return JSON.parse(input);
        } catch (e) {
            return input.trim().split(/\s+/).map(n => +n || 0);
        }
    };

    // 递归剪枝函数
    const pruneWeights = (arr, threshold) => {
        if (!Array.isArray(arr)) {
            // 如果是权重，根据绝对值大小决定是否剪枝
            return Math.abs(arr) >= threshold ? arr : 0;
        }
        
        // 如果是数组，递归处理每个元素
        return arr.map(item => pruneWeights(item, threshold));
    };

    try {
        const weights = parseToArray(A);
        const threshold = Math.max(0, Math.min(1, Math.abs(+B || 0.5))); // 限制在0-1之间
        
        if (!Array.isArray(weights)) {
            return "[]";
        }
        
        // 执行剪枝
        const prunedWeights = pruneWeights(weights, threshold);
        
        return JSON.stringify(prunedWeights);
        
    } catch (error) {
        return "[]";
    }
}

/**
 * 基于激活的剪枝算法
 * @param {Object} param - 参数对象
 * @param {*} param.A - 激活值数组
 * @param {*} param.B - 剪枝阈值 (0-1之间)
 * @param {*} param.C - 剪枝模式 (0=输出剪枝, 1=输入剪枝)
 * @returns {string} 剪枝信息 (JSON格式)
 */
ACTIVATION_PRUNING_block({ A, B, C }) {
    const parseToArray = (input) => {
        if (typeof input !== 'string') return input;
        try {
            return JSON.parse(input);
        } catch (e) {
            return input.trim().split(/\s+/).map(n => +n || 0);
        }
    };

    try {
        const activations = parseToArray(A);
        const threshold = Math.max(0, Math.min(1, Math.abs(+B || 0.1))); // 限制在0-1之间
        const mode = +C || 0; // 0=输出剪枝, 1=输入剪枝
        
        if (!Array.isArray(activations)) {
            return "[]";
        }
        
        // 计算每个神经元的平均激活值
        const neuronActivations = [];
        for (let i = 0; i < activations.length; i++) {
            const neuron = activations[i];
            if (Array.isArray(neuron)) {
                // 计算该神经元在所有样本上的平均激活值
                const avgActivation = neuron.reduce((sum, val) => sum + Math.abs(val), 0) / neuron.length;
                neuronActivations.push(avgActivation);
            } else {
                neuronActivations.push(Math.abs(neuron));
            }
        }
        
        // 确定要剪枝的神经元索引
        const prunedIndices = [];
        neuronActivations.forEach((avgAct, index) => {
            if (avgAct < threshold) {
                prunedIndices.push(index);
            }
        });
        
        // 返回剪枝信息
        return JSON.stringify({
            prunedIndices: prunedIndices,
            prunedCount: prunedIndices.length,
            totalNeurons: neuronActivations.length,
            pruningRatio: (prunedIndices.length / neuronActivations.length).toFixed(4),
            mode: mode === 0 ? "output" : "input"
        });
        
    } catch (error) {
        return "[]";
    }
}

/**
 * 结构化剪枝算法 - 综合权重和激活信息
 * @param {Object} param - 参数对象
 * @param {*} param.A - 权重数组
 * @param {*} param.B - 激活值数组
 * @param {*} param.C - 权重剪枝阈值 (0-1之间)
 * @param {*} param.D - 激活剪枝阈值 (0-1之间)
 * @returns {string} 剪枝结果 (JSON格式)
 */
STRUCTURED_PRUNING_block({ A, B, C, D }) {
    const parseToArray = (input) => {
        if (typeof input !== 'string') return input;
        try {
            return JSON.parse(input);
        } catch (e) {
            return input.trim().split(/\s+/).map(n => +n || 0);
        }
    };

    try {
        const weights = parseToArray(A);
        const activations = parseToArray(B);
        const weightThreshold = Math.max(0, Math.min(1, Math.abs(+C || 0.5)));
        const activationThreshold = Math.max(0, Math.min(1, Math.abs(+D || 0.1)));
        
        if (!Array.isArray(weights) || !Array.isArray(activations)) {
            return "[]";
        }
        
        // 计算每个神经元的重要性分数
        const neuronImportance = [];
        for (let i = 0; i < weights.length; i++) {
            const weightNeuron = weights[i];
            const activationNeuron = activations[i];
            
            let weightScore = 0;
            let activationScore = 0;
            
            // 计算权重分数（L1范数）
            if (Array.isArray(weightNeuron)) {
                weightScore = weightNeuron.reduce((sum, w) => sum + Math.abs(w), 0) / weightNeuron.length;
            } else {
                weightScore = Math.abs(weightNeuron);
            }
            
            // 计算激活分数
            if (Array.isArray(activationNeuron)) {
                activationScore = activationNeuron.reduce((sum, a) => sum + Math.abs(a), 0) / activationNeuron.length;
            } else {
                activationScore = Math.abs(activationNeuron);
            }
            
            // 综合分数（可以调整权重）
            neuronImportance.push({
                index: i,
                score: weightScore * 0.5 + activationScore * 0.5,
                weightScore: weightScore,
                activationScore: activationScore
            });
        }
        
        // 确定要剪枝的神经元
        const prunedNeurons = neuronImportance.filter(neuron => 
            neuron.weightScore < weightThreshold || neuron.activationScore < activationThreshold
        );
        
        // 执行剪枝
        const prunedWeights = weights.map((neuron, index) => {
            const shouldPrune = prunedNeurons.some(pn => pn.index === index);
            if (shouldPrune) {
                return Array.isArray(neuron) ? neuron.map(() => 0) : 0;
            }
            return neuron;
        });
        
        // 返回剪枝结果
        return JSON.stringify({
            prunedWeights: prunedWeights,
            prunedNeurons: prunedNeurons,
            prunedCount: prunedNeurons.length,
            totalNeurons: neuronImportance.length,
            pruningRatio: (prunedNeurons.length / neuronImportance.length).toFixed(4),
            weightThreshold: weightThreshold,
            activationThreshold: activationThreshold
        });
        
    } catch (error) {
        return "[]";
    }
}



/**
 * 根据梯度和优化器类型更新权重
 * @param {Object} param - 参数对象
 * @param {*} param.A - 当前权重张量（JSON字符串或数组）
 * @param {*} param.B - 对应梯度张量（来自 MSE/CE/Huber）
 * @param {*} param.C - 优化器类型 ("SGD" 或 "Adam")
 * @param {*} param.D - 学习率，默认 0.01
 * @param {*} param.E - 可选参数（Adam用 β₁, β₂, state；SGD用 momentum）
 * @returns {string} 更新后的权重张量（JSON格式） + 新状态 { weights: "...", state: { m: [...], v: [...], t: 2 } }
 */
UPDATE_WEIGHTS_block({ A, B, C, D, E }) {
    const parseToArray = (input) => {
        if (typeof input !== 'string') return input;
        try {
            return JSON.parse(input);
        } catch (e) {
            return input.trim().split(/\s+/).map(n => +n || 0);
        }
    };

    const flatten = (arr) => {
        const result = [];
        const stack = [arr];
        while (stack.length) {
            const current = stack.pop();
            if (Array.isArray(current)) {
                for (let i = current.length - 1; i >= 0; i--) {
                    stack.push(current[i]);
                }
            } else {
                result.push(current);
            }
        }
        return result;
    };

    const reshape = (arr, dims) => {
        if (dims.length === 1) return arr.slice(0, dims[0]);
        
        const result = [];
        const size = dims.slice(1).reduce((a, b) => a * b, 1);
        
        for (let i = 0; i < dims[0]; i++) {
            result.push(reshape(arr.slice(i * size, (i + 1) * size), dims.slice(1)));
        }
        return result;
    };

    try {
        // 解析输入
        const weights = parseToArray(A);
        const gradients = parseToArray(B);
        const optimizer = String(C || "SGD").toUpperCase();
        const lr = parseFloat(D) || 0.01;

        // 获取维度信息
        const getDims = (arr) => {
            const dims = [];
            let current = arr;
            while (Array.isArray(current)) {
                dims.push(current.length);
                current = current[0];
            }
            return dims;
        };

        const dimsWeights = getDims(weights);
        const dimsGradients = getDims(gradients);

        // 维度检查
        if (dimsWeights.length !== dimsGradients.length ||
            dimsWeights.some((d, i) => d !== dimsGradients[i])) {
            return JSON.stringify({ weights: "[]", state: null });
        }

        // 扁平化处理
        const flatWeights = flatten(weights);
        const flatGradients = flatten(gradients);
        const n = flatWeights.length;

        // 初始化超参数
        let beta1 = 0.9, beta2 = 0.999, momentum = 0;
        let m_arr = new Array(n).fill(0);
        let v_arr = new Array(n).fill(0);
        let t = 1;

        if (optimizer === "ADAM") {
            beta1 = Math.max(0.01, Math.min(0.999, parseFloat(E?.beta1) || 0.9));
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
        }

        // 更新权重
        const updatedWeights = new Array(n);
        const new_m = new Array(n);
        const new_v = new Array(n);

        for (let i = 0; i < n; i++) {
            const grad = flatGradients[i];

            if (optimizer === "SGD") {
                updatedWeights[i] = flatWeights[i] - lr * grad;
            } else if (optimizer === "ADAM") {
                // 更新一阶和二阶动量
                const new_m_i = beta1 * m_arr[i] + (1 - beta1) * grad;
                const new_v_i = beta2 * v_arr[i] + (1 - beta2) * grad * grad;

                new_m[i] = new_m_i;
                new_v[i] = new_v_i;

                // 偏差校正
                const m_hat = new_m_i / (1 - Math.pow(beta1, t));
                const v_hat = new_v_i / (1 - Math.pow(beta2, t));

                updatedWeights[i] = flatWeights[i] - lr * m_hat / (Math.sqrt(v_hat) + 1e-8);
            } else {
                updatedWeights[i] = flatWeights[i] - lr * grad;
            }
        }

        // 重塑回原始形状
        const finalWeights = reshape(updatedWeights, dimsWeights);
        const newState = optimizer === "ADAM"
            ? { m: new_m, v: new_v, t: t }
            : null;

        // 返回 JSON：包含权重和新状态（便于下一次调用）
        return JSON.stringify({
            weights: finalWeights,
            state: newState
        });

    } catch (error) {
        console.error("UPDATE_WEIGHTS_block error:", error.message);
        return JSON.stringify({ weights: "[]", state: null });
    }
}//LoveAsuka制作
/**
 * 根据偏置梯度更新偏置项（SGD优化）
 * @param {Object} param - 参数对象
 * @param {*} param.A - 当前偏置张量（JSON字符串或数组）
 * @param {*} param.B - 偏置梯度（来自 BIAS_GRADIENT_block）
 * @param {*} param.C - 学习率，默认 0.01
 * @returns {string} 更新后的偏置张量（JSON格式）
 */
UPDATE_BIAS_block({ A, B, C }) {
    const parseToArray = (input) => {
        if (typeof input !== 'string') return input;
        try {
            return JSON.parse(input);
        } catch (e) {
            return input.trim().split(/\s+/).map(n => +n || 0);
        }
    };

    const flatten = (arr) => {
        const result = [];
        const stack = [arr];
        while (stack.length) {
            const current = stack.pop();
            if (Array.isArray(current)) {
                for (let i = current.length - 1; i >= 0; i--) {
                    stack.push(current[i]);
                }
            } else {
                result.push(current);
            }
        }
        return result;
    };

    const reshape = (arr, dims) => {
        if (dims.length === 1) return arr.slice(0, dims[0]);
        
        const result = [];
        const size = dims.slice(1).reduce((a, b) => a * b, 1);
        
        for (let i = 0; i < dims[0]; i++) {
            result.push(reshape(arr.slice(i * size, (i + 1) * size), dims.slice(1)));
        }
        return result;
    };

    try {
        // 解析输入
        const bias = parseToArray(A);
        const grad = parseToArray(B);
        const lr = parseFloat(C) || 0.01;

        // 获取维度信息
        const getDims = (arr) => {
            const dims = [];
            let current = arr;
            while (Array.isArray(current)) {
                dims.push(current.length);
                current = current[0];
            }
            return dims;
        };

        const dimsBias = getDims(bias);
        const dimsGrad = getDims(grad);

        // 维度检查：必须完全一致
        if (dimsBias.length !== dimsGrad.length ||
            dimsBias.some((d, i) => d !== dimsGrad[i])) {
            return "[]"; // 不匹配则返回空数组
        }

        // 扁平化处理
        const flatBias = flatten(bias);
        const flatGrad = flatten(grad);
        const n = flatBias.length;

        // SGD 更新：b_new = b_old - lr * grad_b
        const updatedBias = new Array(n);
        for (let i = 0; i < n; i++) {
            updatedBias[i] = flatBias[i] - lr * flatGrad[i];
        }

        // 重塑回原始形状
        return JSON.stringify(reshape(updatedBias, dimsBias));

    } catch (error) {
        console.error("UPDATE_BIAS_block error:", error.message);
        return "[]";
    }
}//LoveAsuka制作

/**
 * 数组合并和拆分器
 * @param {Object} param - 参数对象
 * @param {*} param.A - 功能选择 ("合并"/"拆分")
 * @param {*} param.B - 任意维度数组1
 * @param {*} param.C - 任意维度数组2 (合并时使用)
 * @param {*} param.D - 拆分维度中第几个 (拆分时使用)
 * @returns {string} 处理结果 (JSON格式)
 */
ARRAY_MERGE_SPLIT_block({ A, B, C, D }) {
    const parseToArray = (input) => {
        if (typeof input !== 'string') return input;
        try {
            return JSON.parse(input);
        } catch (e) {
            return input.trim().split(/\s+/).map(n => +n || 0);
        }
    };

    // 获取数组维度
    const getDimensions = (arr) => {
        const dims = [];
        let current = arr;
        while (Array.isArray(current)) {
            dims.push(current.length);
            current = current[0];
        }
        return dims;
    };

    // 合并两个数组
    const mergeArrays = (arr1, arr2) => {
        const dims1 = getDimensions(arr1);
        const dims2 = getDimensions(arr2);
        
        // 检查维度是否匹配（除了第一维）
        if (dims1.length !== dims2.length || 
            dims1.slice(1).some((d, i) => d !== dims2[i + 1])) {
            return arr1; // 如果不匹配，返回原数组
        }
        
        // 合并数组
        return [...arr1, ...arr2];
    };

    // 拆分数组
    const splitArray = (arr, splitIndex) => {
        if (!Array.isArray(arr)) return arr;
        
        const dims = getDimensions(arr);
        if (dims.length === 0) return arr;
        
        // 检查拆分索引是否有效
        if (splitIndex < 0 || splitIndex >= dims[0]) {
            return arr;
        }
        
        // 执行拆分
        return arr[splitIndex];
    };

    try {
        const mode = String(A || "").toLowerCase();
        const array1 = parseToArray(B);
        const array2 = C ? parseToArray(C) : null;
        const splitIndex = Math.max(0, Math.floor(+D || 0));

        switch (mode) {
            case "合并":
                if (!array2) {
                    return "[]";
                }
                const merged = mergeArrays(array1, array2);
                return JSON.stringify(merged);
                
            case "拆分":
                const split = splitArray(array1, splitIndex);
                return JSON.stringify(split);
                
            default:
                return "[]";
        }
        
    } catch (error) {
        return "[]";
    }
}
/**
 * 数组加壳和拆壳器 - 支持多层拆壳
 * @param {Object} param - 参数对象
 * @param {*} param.A - 功能选择 ("加壳"/"拆壳")
 * @param {*} param.B - 输入数组
 * @param {*} param.C - 加壳层数/拆壳层数
 * @returns {string} 处理结果 (JSON格式)
 */
ARRAY_SHELL_block({ A, B, C }) {
    const parseToArray = (input) => {
        if (typeof input !== 'string') return input;
        try {
            return JSON.parse(input);
        } catch (e) {
            return input.trim().split(/\s+/).map(n => +n || 0);
        }
    };

    // 数组加壳函数
    const addShell = (arr, layers) => {
        let result = arr;
        for (let i = 0; i < layers; i++) {
            result = [result];
        }
        return result;
    };

    // 数组拆壳函数 - 支持多层拆壳
    const removeShell = (arr, layers) => {
        let result = arr;
        
        for (let i = 0; i < layers; i++) {
            // 检查是否可以拆壳
            if (!Array.isArray(result)) {
                return result;
            }
            
            // 检查是否所有元素都是数组
            const allArrays = result.every(item => Array.isArray(item));
            if (!allArrays) {
                return result;
            }
            
            // 检查是否所有子数组长度相同
            const firstLength = result[0].length;
            const sameLength = result.every(item => item.length === firstLength);
            if (!sameLength) {
                return result;
            }
            
            // 执行拆壳
            const temp = [];
            for (const item of result) {
                if (Array.isArray(item)) {
                    temp.push(...item);
                } else {
                    temp.push(item);
                }
            }
            result = temp;
        }
        
        return result;
    };

    try {
        const mode = String(A || "").toLowerCase();
        const array = parseToArray(B);
        const layers = Math.max(0, Math.floor(+C || 1));

        switch (mode) {
            case "加壳":
                const shelled = addShell(array, layers);
                return JSON.stringify(shelled);
                
            case "拆壳":
                const unshelled = removeShell(array, layers);
                return JSON.stringify(unshelled);
                
            default:
                return "[]";
        }
        
    } catch (error) {
        return "[]";
    }
}
/**
 * 张量部分转置器
 * @param {Object} param - 参数对象
 * @param {*} param.A - 输入张量
 * @param {*} param.B - 要转置的维度索引1
 * @param {*} param.C - 要转置的维度索引2
 * @returns {string} 转置后的张量 (JSON格式)
 */
TENSOR_TRANSPOSE_block({ A, B, C }) {
    const parseToArray = (input) => {
        if (typeof input !== 'string') return input;
        try {
            return JSON.parse(input);
        } catch (e) {
            return input.trim().split(/\s+/).map(n => +n || 0);
        }
    };

    // 获取张量维度
    const getDimensions = (tensor) => {
        const dims = [];
        let current = tensor;
        while (Array.isArray(current)) {
            dims.push(current.length);
            current = current[0];
        }
        return dims;
    };

    // 扁平化张量
    const flatten = (tensor) => {
        const result = [];
        const stack = [tensor];
        while (stack.length) {
            const current = stack.pop();
            if (Array.isArray(current)) {
                for (let i = current.length - 1; i >= 0; i--) {
                    stack.push(current[i]);
                }
            } else {
                result.push(current);
            }
        }
        return result;
    };

    // 重塑张量
    const reshape = (arr, dims) => {
        if (dims.length === 1) return arr.slice(0, dims[0]);
        
        const result = [];
        const size = dims.slice(1).reduce((a, b) => a * b, 1);
        
        for (let i = 0; i < dims[0]; i++) {
            result.push(reshape(arr.slice(i * size, (i + 1) * size), dims.slice(1)));
        }
        return result;
    };

    // 张量转置函数
    const transpose = (tensor, dim1, dim2) => {
        const dims = getDimensions(tensor);
        
        // 验证维度索引
        if (dim1 < 0 || dim1 >= dims.length || dim2 < 0 || dim2 >= dims.length) {
            return tensor;
        }
        
        if (dim1 === dim2) {
            return tensor;
        }
        
        // 计算新的维度顺序
        const newDims = [...dims];
        newDims[dim1] = dims[dim2];
        newDims[dim2] = dims[dim1];
        
        // 扁平化张量
        const flatTensor = flatten(tensor);
        
        // 计算转置后的索引映射
        const totalSize = dims.reduce((a, b) => a * b, 1);
        const result = new Array(totalSize);
        
        // 计算每个维度的步长
        const strides = [];
        let stride = 1;
        for (let i = dims.length - 1; i >= 0; i--) {
            strides[i] = stride;
            stride *= dims[i];
        }
        
        // 计算新维度的步长
        const newStrides = [];
        stride = 1;
        for (let i = newDims.length - 1; i >= 0; i--) {
            newStrides[i] = stride;
            stride *= newDims[i];
        }
        
        // 计算转置后的索引
        for (let i = 0; i < totalSize; i++) {
            // 计算原始索引
            let originalIndex = 0;
            let temp = i;
            for (let j = 0; j < dims.length; j++) {
                originalIndex += (temp % newDims[j]) * strides[j];
                temp = Math.floor(temp / newDims[j]);
            }
            
            result[i] = flatTensor[originalIndex];
        }
        
        // 重塑为新的维度
        return reshape(result, newDims);
    };

    try {
        const tensor = parseToArray(A);
        const dim1 = Math.max(0, Math.floor(+B || 0));
        const dim2 = Math.max(0, Math.floor(+C || 0));
        
        if (!Array.isArray(tensor)) {
            return "[]";
        }
        
        // 执行转置
        const transposed = transpose(tensor, dim1, dim2);
        return JSON.stringify(transposed);
        
    } catch (error) {
        return "[]";
    }
}
/**
 * 文本查找替换器 - 完全文本版本
 * @param {Object} param - 参数对象
 * @param {*} param.A - 输入文本（可以是数组，会转换为字符串）
 * @param {*} param.B - 要查找的内容
 * @param {*} param.C - 替换的内容
 * @param {*} param.D - 匹配模式 ("全局"/"单个")
 * @returns {string} 处理后的文本
 */
FIND_REPLACE_block({ A, B, C, D }) {
    try {
        // 将输入转换为字符串
        let text;
        if (typeof A === 'string') {
            text = A;
        } else {
            try {
                // 如果是数组，直接转换为字符串（保持原样）
                text = JSON.stringify(A);
            } catch (e) {
                // 如果转换失败，尝试其他方式
                text = String(A);
            }
        }

        const findStr = String(B || "");
        const replaceStr = String(C || "");
        const matchMode = String(D || "");

        // 根据匹配模式执行替换
        let result;
        if (matchMode === "全局") {
            // 全局替换：使用split和join
            result = text.split(findStr).join(replaceStr);
        } else {
            // 单个替换：使用replace
            result = text.replace(findStr, replaceStr);
        }

        return result;

    } catch (error) {
        // 出错时返回原文本
        return typeof A === 'string' ? A : JSON.stringify(A);
    }
}
















































    // 将列表转换为数组字符串
    getListArray(args, util) {
      const list = getVarObjectFromName(
        Scratch.Cast.toString(args.LIST),
        util,
        "list"
      );
      if (!list) return "";
      return JSON.stringify(list.value);
    }

    // 将数组设置为列表
    setListArray(args, util) {
      const list = getVarObjectFromName(
        Scratch.Cast.toString(args.LIST),
        util,
        "list"
      );
      if (!list) return;

      let array;
      try {
        array = JSON.parse(args.ARRAY);
      } catch (error) {
        return;
      }

      if (!Array.isArray(array)) return;
      const newArray = array;
      list.value = newArray;
      list._monitorUpToDate = false;
    }

    // 获取所有列表
    _getLists() {
      // @ts-expect-error - Blockly 尚未类型化
      const lists =
        typeof Blockly === "undefined"
          ? []
          : Blockly.getMainWorkspace()
              .getVariableMap()
              .getVariablesOfType("list")
              .map((model) => model.name);
      if (lists.length > 0) {
        return lists;
      } else {
        return [""];
      }
    }
  }//这个傻逼东西兼容浪费我几个钟

  // 向Scratch注册这个扩展
  Scratch.extensions.register(new ScratchSlzs());
})(Scratch);
//写这么长我也是服