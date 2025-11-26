import {ref} from "vue";

// 记录模拟点信息
export const useSelectedEdge = defineStore("selectedEdge", () => {
    // 各个模拟点
    const edgeFlag = ref("rain");

    return {edgeFlag}
});
