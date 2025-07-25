import request from "@/utils/request.js";

export function getGraphData() {
    return request({
        url: '/graph/getGraph', method: 'get',
    });
}

export function getChartDataBy(eqid, disasterType) {
    return request({
        url: '/graph/getGraphBy',
        method: 'get',
        params: {
            eqid: eqid,
            disasterType: disasterType
        }
    });
}

export function getNewsPage(pageNum, pageSize) {
    return request({
        url: '/xian_news/list',
        method: 'get',
        params: { pageNum, pageSize }
    });
}

export function getEarthquakeRainPage(pageNum, pageSize) {
    return request({
        url: '/earthquake-rain/list',
        method: 'get',
        params: { pageNum, pageSize }
    });
}
