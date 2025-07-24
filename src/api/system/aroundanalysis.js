import request from '@/utils/request'

//查询隐患点
export function getHide() {
    return request({
        url: '/around_analysis/getHide',
        method: 'get'
    })
}