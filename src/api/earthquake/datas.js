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

export const tableData = ref([
  {
    field1: "师村六组1(B1)",
    field2: "陕西省西安市长安区鸣犊街道师村",
    field3: "赵战民",
    field4: "17392247317",
    field5: 109.090619,
    field6: 34.164977,
  },
  {
    field1: "砲里村十组关家(B1)",
    field2: "陕西省西安市长安区砲里街道砲里村",
    field3: "王民利",
    field4: "13892847490",
    field5: 109.142453,
    field6: 34.166387,
  },
  {
    field1: "白庙村七组北侧(B2)",
    field2: "陕西省西安市长安区魏寨街道白庙村",
    field3: "郝旭",
    field4: "15389237891",
    field5: 109.199251,
    field6: 34.107647,
  },
  {
    field1: "郭村六组砖厂(C1)",
    field2: "陕西省西安市长安区鸣犊街道郭村",
    field3: "肖波",
    field4: "13002999944",
    field5: 109.110843,
    field6: 34.152221,
  },
  {
    field1: "三友村七组三联村(B1)",
    field2: "陕西省西安市长安区大兆街道三友村",
    field3: "王利军",
    field4: "15319425419",
    field5: 109.085019,
    field6: 34.14471,
  },
  // 更多数据...
]);

// 不同类型的数据
export const dataTypes = {
  type1: {
    headers: ["风险区名称", "位置", "巡查员姓名", "联系方式"],
    data: [
      {
        field1: "师村六组1(B1)",
        field2: "陕西省西安市长安区鸣犊街道师村",
        field3: "赵战民",
        field4: "17392247317",
        field5: 109.090619,
        field6: 34.164977,
      },
      {
        field1: "砲里村十组关家(B1)",
        field2: "陕西省西安市长安区砲里街道砲里村",
        field3: "王民利",
        field4: "13892847490",
        field5: 109.142453,
        field6: 34.166387,
      },
      {
        field1: "白庙村七组北侧(B2)",
        field2: "陕西省西安市长安区魏寨街道白庙村",
        field3: "郝旭",
        field4: "15389237891",
        field5: 109.199251,
        field6: 34.107647,
      },
      {
        field1: "郭村六组砖厂(C1)",
        field2: "陕西省西安市长安区鸣犊街道郭村",
        field3: "肖波",
        field4: "13002999944",
        field5: 109.110843,
        field6: 34.152221,
      },
      {
        field1: "三友村七组三联村(B1)",
        field2: "陕西省西安市长安区大兆街道三友村",
        field3: "王利军",
        field4: "15319425419",
        field5: 109.085019,
        field6: 34.14471,
      },
    ],
  },
  type2: {
    headers: ["滑坡灾害名称", "位置", "险情等级", "影响面积(m2)"],
    data: [
      {
        field1: "向阳水库滑坡",
        field2: "西安市长安区炮里街道炮里村",
        field3: "小型",
        field4: "5742.99",
        field5: "109.13667",
        field6: "34.17667",
      },
    ],
  },
  type3: {
    headers: ["泥石流灾害名称", "位置", "规模等级", "影响面积"],
    data: [
      // { field1: 'DEV001', field2: '在线', field3: '区域A', field4: '无' },
      // { field1: 'DEV002', field2: '离线', field3: '区域B', field4: '连接中断' },
      // { field1: 'DEV003', field2: '在线', field3: '区域C', field4: '电量低' },
    ],
  },
};

/**
 * 滑坡隐患点数据
 * @returns 滑坡数据
 */
export const landslideHazardPointData = () => {
  // return request({
  //   url: "/hide/allslide",
  //   method: "get",
  // });

  return request({
    url: "/hide/slide",   // 包含致灾因子
    method: "get",
  });
};

/**
 * 泥石流隐患点数据
 * @returns 泥石流数据
 */
export const dataOnHiddenDangerPointsOfDebrisFlow = () => {
  return request({
    url: "/hide/allflow",
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
}

/**
 * 获取模拟点风险概率
 * @param {Array<Object>} points 
 * @returns 
 */
export const obtainTheProbabilityOfSimulatedPointRisk = (points) => {
  return request({
    url: "/risk/probability",
    method: "get",
    params: points,
  });
}