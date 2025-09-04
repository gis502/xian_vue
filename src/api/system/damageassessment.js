import request from "@/utils/request.js";

//获取专题图
export function getEqOutputMaps(queryParams){
    return request({
        url: '/feign/thematic/map',
        method: 'post',
        data: queryParams
    })
}