import request from "@/utils/request.js";

export function getSlide() {
    return request({
        url: '/hide/allslide',
        method: 'get'
    })
}

export function getFlow(){
    return request({
        url: '/hide/allflow',
        method: 'get'
    })
}

export function getRisk(){
    return request({
        url: '/risk/getAllvillages',
        method: 'get'
    })
}

export function getHistoryDisaster(regionName) {
    return request({
        url: '/association/getHistoryDisaster',
        method: 'get',
        params: {
            regionName: regionName
        }
    })
}
