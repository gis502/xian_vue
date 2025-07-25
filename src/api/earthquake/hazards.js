import request from "@/utils/request";

/**
 * 根据致灾因子获取发生灾害的概率
 * @param {Object} disasterFactor - 致灾因子数据
 * @returns - 概率
 */
export function getHazardProbability(disasterFactor) {
  return request({
    url: "/hazard/getHazardProbability",
    method: "post",
    params: {
      disasterFactor: encodeURIComponent(JSON.stringify(disasterFactor)),
    },
  });
}

/**
 * 获取模拟点风险概率
 * @param {Array<Object>} points
 * @returns
 */
export const obtainTheProbabilityOfSimulatedPointRisk = (points) => {
  // return request({
  //   url: "/risk/probability",
  //   method: "get",
  //   params: points,
  // });
  console.log(points);
  // 用于测试
  const levels = ["高", "中", "低"];
  points.forEach((point) => {
    point.predict = {
      level: levels[Math.floor(Math.random() * 3)],
      probaility: Math.random() * 100,
    };
  });
  return points;
};
