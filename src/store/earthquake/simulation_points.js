import { ref, shallowReactive } from "vue";

// 记录模拟点信息
export const useSimulationPointStore = defineStore("simulationPoint", () => {
  // 各个模拟点
  let simulationPoints = shallowReactive([]);

  // 清空模拟点
  function clearSimulationPoints() {
    simulationPoints.splice(0);
  }

  return {
    simulationPoints,
    clearSimulationPoints
  };
});
