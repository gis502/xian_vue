import request from "@/utils/request";

/**
 * 滑坡隐患点数据
 * @returns 滑坡数据
 */
export const landslideHazardPointData = () => {
  return request({
    url: "/hide/slide",
    method: "get",
  });
};

/**
 * 泥石流隐患点数据
 * @returns 泥石流数据
 */
export const dataOnHiddenDangerPointsOfDebrisFlow = () => {
  return request({
    url: "/hide/flow",
    method: "get",
  });
};

/**
 * 风险村庄数据
 * @returns 危险点数据
 */
export const riskVillageData = () => {
  return request({
    url: "/risk/villages",
    method: "get",
  });
};
