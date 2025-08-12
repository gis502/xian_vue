import request from "@/utils/request.js";


// 获取滑坡隐患点数据
export function getGeologicalDisasterHideByLandSlideList() {
    return request({
        url: '/hide/slide',
        method: 'get',
        timeout:50000
    });
}

// 获取泥石流隐患点数据
export function getGeologicalDisasterHideByFlowList() {
    return request({
        url: '/hide/flow',
        method: 'get',
        timeout:50000
    });
}

// 获取山洪
export function getGeologicalDisasterAllFlashFloodList(){
    return request({
        url: '/hide/getFlashFlood',
        method: 'get',
        timeout:50000
    });
}

// 获取内涝
export function getGeologicalDisasterAllWaterList(){
    return request({
        url: '/hide/getWater',
        method: 'get',
        timeout:50000
    });
}
