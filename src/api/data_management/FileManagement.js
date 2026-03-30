import request from '@/utils/request'

/**
 * 获取灾害列表（支持分页）
 * @param {Object} query - 查询参数
 * @param {number} query.pageNum - 页码
 * @param {number} query.pageSize - 每页数量
 * @param {string} query.disasterType - 灾害类型（可选）rain: 暴雨，earthquake: 地震
 */
export function getDisasterList(query) {
  return request({
    url: '/disaster/file/disasterList',
    method: 'get',
    params: query
  })
}

/**
 * 获取灾害文件列表
 * @param {string} disasterId - 灾害 ID
 * @param {string} disasterType - 灾害类型
 * @param {string} occurrenceTime - 灾害发生时间
 */
export function getFileList(disasterId, disasterType, occurrenceTime) {
  return request({
    url: '/disaster/file/fileList',
    method: 'get',
    params: { disasterId, disasterType, occurrenceTime }
  })
}

/**
 * 删除灾害文件
 * @param {string} disasterId - 灾害 ID
 * @param {string} disasterType - 灾害类型
 */
export function deleteDisasterFiles(disasterId, disasterType) {
  return request({
    url: `/disaster/file/${disasterId}/${disasterType}`,
    method: 'delete'
  })
}

// 灾害类型枚举
export const DisasterType = {
  RAIN: 'rain',
  EARTHQUAKE: 'earthquake'
}

// 文件类型枚举
export const OutputType = {
  MAP: 1,
  REPORT: 2
}
