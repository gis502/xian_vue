import request from "@/utils/request.js";


// 获取风险区数据
export function getGeologicalDisasterRiskList() {
    return request({
        url: '/risk/villages',
        method: 'get',
    });
}
