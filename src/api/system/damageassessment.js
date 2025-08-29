import request from "@/utils/request.js";

//获取专题图
export function getEqOutputMaps(queryParams){
    return request({
        url: '/feign/thematic/map',
        method: 'post',
        data: queryParams
    })
}

//获取灾情报告
export function getEqOutputReports(queryParams){
    return request({
        url: '/feign/disaster/report',
        method: 'get',
        data: queryParams
    })
}