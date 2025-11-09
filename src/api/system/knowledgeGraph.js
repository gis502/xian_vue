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

export function getNewsPage(pageNum, pageSize, lastItem) {
    return request({
        url: '/xian_news/list',
        method: 'get',
        params: {
            pageNum,
            pageSize,
            lastItem: lastItem ? JSON.stringify(lastItem) : null
        }
    })
}


// 接口函数（POST）
export function getEarthquakeRainPage(data) {
    return request({
        url: '/earthquake-rain/list',
        method: 'post',
        data: data, // 自动转为JSON，axios默认Content-Type为application/json
    });
}

export function getInfoById(id) {
    return request({
        url: '/earthquake-rain/getInfoById',
        method: 'post',
        params: {  // 使用 params 会作为查询参数传递
            id: id
        }
    });
}
