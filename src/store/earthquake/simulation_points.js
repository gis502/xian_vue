import { ref, shallowReactive } from "vue";

// 记录模拟点信息
export const useSimulationPointStore = defineStore("simulationPoint", () => {
  // 各个模拟点
  let simulationPoints = shallowReactive([]);

  // 脉冲实体
  let pulseEntities = ref([])

  // 隐患点实体对应脉冲实体id
  let entityCorrespondenceRelationship = ref({})

  // 清空模拟点
  function clearSimulationPoints() {
    simulationPoints = [];
  }

  // 清空脉冲实体
  function clearPulseEntities() {
    pulseEntities.value = []
  }

  // 清除脉冲实体
  function removePulseEntity(id) {
    // 删除数组中的元素
    let index = -1;
    pulseEntities.value.forEach((item) => {
      index += 1;
      if(item == id) {
        pulseEntities.value.splice(index, 1)
      }
    })
  }

  // 删除隐患点对应实体id
  function removeentityCorrespondenceRelationship(id) {
    delete entityCorrespondenceRelationship.value[id];
  }

  return {
    simulationPoints,
    pulseEntities,
    entityCorrespondenceRelationship,
    clearSimulationPoints,
    clearPulseEntities,
    removePulseEntity,
    removeentityCorrespondenceRelationship
  };
});
