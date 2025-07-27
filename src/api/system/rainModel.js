import request from "@/utils/request.js";

// 触发暴雨
export function rainSlideTrigger(data) {
    return request({
        url: '/model/rainSlideTrigger',
        method: 'post',
        data: data
    });
}

// 更新参数
export function rainSlideFactorUpdata(data) {
    return request({
        url: '/model/rainSlideFactorUpdata',
        method: 'post',
        data: data
    });
}
