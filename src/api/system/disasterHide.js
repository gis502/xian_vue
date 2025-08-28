import request from "@/utils/request.js";


// ��ȡ��������������
export function getGeologicalDisasterHideByLandSlideList() {
    return request({
        url: '/hide/slide',
        method: 'get',
        timeout:50000
    });
}

// ��ȡ��ʯ������������
export function getGeologicalDisasterHideByFlowList() {
    return request({
        url: '/hide/flow',
        method: 'get',
        timeout:50000
    });
}

// ��ȡɽ��
export function getGeologicalDisasterAllFlashFloodList(){
    return request({
        url: '/hide/getFlashFlood',
        method: 'get',
        timeout:50000
    });
}

// ��ȡ����
export function getGeologicalDisasterAllWaterList(){
    return request({
        url: '/hide/getWater',
        method: 'get',
        timeout:50000
    });
}

export function queryDisasterEstimationGetAll(data) {
    return request({
        url: '/XianFactorAnalysis/queryDisasterEstimationGetAll',
        method: 'post',
        params:data
    })
}