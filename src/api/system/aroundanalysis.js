import request from '@/utils/request'

//查询隐患点
export function getSlide() {
    return request({
        url: '/hide/getSlide',
        method: 'get'
    })
}

export function getFlow() {
    return request({
        url: '/hide/getFlow',
        method: 'get'
    })
}

export function getRisk() {
    return request({
        url: '/risk/villages',
        method: 'get'
    })
}