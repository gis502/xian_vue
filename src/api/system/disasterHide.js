import request from "@/utils/request.js";


// 获取滑坡隐患点数据
export function getGeologicalDisasterHideByLandSlideList() {
    return request({
        url: '/hide/slide',
        method: 'get',
    });
}

// 获取泥石流隐患点数据
export function getGeologicalDisasterHideByFlowList() {
    return request({
        url: '/hide/flow',
        method: 'get',
    });
}
