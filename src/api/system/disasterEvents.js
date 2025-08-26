import request from '@/utils/request'

export function getAllEarthquakeList() {
    return request({
        url: '/XianEarthquakeList/getAllEarthquakeList',
        method: 'get',
    })
}
export function getAllDisasterRain() {
    return request({
        url: '/XianDisasterRain/getAllDisasterRain',
        method: 'get',
    })
}

export function getEarthquakeEventById(data){
    return request({
        url: '/XianEarthquakeList/getEarthquakeEventById',
        method: 'post',
        params:data
    })
}

export function getDisasterRainById(data){
    return request({
        url: '/XianDisasterRain/getDisasterRainById',
        method: 'post',
        params:data
    })
}



export function getRainPeriodInfoByDisasterId(data){
    return request({
        url: '/XianDisasterRain/getRainPeriodInfoByDisasterId',
        method: 'post',
        params:data
    })
}

export function getPlotInfos(query) {
    return request({
        url: '/system/ploy/getplotinfo',
        method: 'get',
        params: query
    })
}
