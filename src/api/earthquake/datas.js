/*
 * 地震加载中相关数据
 * 此处为静态数据，后续从后端获取相关数据
 */
// 致灾因子数据
export const hazardsDatas = [
  {
    label: "高程", // 标签
    name: "elevation", // 表单名称，与后端字段名一致
    value: 1000, // 默认值
    unit: "米", // 单位
    type: "input.number", // 表单类型，input表示输入框，number表示数字输入框
    isModified: true, // 是否可以修改
  },
  {
    label: "坡度",
    name: "slope",
    value: 10,
    unit: "度",
    type: "input.number",
    isModified: true,
  },
  {
    label: "岩土类型",
    name: "rockType",
    value: "沙岩",
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
    label: "断层距离",
    name: "breakDistance",
    value: 10,
    unit: "米",
    type: "input.number",
    isModified: true,
  },
  {
    label: "土地利用类型",
    name: "landUseType",
    value: "人工地",
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
    label: "水系距离",
    name: "waterDistance",
    value: 10,
    unit: "米",
    type: "input.number",
    isModified: true,
  },
  {
    label: "降雨量",
    name: "rainfall",
    value: 10,
    unit: "mm",
    type: "input.number",
    isModified: true,
  },
  {
    label: "植被覆盖率",
    name: "vegetationCoverage",
    value: 10,
    unit: "%",
    type: "input.number",
    isModified: true,
  },
  {
    label: "坡面曲率",
    name: "slopeCurvature",
    value: 10,
    unit: "%",
    type: "input.number",
    isModified: true,
  },
  {
    label: "土壤沙砾度",
    name: "soilSandDegree",
    value: 10,
    unit: "%",
    type: "input.number",
    isModified: true,
  },
  {
    label: "坡型",
    name: "slopeType",
    value: "凹型",
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
