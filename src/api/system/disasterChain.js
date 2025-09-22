import request from '@/utils/request'

export function getRain() {
    return request({
        url: '/disasterChain/getRain',
        method: 'get'
    })
}

export function getRainProbability(disasterParam) {
    return request({
        url: '/disasterChain/getRainProbability',
        method: 'post',
        data: disasterParam,
    })
}

export function getEarthQuakeProbability(disasterParam) {
    return request({
        url: '/disasterChain/getEarthQuakeProbability',
        method: 'post',
        data: disasterParam,
    })
}
export function getEarthQuake(){
    return request({
        url: '/disasterChain/getEarthQuake',
        method: 'get'
    })
}