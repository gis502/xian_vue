import request from '@/utils/request'


// export function getPloy(query) {
//   return request({
//     url: '/system/ploy/geteqploy',
//     method: 'get',
//     params: query
//   })
// }
//
// // 新增标绘图片
// export function addPlotIcon(data) {
//   return request({
//     url: '/system/ploticon/addploticon',
//     method: 'post',
//     data: data
//   })
// }
// // 删除单个标绘图片
// export function deletePlotIcon(uuid) {
//   return request({
//     url: `/system/ploticon/deleteploticon/${uuid}`,
//     method: 'post',
//   })
// }
// // 新增标绘图片
// export function updataPlotIcon(data) {
//   return request({
//     url: '/system/ploticon/updataploticon',
//     method: 'post',
//     data: data
//   })
// }
//
// // 查询全部标绘图片
// export function getPlotIcon() {
//   return request({
//     url: '/system/ploticon/getploticon',
//     method: 'post',
//   })
// }
//
// // 查询全部标绘图片
// export function searchploticon(menuName) {
//   return request({
//     url: '/system/ploticon/searchploticon',
//     method: 'post',
//     params: { menuName }
//   })
// }
// //-------------------------------------------------------------
// export function insertPlotAndInfo(data){
//   return request({
//     url: '/system/ploy/insertplotandinfo',
//     method: 'post',
//     data: data
//   })
// }
//
// export function insertPlotsAndInfo(data){
//   return request({
//     url: '/system/ploy/insertplotsandinfo',
//     method: 'post',
//     data: data
//   })
// }
//
// export function getPlot(query) {
//   return request({
//     url: '/system/ploy/getplot',
//     method: 'get',
//     params: query
//   })
// }



export function selectDisasterRealByDisasterId(data) {
  return request({
    url: '/XianDisasterReal/selectDisasterRealByDisasterId',
    method: 'post',
    params:data
  })
}
export function getExcelPlotInfo(plotIds, plotTypes) {
  const params = {
    plotIds: plotIds,
    plotTypes: plotTypes
  };
  return request({
    url: '/XianDisasterReal/getExcelPlotInfo',
    method: 'post',
    data: JSON.stringify(params),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
export function getPlotInfos(query) {
  return request({
    url: '/XianDisasterReal/getplotinfo',
    method: 'get',
    params: query
  })
}
// export function addPlotInfo(data){
//   return request({
//     url: '/system/ploy/addplotinfo',
//     method: 'post',
//     data: data
//   })
// }
//
// export function deletePlotAndInfo(query) {
//   return request({
//     url: '/system/ploy/deleteplotandinfo',
//     method: 'get',
//     params: query
//   })
// }
//
// export function deletePlotInfo(query) {
//   return request({
//     url: '/system/ploy/deleteplotinfo',
//     method: 'delete',
//     params: query
//   })
// }
//
// export function updataPlotInfo(params,data){
//   return request({
//     url: '/system/ploy/updataplotinfo',
//     method: 'put',
//     params: params,
//     data: data
//   })
// }
//
//
// export function getPlotwithStartandEndTime(data){
//   return request({
//     url: '/system/ploy/getplotswithtime' ,
//     method: 'post',
//     params:data
//   })
// }
//
//
// export function getPlotBelongCounty(data){
//   return request({
//     url: '/system/ploy/getPlotBelongCounty' ,
//     method: 'post',
//     params:data
//   })
// }