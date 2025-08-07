<template>
  <div class="overlay">
    <div class="factor-panel">
      <div class="factor-list">
        <div
            v-for="(factor, key) in localFactors"
            :key="key"
            class="factor-group"
        >
          <h4 class="factor-title">{{ factor.labelText }}</h4>

          <!-- 区间输入 -->
          <div class="form-item">
            <label>区间分割:</label>
            <input
                v-model="factor.rangeInput"
                type="text"
                :placeholder="`例如 400,700`"
                :readonly="key === 'rockType'"
                :class="{ 'readonly-input': key === 'rockType' }"
            />
          </div>

          <!-- 先验概率输入 -->
          <div class="form-item">
            <label>先验概率:</label>
            <input
                v-model="factor.probInput"
                type="text"
                :placeholder="`对应区间概率，例如 0.3,0.3,0.4`"
            />
          </div>
        </div>
      </div>

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
      factorDefs.forEach(def => {
        const raw = input?.[def.key] || {};
        const range = raw.range?.value || [];
        const prob = raw.probability?.value || [];
        factors[def.key] = {
          labelText: def.labelText,
          rangeInput: range.join(","),
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

        // 解析 range
        const ranges = factor.rangeInput
            .split(",")
            .map(v => Number(v.trim()))
            .filter(v => !isNaN(v))
            .sort((a, b) => a - b);

        if (!isRockType && ranges.length < 1) {
          alert(`因子 "${factor.labelText}" 的区间输入无效，请输入至少两个数值，例如：400,700`);
          return;
        }

        // 解析 probability
        const probs = factor.probInput
            .split(",")
            .map(v => Number(v.trim()))
            .filter(v => !isNaN(v));

        const intervalCount = ranges.length + 1;

        if (!isRockType && probs.length !== intervalCount) {
          alert(`因子 "${factor.labelText}" 的先验概率个数应为 ${intervalCount} 个`);
          return;
        }

        if (probs.length < 1) {
          alert(`因子 "${factor.labelText}" 的概率输入无效`);
          return;
        }

        const probSum = probs.reduce((a, b) => a + b, 0);
        if (Math.abs(probSum - 1) > 0.001) {
          alert(`因子 "${factor.labelText}" 的先验概率之和应为 1`);
          return;
        }

        payload.data[key] = {
          range: ranges,
          probability: probs
        };
      }

      // 发起 POST 请求
      axios.post("http://localhost:8085/model/bayes/change", payload, {
        headers: {
          "Content-Type": "application/json"
        }
      })
          .then(() => {
            alert("提交成功！");
          })
          .catch(err => {
            console.error("提交失败:", err);
            alert("提交失败，请检查参数格式");
          });
    }
  }
};
</script>




<style scoped>
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  padding: 10px;
  z-index: 1000;
}

.factor-panel {
  width: 460px;
  max-height: 50vh;
  background: rgba(255, 255, 255, 0.95);
  padding: 16px 20px;
  border-radius: 8px;
  overflow-y: auto;
  color: #000;
  font-size: 14px;
  position: relative;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  margin-top: 80px;
}

.panel-title {
  position: sticky;
  top: 0;
  padding: 8px 0;
  z-index: 10;  /* 确保在面板其他内容上层 */
  text-align: center;
  font-size: 18px;
  font-weight: bold;
}

.factor-list {
  margin-top: 5px;
}

.factor-group {
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.factor-title {
  font-weight: 600;
  font-size: 15px;
  margin-bottom: 8px;
}

.form-item {
  display: flex;
  flex-direction: column;
  margin-bottom: 6px;
}

.form-item label {
  font-weight: 500;
  margin-bottom: 4px;
  color: #000;
}

.form-item input {
  padding: 6px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: transparent;
  color: #000;
  font-size: 13px;
}

.interval-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-top: 2px;
  color: #000;
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

