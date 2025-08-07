import request from "@/utils/request.js";

// ��������
export function rainSlideTrigger(data) {
    return request({
        url: '/model/rainSlideTrigger',
        method: 'post',
        data: data,
        timeout:50000
    });
}

// ���²���
export function rainSlideFactorUpdata(data) {
    return request({
        url: '/model/rainSlideFactorUpdata',
        method: 'post',
        data: data,
        timeout:50000
    });
}
