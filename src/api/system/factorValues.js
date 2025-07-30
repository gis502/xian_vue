import request from "@/utils/request.js";

// 获取致灾因子可选值
export function getFactorValueList() {
    return request({
        url: '/factor/type',
        method: 'get',
        timeout:50000
    });
}
