import request from "@/utils/request.js";

export function rainSlideTrigger(data) {
    return request({
        url: '/model/rain/trigger',
        method: 'post',
        data: data,
        timeout:50000
    });
}

export function rainSlideFactorUpdata(data) {
    return request({
        url: '/model/rainSlideFactorUpdata',
        method: 'post',
        data: data,
        timeout:50000
    });
}
export function saveRain(data) {
    return request({
        url: '/XianDisasterRain/saver/rain',
        method: 'post',
        data: data,
    });
}

// 获取雷达云图
export function getRadarData() {
    return request({
        url: '/radar/latest',
        method: 'get'
    })
}
