import request from "@/utils/request";

/**
 * 获取模拟点风险概率
 * @param {Array<Object>} points
 * @returns
 */
export async function obtainTheProbabilityOfSimulatedPointRisk(points){
  const datas = [];
  // 记录实体id
  const entityIds = [];
  // 记录点的索引
  const pointIndex = [];
  for (let i = 0; i < points.length; i++) {
    console.log(points[i].factorVoList ,"points[i].factorVoList ")
    // 如果存在致灾因子，则记为参数
    if (points[i].factorVoList == null || points[i].factorVoList.length == 0)
      continue;
    const data = {};
    data.factorVoList = points[i].factorVoList;
    data.entityId = points[i].entityId;
    datas.push(data);
    console.log(datas)

    // 写入实体id
    entityIds.push(points[i].entityId);
    // 写入点位索引
    pointIndex.push(i);
  }
  const res = await request({
    url: "/model/eqSlideTrigger",
    method: "post",
    data: datas,
  });


  // 修改datas中实体id对应的预测值
  res.data.forEach(element => {
    console.log(element,"element")
    // 实体id
    const entityId = element.entityId;
    // 索引
    let index = entityIds.indexOf(entityId);
    // 点位对应的索引
    index = pointIndex[index]; 
    points[index].predict = element.predict;
  });
  return [points, res.data];
};

/**
 * 根据致灾因子获取发生灾害的概率
 * @param {Object} disasterFactor - 致灾因子数据
 * @returns - 概率
 */
export async function getHazardProbability(disasterFactor) {
  const res = await request({
    url: "/model/eqSlideFactorUpdata",
    method: "post",
    data: disasterFactor,
  });
  return res;
}