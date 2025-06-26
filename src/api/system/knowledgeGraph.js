import request from "@/utils/request.js";

export function getGraphData() {
    return request({
        url: '/graph/getGraph', method: 'get',
    });
}

export function getChartDataBy(eqid) {
    return request({
        url: '/graph/getGraphBy', method: 'get', params: {eqid: eqid}
    });
}
