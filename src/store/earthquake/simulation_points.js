import { ref, shallowReactive } from "vue";

// 记录模拟点信息
export const useSimulationPointStore = defineStore("simulationPoint", () => {
  // 各个模拟点
  let simulationPoints = shallowReactive([]);

  // 脉冲实体
  let pulseEntities = ref([])

  // 清空模拟点
  function clearSimulationPoints() {
    simulationPoints = [];
  }

  // 清空脉冲实体
  function clearPulseEntities() {
    pulseEntities.value = []
  }

  return {
    simulationPoints,
    pulseEntities,
    clearSimulationPoints,
    clearPulseEntities
  };
});
