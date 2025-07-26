import request from "@/utils/request";

/*
 * 地震加载中相关数据
 * 此处为静态数据，后续从后端获取相关数据
 */
// 致灾因子数据
export const staticHazardsDatas = [
  {
    attributeName: "高程", // 标签
    attributeNameAlias: "elevation", // 表单名称，与后端字段名一致
    factorValue: 1000, // 默认值
    unit: "米", // 单位
    type: "input.number", // 表单类型，input表示输入框，number表示数字输入框
    isModified: true, // 是否可以修改
  },
  {
    attributeName: "坡度",
    attributeNameAlias: "slope",
    factorValue: 10,
    unit: "度",
    type: "input.number",
    isModified: true,
  },
  {
    attributeName: "岩土类型",
    attributeNameAlias: "rockType",
    factorValue: "沙岩",
    unit: "",
    type: "select",
    isModified: true,
    options: [
      { label: "沙岩", value: "沙岩" },
      { label: "砾岩", value: "砾岩" },
      // ...
    ],
  },
  {
    attributeName: "断层距离",
    attributeNameAlias: "breakDistance",
    factorValue: 10,
    unit: "米",
    type: "input.number",
    isModified: true,
  },
  {
    attributeName: "土地利用类型",
    attributeNameAlias: "landUseType",
    factorValue: "人工地",
    unit: "",
    type: "select",
    isModified: true,
    options: [
      { label: "人工地", value: "人工地" },
      { label: "自然地", value: "自然地" },
      // ...
    ],
  },
  {
    attributeName: "水系距离",
    attributeNameAlias: "waterDistance",
    factorValue: 10,
    unit: "米",
    type: "input.number",
    isModified: true,
  },
  {
    attributeName: "降雨量",
    attributeNameAlias: "rainfall",
    factorValue: 10,
    unit: "mm",
    type: "input.number",
    isModified: true,
  },
  {
    attributeName: "植被覆盖率",
    attributeNameAlias: "vegetationCoverage",
    factorValue: 10,
    unit: "%",
    type: "input.number",
    isModified: true,
  },
  {
    attributeName: "坡面曲率",
    attributeNameAlias: "slopeCurvature",
    factorValue: 10,
    unit: "%",
    type: "input.number",
    isModified: true,
  },
  {
    attributeName: "土壤沙砾度",
    attributeNameAlias: "soilSandDegree",
    factorValue: 10,
    unit: "%",
    type: "input.number",
    isModified: true,
  },
  {
    attributeName: "坡型",
    attributeNameAlias: "slopeType",
    factorValue: "凹型",
    unit: "",
    type: "select",
    isModified: true,
    options: [
      { label: "凹型", value: "凹型" },
      { label: "凸型", value: "凸型" },
      { label: "直线", value: "直线" },
      { label: "阶梯", value: "阶梯" },
    ],
  },
];

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
