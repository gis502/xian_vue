import request from '@/utils/request'

/**
 * 根据致灾因子获取发生灾害的概率
 * @param {Object} disasterFactor - 致灾因子数据 
 * @returns - 概率
 */
export function getHazardProbability(disasterFactor) {
  return request({
    url: '/hazard/getHazardProbability',
    method: 'post',
    params: disasterFactor
  })
}