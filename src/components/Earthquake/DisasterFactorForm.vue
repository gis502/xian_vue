<template>
  <div class="overlay">
    <div class="factor-panel">
      <table class="factor-table">
        <thead>
        <tr>
          <th>序号</th>
          <th>致灾因子</th>
          <th>区间</th>
          <th>权重</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="(factor, key, index) in localFactors" :key="key">
          <td>{{ index + 1 }}</td>
          <td>{{ factor.labelText }}</td>
          <td>
            <input
                v-model="factor.rangeInput"
                type="text"
                :readonly="key === 'rockType'"
                :class="{ 'readonly-input': key === 'rockType' }"
                placeholder="例如 小于400,400-700,大于700 或 400,700"
            />
          </td>
          <td>
            <input
                v-model="factor.probInput"
                type="text"
                placeholder="例如 0.3,0.3,0.4"
            />
          </td>
        </tr>
        </tbody>
      </table>

      <div class="button-group">
        <button @click="handleSubmit" class="btn-confirm">提交</button>
        <button @click="$emit('cancel')" class="btn-cancel">取消</button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "DisasterFactorForm",
  props: {
    value: Object
  },
  data() {
    return {
      localFactors: {} // 初始化
    };
  },
  mounted() {
    // 获取初始数据
    axios
        .get("http://localhost:8085/model/bayes/grade")
        .then((response) => {
          const data = response.data;
          this.localFactors = this.initializeFactors(data);
        })
        .catch((error) => {
          console.error("获取因子数据失败:", error);
          alert("获取因子数据失败");
        });
  },
  methods: {
    // 将后端的数值分割点转换为展示字符串：例如 [400,700] -> "小于400,400-700,大于700"
    formatRangeForDisplay(ranges) {
      if (!Array.isArray(ranges) || ranges.length === 0) return "";
      const parts = [];
      parts.push(`小于${ranges[0]}`);
      for (let i = 0; i < ranges.length - 1; i++) {
        parts.push(`${ranges[i]}-${ranges[i + 1]}`);
      }
      parts.push(`大于${ranges[ranges.length - 1]}`);
      return parts.join(",");
    },

    // 修复后的解析：从任意展示文本中提取所有数字（全局匹配），去重并排序
    // 例如 "小于400,400-700,大于700" 或 "400,700" 都会得到 [400,700]
    parseDisplayToRange(displayText) {
      if (!displayText || typeof displayText !== "string") return [];
      // 全局匹配所有数 (支持整数或小数)
      const matches = displayText.match(/\d+(\.\d+)?/g);
      if (!matches) return [];
      const nums = matches.map(Number);
      // 去重并排序
      const unique = Array.from(new Set(nums)).sort((a, b) => a - b);
      return unique;
    },

    initializeFactors(input) {
      const factorDefs = [
        { key: "elevation", labelText: "高程 (m)" },
        { key: "slope", labelText: "坡度 (°)" },
        { key: "waterDistance", labelText: "距河道距离 (m)" },
        { key: "vegetationCoverage", labelText: "植被覆盖率 (%)" },
        { key: "rainfall", labelText: "小时降雨量 (mm)" },
        { key: "duration", labelText: "持续时间 (小时)" },
        { key: "rockType", labelText: "岩体性质" }
      ];

      const factors = {};
      factorDefs.forEach((def) => {
        // 如果后端返回是 { data: { ... } } 的形式，请替换 input?.[def.key] 为 input?.data?.[def.key]
        const raw = input?.[def.key] || input?.data?.[def.key] || {};
        const range = raw.range?.value || raw.range || [];
        const prob = raw.probability?.value || raw.probability || [];
        factors[def.key] = {
          labelText: def.labelText,
          // 展示用（带“小于/大于/区间”的友好文本）
          rangeInput: this.formatRangeForDisplay(range),
          // 概率直接以逗号分隔字符串展示/编辑
          probInput: prob.join(",")
        };
      });

      return factors;
    },

    handleSubmit() {
      const payload = { data: {} };

      for (const key in this.localFactors) {
        const factor = this.localFactors[key];
        const isRockType = key === "rockType";

        // 把展示文本解析回纯数字分割点数组
        const ranges = this.parseDisplayToRange(factor.rangeInput);

        // 非 rockType 需要至少一个分割点（会产生两个区间）
        if (!isRockType && ranges.length < 1) {
          alert(`因子 "${factor.labelText}" 的区间输入无效，请输入至少一个分割点，例如：400 或 400,700`);
          return;
        }

        // 解析概率
        const probs = factor.probInput
            .split(",")
            .map((v) => Number(v.trim()))
            .filter((v) => !isNaN(v));

        // 区间数 = 分割点个数 + 1
        const intervalCount = ranges.length + 1;

        if (!isRockType && probs.length !== intervalCount) {
          alert(`因子 "${factor.labelText}" 的先验概率个数应为 ${intervalCount} 个（分割点 ${ranges.length} 个 -> 区间 ${intervalCount} 个）`);
          return;
        }

        if (probs.length < 1) {
          alert(`因子 "${factor.labelText}" 的概率输入无效`);
          return;
        }

        const probSum = probs.reduce((a, b) => a + b, 0);
        if (Math.abs(probSum - 1) > 0.001) {
          alert(`因子 "${factor.labelText}" 的先验概率之和应为 1（当前和=${probSum.toFixed(4)}）`);
          return;
        }

        // 提交时传回纯数字的 ranges（例如 [400,700]），以及概率数组
        payload.data[key] = {
          range: ranges,
          probability: probs
        };
      }

      // 发起 POST 请求（body = { data: { ... } }）
      axios
          .post("http://localhost:8085/model/bayes/change", payload, {
            headers: { "Content-Type": "application/json" }
          })
          .then(() => {
            alert("提交成功！");
          })
          .catch((err) => {
            console.error("提交失败:", err);
            alert("提交失败，请检查参数格式与后端日志");
          });
    }
  }
};
</script>

<style scoped>
.overlay {
  position: fixed;
  top: 0;
  left: 50px;
  width: 100%;
  height: 100%;
  background: transparent;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
  z-index: 1000;
}

.factor-panel {
  width: 800px;
  max-height: 70vh;
  background: rgba(255, 255, 255, 0.95);
  padding: 20px;
  border-radius: 0;
  overflow-y: auto;
  color: #000;
  font-size: 14px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.factor-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  background: white;
}

.factor-table th,
.factor-table td {
  border: 1px solid #ccc;
  padding: 6px 8px;
  text-align: center;
}

.factor-table th {
  background: #f5f5f5;
}

.factor-table input {
  width: 100%;
  padding: 4px 6px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 13px;
}

.button-group {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 12px;
}

.btn-confirm {
  background-color: #67c23a;
  color: white;
  padding: 6px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 13px;
}

.btn-cancel {
  background-color: #f56c6c;
  color: white;
  padding: 6px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 13px;
}

.readonly-input {
  background-color: #f5f5f5;
  cursor: not-allowed;
}
</style>
