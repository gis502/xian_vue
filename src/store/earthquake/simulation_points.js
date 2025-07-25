import { ref } from 'vue'

// 记录模拟点信息
export const useSimulationPointStore = defineStore('simulationPoint', () => {
    // 各个模拟点
    let simulationPoints = ref([])

    // 获取所有模拟点
    function getAllSimulationPoints() {
        return simulationPoints.value
    }

    // 清空模拟点
    function clearSimulationPoints() {
        simulationPoints.value = []
    }

    return { simulationPoints, getAllSimulationPoints, clearSimulationPoints }
})