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