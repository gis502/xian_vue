<template>
  <div class="content-body">

    <div class="closeAll">
      <button @click="handleClick">×</button>
    </div>

    <div class="catalog" v-show="ifShowCatalog">
      <div class="titleName">
        知识图谱
      </div>
      <div class="search">
        <el-button type="primary" class="search-button" @click="focusNode(inputValue)">
          <el-icon>
            <Search/>
          </el-icon>
        </el-button>
        <input
            v-model="inputValue"
            class="search-input"
            placeholder="搜索图谱中的词条"
            @keydown.enter="focusNode(inputValue)"
        />
      </div>
      <div class="list">
        <li
            v-for="item in list"
            :key="item.id"
            :class="{'clicked': currentIndex === item.id}"
            @click="showDescription(item,item.value)"
        >{{ item.value }}({{item.fatherCount}})
          <!--          如果有子项展开子项-->
          <ul v-if="item.isOpen">
            <li
                v-for="child in item.children"
                :key="child.id"
                :class="{'clicked': currentIndex === child.id}"
                @click.stop="handleChildClick(child)"
            >
              {{ child.value}}({{child.sonCount}})
            </li>
          </ul>
        </li>
      </div>
    </div>

    <div class="knowledgeGraph">
      <div class="chartContainer" ref="chart"></div>
      <div class="restart">
        <button @click="getData">一键复原</button>
      </div>
      <div class="chartCount">
        <button>共{{chartDataCount}}个实体球</button>
      </div>
<!--      <div class="go">-->
<!--        <button @click="go">跳转指挥大屏</button>-->
<!--      </div>-->
      <div class="graphLagend">
        <div class="legendHeader">
          <span>图例详情</span>
        </div>
        <div class="legendContent">
          <div class="legend-item" v-for="item in legend " :key="item.id">
            <div class="legend-image">
              <img :src="item.img" alt="图例说明">
            </div>
            <div class="legend-description">
              <span>{{item.description}}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="toggle-button open" @click="updateChartData" v-show="ifShowCatalog"><p style="color: #FFFFFF">多灾种信息列表</p></div>

    <div class="chat-panel" v-if="showChat">
      <div class="chat-title">灾害信息列表</div>
      <div class="toggle-button close" @click="updateChartData">
        关闭
      </div>

      <div class="disaster-list">
        <div v-if="tableData && tableData.length">
          <div
              v-for="(item, index) in tableData"
              :key="index"
              class="disaster-item"
          >
            <p class="clickable" @click="getData(item.eqid)">{{ item.eqAddr }}</p>
          </div>
        </div>
        <div v-else class="no-data">暂无灾害信息</div>
      </div>

    </div>
  </div>

</template>

<script setup>
import {Position, Search} from "@element-plus/icons-vue";
import * as echarts from 'echarts';
import {ref, onMounted, onBeforeUnmount, nextTick} from 'vue';
import {getChartDataBy, getGraphData} from "@/api/system/knowledgeGraph.js";
import {MdPreview} from "md-editor-v3";
import {ElMessage} from "element-plus";
// import {getEqList} from "@/api/system/damageassessment.js";
import {useRouter} from "vue-router";
// 该数据不准二次赋值，用于全局调用，保存初始数据 ！！！
let allDataLinks = [];
// 存放图例的信息
const legend = [
  {
    id:0,
    img:"../../../public/images/eqentity1.png",
    description:"一级实体"
  },
  {
    id:1,
    img:"../../../public/images/eqentity2.png",
    description:"二级实体"
  },
  {
    id:2,
    img:"../../../public/images/eqentity3.png",
    description:"三级实体"
  },
  {
    id:3,
    img:"../../../public/images/eqentity4.png",
    description:"四级实体"
  },
]
// 定义要触发的事件
const emit = defineEmits(['bigGraphShow'])
// 响应式数据
const inputValue = ref('');
const currentIndex = ref(null);
const showChat = ref(false);
const messageList = ref([]);
const loading = ref(false);
const chart = ref(null);
// 永远不会改变的初始值（这里有BUG，不知道为什么变化了）
const StartData = ref([]);
const StartLinks = ref([]);
const firstData = ref([]);
const secondData = ref([]);
// 一开始展示的信息（后续处理过程发生了改变）
const chartStartData = ref([]);
const chartStartLinks = ref([]);
// 不断变化的信息
const chartChangeData = ref([]);
const chartChangeLinks = ref([]);
// 所有的数据信息
const chartData = ref([]);
const chartLinks = ref([]);
// 用于检查随着时间轴变化是否更新
const lastChartData = ref([]);
const echartsInstance = ref(null);
// 控制左侧列表是否隐藏
const ifShowCatalog = ref(true);
const list = ref([]);
const newList = ref([]);
// ECharts 配置
const echartsOption = ref({
  backgroundColor: 'rgba(0,0,0,0)',
  grid: {
    left: '10%',
    top: 60,
    right: '10%',
    bottom: 60,
  },
  toolbox: {
    feature: {
      saveAsImage: false,
    }
  },
  series: [{
    type: 'graph',
    layout: 'force',
    force: {
      repulsion: 1000,
      edgeLength: [100, 200],
      layoutAnimation: true,
    },
    symbolSize: 70,
    nodeScaleRatio: 1,
    roam: true,
    zoom: 1,
    draggable: true,
    focusNodeAdjacency: false,
    edgeSymbol: ['circle', 'arrow'],
    label: {
      show: true,
      position: 'bottom',
      color: 'white'
    },
    edgeLabel: {
      show: true,
      fontSize: 12,
      color: '#fff',
      formatter: "{c}"
    },
    categories: [
      {name: '属性'},
      {name: '关系', symbol: 'rect'}
    ],
    itemStyle: {
      borderColor: '#04f2a7',
      borderWidth: 2,
      shadowBlur: 10,
      shadowColor: '#04f2a7',
      color: '#71b8ed',
    },
    lineStyle: {
      opacity: 0.9,
      width: 2,
      curveness: 0,
      color: {
        type: 'linear',
        x: 0,
        y: 0,
        x2: 0,
        y2: 1,
        colorStops: [
          {offset: 0, color: '#e0f55a'},
          {offset: 1, color: '#639564'}
        ],
        globalCoord: false
      }
    },
    symbolKeepAspect: false,
    data: chartData.value,
    links: chartLinks.value
  }]
});
// 地震列表数据
const tableData = ref([
  {
    eqid: 'T2025062222234112888',
    eqAddr: '2023年8月11日陕西省西安市喂子坪村山洪泥石流',
    time: '2023-08-11 18:00:00'
  },
  {
    eqid: 'T2025062222234112777',
    eqAddr: '2018年9月12日陕西汉中5.3级地震',
    magnitude: 5.3,
    depth: 8,
    time: '2018-09-12 18:00:00'
  },
])
// 最新的地震数据
const lastEqData = ref([])
// 最新的地震的eqid
const lastEqid = ref()
const lastEqqueueId = ref()

const router = useRouter();
// 计算一共有多少个实体球
const chartDataCount = ref();


// 获取数据并初始化图表
const getData = async (eqid) => {
  try {
    let usedEqid;

    // 判断是否传入 eqid 且不是默认的那个 ID
    if (eqid && eqid !== 'T2025062222234112777') {
      lastEqData.value = tableData.value[0];
      usedEqid = lastEqData.value.eqid;
      firstData.value = [
        { name: '灾害基本信息类' },
        { name: '气象与水文触发信息类' },
        { name: '人员伤亡与转移' },
        { name: '房屋与基础设施破坏类' },
        { name: '次生灾害类' },
        { name: '应急响应与救援行动类' },
        { name: '社会援助与捐赠类' },
        { name: '灾后恢复与评估类' }
      ];
      secondData.value = [
        { name: '气象信息' },
        { name: '水文信息' },
        { name: '房屋与基础设施破坏类' },
        { name: '基础设施破坏' },
        { name: '部门' },
        { name: '企业' },
      ];
      list.value = [
        {
          id: 1,
          value: '灾害基本信息类',
          isOpen: false,
          children: [
            { id: 11, value: '发生时间' },
            { id: 12, value: '发生地点' },
            { id: 13, value: '灾害类型' },
            { id: 14, value: '诱因' },
            { id: 15, value: '灾害规模' },
            { id: 16, value: '影响人口' },
            { id: 17, value: '伤亡情况' },
            { id: 18, value: '经济损失' },
            { id: 19, value: '救援情况' },
            { id: 20, value: '报警时间' },
            { id: 21, value: '信息来源' },
            { id: 22, value: '天气状况' },
            { id: 23, value: '地形特征' },
            { id: 24, value: '是否预警' },
            { id: 25, value: '是否次生灾害' },
            { id: 26, value: '次生灾害类型' },
            { id: 27, value: '交通影响' },
            { id: 28, value: '电力影响' },
            { id: 29, value: '通讯影响' },
            { id: 30, value: '环境影响' },
            { id: 31, value: '灾害等级' }
          ],
          fatherCount: 21
        },
        {
          id: 2,
          value: '气象与水文触发信息类',
          isOpen: false,
          children: [
            { id: 32, value: '气象信息-类型' },
            { id: 33, value: '气象信息-降雨量' },
            { id: 34, value: '气象信息-持续时间' },
            { id: 35, value: '气象信息-降雨开始时间' },
            { id: 36, value: '水文信息-河流名称' },
            { id: 37, value: '水文信息-蓄水量' },
            { id: 38, value: '水文信息-水库状态' },
            { id: 39, value: '水文信息-地下水位' },
            { id: 40, value: '河流-水位情况' },
            { id: 41, value: '河流-堤防情况' },
            { id: 42, value: '河流-水质情况' }
          ],
          fatherCount: 11
        },
        {
          id: 3,
          value: '人员伤亡与转移',
          isOpen: false,
          children: [
            { id: 43, value: '死亡/失踪/受伤等情况' },
            { id: 44, value: '转移人员情况' },
            { id: 45, value: '安置点信息' },
            { id: 46, value: '救援队伍情况' },
            { id: 47, value: '医疗救治情况' },
            { id: 48, value: '临时避难所容量' },
            { id: 49, value: '物资供应情况' },
            { id: 50, value: '心理援助情况' }
          ],
          fatherCount: 8
        },
        {
          id: 4,
          value: '房屋与基础设施破坏类',
          isOpen: false,
          children: [
            { id: 51, value: '房屋倒塌情况' },
            { id: 52, value: '基础设施-类型' },
            { id: 53, value: '基础设施-状态' },
            { id: 54, value: '基础设施-损坏程度' },
            { id: 55, value: '基础设施-影响范围' }
          ],
          fatherCount: 5
        },
        {
          id: 5,
          value: '次生灾害类',
          isOpen: false,
          children: [
            { id: 56, value: '发生次生灾害类型' },
            { id: 57, value: '影响情况' },
            { id: 58, value: '面积' },
            { id: 59, value: '持续时间' },
            { id: 60, value: '应急响应措施' },
            { id: 61, value: '次生灾害等级' }
          ],
          fatherCount: 6
        },
        {
          id: 6,
          value: '应急响应与救援行动类',
          isOpen: false,
          children: [
            { id: 62, value: '响应部门名称' },
            { id: 63, value: '响应等级' },
            { id: 64, value: '出动人员/车辆/装备' },
            { id: 65, value: '安置点设立情况' },
            { id: 66, value: '安置人数' },
            { id: 67, value: '转移人数' }
          ],
          fatherCount: 6
        },
        {
          id: 7,
          value: '社会援助与捐赠类',
          isOpen: false,
          children: [
            { id: 68, value: '企业名称' },
            { id: 69, value: '企业捐赠物资' },
            { id: 70, value: '企业捐赠数量' },
            { id: 71, value: '慈善机构名称' },
            { id: 72, value: '慈善机构捐赠物资' },
            { id: 73, value: '慈善机构捐赠数量' }
          ],
          fatherCount: 6
        },
        {
          id: 8,
          value: '灾后恢复与评估类',
          isOpen: false,
          children: [
            { id: 74, value: '恢复情况' },
            { id: 75, value: '损失评估情况' }
          ],
          fatherCount: 2
        }
      ];


    } else if (tableData.value && tableData.value[1]) {
      // 默认使用 tableData.value[1]
      lastEqData.value = tableData.value[1];
      usedEqid = lastEqData.value.eqid;
      firstData.value = [
        { name: '地震震情信息' },
        { name: '地震灾情信息' },
        { name: '应急指挥协调信息' },
        { name: '应急决策信息' },
        { name: '态势标绘信息' },
        { name: '社会反应动态信息' },
        { name: '灾害现场动态信息' },
        { name: '应急处置信息' }
      ];

      secondData.value = [
        { name: '气象信息' },
        { name: '水文信息' },
        { name: '房屋与基础设施破坏类' },
        { name: '基础设施破坏' },
        { name: '部门' },
        { name: '企业' },
        { name: '灾后恢复与评估类' },
        { name: '生命线震害信息' },
        { name: '次生灾害信息' },
        { name: '人员伤亡' },
        { name: '灾区灾情简报' },
        { name: '用户上传会议信息' },
        { name: '应急响应信息' },
        { name: '应急决策基础信息' },
        { name: '应急处置基础信息' },
        { name: '态势标绘基础信息' },
        { name: '灾害现场动态基础信息' },
        { name: '社会反应动态基础信息' }
      ];

      list.value = [
        {
          id: 1,
          value: '地震震情信息',
          isOpen: false,
          children: [
            { id: 11, value: '地震参数' },
            { id: 12, value: '强震检测信息' },
            { id: 13, value: '测震监测信息' },
            { id: 14, value: '预报信息' },
            { id: 15, value: '余震情况' }
          ],
          fatherCount: 5
        },
        {
          id: 2,
          value: '地震灾情信息',
          isOpen: false,
          children: [
            { id: 21, value: '人员伤亡' },
            { id: 22, value: '房屋破坏' },
            { id: 23, value: '生命线震害信息' },
            { id: 24, value: '次生灾害信息' },
            { id: 25, value: '人员伤亡' },
            { id: 26, value: '灾区灾情简报' }
          ],
          fatherCount: 6
        },
        {
          id: 3,
          value: '应急指挥协调信息',
          isOpen: false,
          children: [
            { id: 31, value: '用户上传会议信息' },
            { id: 32, value: '应急响应信息' }
          ],
          fatherCount: 2
        },
        {
          id: 4,
          value: '应急决策信息',
          isOpen: false,
          children: [
            { id: 41, value: '应急决策基础信息' }
          ],
          fatherCount: 1
        },
        {
          id: 5,
          value: '应急处置信息',
          isOpen: false,
          children: [
            { id: 51, value: '应急处置基础信息' }
          ],
          fatherCount: 1
        },
        {
          id: 6,
          value: '态势标绘信息',
          isOpen: false,
          children: [
            { id: 61, value: '态势标绘基础信息' }
          ],
          fatherCount: 1
        },
        {
          id: 7,
          value: '灾害现场动态信息',
          isOpen: false,
          children: [
            { id: 71, value: '灾害现场动态基础信息' }
          ],
          fatherCount: 1
        },
        {
          id: 8,
          value: '社会反应动态信息',
          isOpen: false,
          children: [
            { id: 81, value: '社会反应动态基础信息' }
          ],
          fatherCount: 1
        }
      ];
    } else {
      console.warn("数据为空，无法获取默认 eqid");
      return;
    }

    lastEqid.value = usedEqid;
    console.log("实际使用的 eqid：", usedEqid);
    const res = await getChartDataBy(usedEqid);

    console.log("res的图谱结果",res)

    chartLinks.value = res.map(item => ({
      source: item.source.name,
      target: item.target.name,
      value: item.value.type
    }));

    const nodeSet = new Set();
    chartLinks.value.forEach(item => {
      nodeSet.add(item.source);
      nodeSet.add(item.target);
    });
    chartData.value = Array.from(nodeSet).map(name => ({name}));

    allDataLinks = chartLinks.value

    StartData.value= chartData.value
    StartLinks.value = chartLinks.value

    chartDataCount.value = chartData.value.length + 1;

    // 处理 一开始展示 数据（这里的顺序不要更换否则会出问题）
    const validValues = new Set(list.value.map(item => item.value));
    chartStartData.value = chartData.value.filter(item => validValues.has(item.name))
    chartStartLinks.value = chartStartData.value.map(item => (
            {
              source: lastEqData.value.eqAddr,
              target: item.name,
              value: "包含"
            }
        )
    )
    chartStartData.value.push({ name: lastEqData.value.eqAddr });

    // 给每个子项计算 sonCount
    list.value.forEach(item => {
      item.children.forEach(child => {
        const sonCount = chartLinks.value.filter(link => link.source === child.value).length;
        child.sonCount = sonCount;
      });
    });
    console.log(list.value,"跟新后的数据")

    StartData.value = chartStartData.value;
    StartLinks.value =  chartStartLinks.value;

    console.log(StartData.value,"开始数据")
    console.log("newList",newList.value)
    console.log("chartData",chartStartData.value)
    console.log("chartLinks",chartStartLinks.value)

    initChart();
  } catch (error) {
    console.error('获取图表数据失败:', error);
  }
};
// 初始化图表
const initChart = () => {

  if (!chart.value) return;
  if (echartsInstance.value !== null) {
    echartsInstance.value.dispose();
  }

  // 特殊节点样式
  echartsOption.value.series[0].data = chartStartData.value.map(item => {
    if (item.name === lastEqData.value.eqAddr) {
      item.symbol= `image:///images/eqentity1.png`
      item.itemStyle = {
        borderColor: '#f20404',
        borderWidth: 2,
        shadowBlur: 10,
        shadowColor: '#f20404',
        color:'rgba(242, 4, 4, 0.7)',
      };
    } else if (firstData.value.some(dataItem => dataItem.name === item.name)) {
      item.symbol= `image:///images/eqentity2.png`
      item.itemStyle = {
        borderColor: '#e2f204',
        borderWidth: 2,
        shadowBlur: 10,
        shadowColor: '#e2f204',
        color:'rgba(226, 242, 4, 0.6)',
      };
    } else if (secondData.value.some(dataItem => dataItem.name === item.name)) {
      item.symbol= `image:///images/eqentity3.png`
      item.itemStyle = {
        borderColor: '#04f2c6',
        borderWidth: 2,
        shadowBlur: 10,
        shadowColor: '#04f2c6',
        color:'rgba(4, 242, 198, 0.7)'
      };
    }else{
      item.symbol= `image:///images/eqentity4.png`
      item.itemStyle = {
        borderColor: '#04f218',
        borderWidth: 2,
        shadowBlur: 10,
        shadowColor: '#04f218',
        color:'rgba(4, 242, 24, 0.7)'
      };
    }

    return item;
  });

  echartsOption.value.series[0].links = chartStartLinks.value;

  echartsInstance.value = echarts.init(chart.value);

  echartsInstance.value.setOption(echartsOption.value);

  // 强制调整大小，确保初始渲染时的大小正确
  echartsInstance.value.resize();

  // 监听 click 事件
  echartsInstance.value.on('click', function (params) {
    // 判断点击的是节点还是边
    if (params.componentType === 'series' && params.seriesType === 'graph') {
      if (params.dataType === 'node') {
        // 处理节点点击
        handleNodeClick(params.data);
      } else if (params.dataType === 'edge') {
        // 处理边点击
      }
    }
  });

  // 添加窗口大小变化监听
  window.addEventListener('resize', handleResize);

};

// 点击节点触发函数
const handleNodeClick = (value) => {
  // value:{name:"地震灾情信息",symbolSize:60}

  // 打印被点击的节点信息
  console.log(value, "这个节点被点击了");

  // 获取节点的名称 (name)
  const nodeName = value.name;

  // 从 chartLinks 中查找所有 source 等于 nodeName 的对象
  const relatedLinks = chartLinks.value.filter(link => link.source === nodeName);

  // 将相关的链接对象添加到 chartStartLinks 中
  relatedLinks.forEach(link => {
    // 如果 chartStartLinks 中没有该链接对象，则添加
    if (!chartStartLinks.value.some(item => item.source === link.source && item.target === link.target)) {
      chartStartLinks.value.push(link);
    }
  });

  // 将更新后的 chartStartLinks 存入 chartChangeLinks
  chartChangeLinks.value = [...chartStartLinks.value];

  // 打印更新后的 chartChangeLinks
  console.log("更新后的 chartChangeLinks:", chartChangeLinks.value);

  // 提取所有 target 值
  const newTargets = relatedLinks.map(link => link.target);

  // 把这些 target 值添加到 chartStartData 中
  newTargets.forEach(target => {
    // 如果 chartStartData 中没有这个 target 名称的节点，则添加
    if (!chartStartData.value.some(item => item.name === target)) {
      chartStartData.value.push({ name: target });
    }
  });

  // 将 chartStartData 存入 chartChangeData
  chartChangeData.value = [...chartStartData.value];

  // 打印更新后的 chartChangeData
  console.log("更新后的 chartChangeData:", chartChangeData.value);

  updateEchart(chartChangeData.value,chartChangeLinks.value)
};

const updateEchart = (data,link) =>{
  if (echartsInstance.value !== null) {
    echartsInstance.value.dispose();
  }

  console.log("data数据",data)
  console.log("link数据",link)


  // 特殊节点样式
  echartsOption.value.series[0].data = chartStartData.value.map(item => {
    if (item.name === lastEqData.value.eqAddr) {
      item.symbol= `image:///images/eqentity1.png`
      item.itemStyle = {
        borderColor: '#f20404',
        borderWidth: 2,
        shadowBlur: 10,
        shadowColor: '#f20404',
        color:'rgba(242, 4, 4, 0.7)',
      };
    } else if (firstData.value.some(dataItem => dataItem.name === item.name)) {
      item.symbol= `image:///images/eqentity2.png`
      item.itemStyle = {
        borderColor: '#e2f204',
        borderWidth: 2,
        shadowBlur: 10,
        shadowColor: '#e2f204',
        color:'rgba(226, 242, 4, 0.6)',
      };
    } else if (secondData.value.some(dataItem => dataItem.name === item.name)) {
      item.symbol= `image:///images/eqentity3.png`
      item.itemStyle = {
        borderColor: '#04f2c6',
        borderWidth: 2,
        shadowBlur: 10,
        shadowColor: '#04f2c6',
        color:'rgba(4, 242, 198, 0.7)'
      };
    }else{
      item.symbol= `image:///images/eqentity4.png`
      item.itemStyle = {
        borderColor: '#04f218',
        borderWidth: 2,
        shadowBlur: 10,
        shadowColor: '#04f218',
        color:'rgba(4, 242, 24, 0.7)'
      };
    }

    return item;
  });
  echartsOption.value.series[0].links = link;

  echartsInstance.value = echarts.init(chart.value);
  echartsInstance.value.setOption(echartsOption.value);

  // 监听 click 事件
  echartsInstance.value.on('click', function (params) {
    // 判断点击的是节点还是边
    if (params.componentType === 'series' && params.seriesType === 'graph') {
      if (params.dataType === 'node') {
        // 处理节点点击
        handleNodeClick(params.data);
      } else if (params.dataType === 'edge') {
        // 处理边点击
      }
    }
  });
}

// 处理窗口大小变化
const handleResize = () => {
  if (echartsInstance.value) {
    echartsInstance.value.resize();
  }
};

// 关闭助手并调整图表大小
const updateChartData = () => {
  showChat.value = !showChat.value;
  ifShowCatalog.value = !ifShowCatalog.value;
  nextTick(() => {
    handleResize();
  });
};

// 搜索节点并聚焦
const focusNode = (nodeName) => {

  console.log(inputValue.value, "输入框的内容")
  console.log(nodeName, "节点名称")

  if (!nodeName?.trim()) {
    inputValue.value = '';
    return;
  }

  const indexes = findNodeIndexes(nodeName);
  if (indexes.length === 0) {
    ElMessage.warning(`节点 "${nodeName}" 不存在`);
    inputValue.value = '';
    return;
  }

  for (const index of indexes) {
    echartsInstance.value.dispatchAction({
      type: 'highlight',
      name: echartsOption.value.series[0].data[index].name
    });

    echartsInstance.value.dispatchAction({
      type: 'focusNodeAdjacency',
      seriesIndex: 0,
      dataIndex: index
    });
  }



  inputValue.value = '';
};

// 模糊查找节点索引
const findNodeIndexes = (name) => {
  const lowerName = name.toLowerCase();
  return echartsOption.value.series[0].data
      .map((node, idx) => node.name.toLowerCase().includes(lowerName) ? idx : -1)
      .filter(idx => idx !== -1);
};


// 显示描述并聚焦节点
const showDescription = (item, value) => {
  item.isOpen = !item.isOpen;

  // 如果展开了，更新 currentIndex，表示当前项被选中
  if (item.isOpen) {
    currentIndex.value = item.id;
  } else {
    // 如果收起了，清除 currentIndex
    if (currentIndex.value === item.id) {
      currentIndex.value = null;
    }
  }

  const nodeName = {name:item.value}
  handleNodeClick(nodeName);

  focusNode(value);
};




// 向父组件传值不展示大知识图谱
const handleClick = () => {
  // 触发事件通知父组件
  emit('bigGraphShow', false)
};

const handleChildClick = (child) => {
  // child:{id: 12, value: '强震检测信息'}
  console.log(child,"我看看怎么个事")
  const newChild = { name: child.value }; // 转换成 {name: "强震检测信息"}
  handleNodeClick(newChild);
  focusNode(newChild.name);
};

// 生命周期钩子
onMounted(() => {
  getData()
});

onBeforeUnmount(() => {
  if (echartsInstance.value) {
    echartsInstance.value.dispose();
    window.removeEventListener('resize', handleResize);
  }
});

</script>

<style scoped lang="less">

.content-body {
  width: 100%;
  height: 100%;
  position: absolute;
  display: flex;
  flex-direction: row; /* 使元素横向排列 */
  // 确保 flex 容器允许子元素增长和收缩
  z-index: 2;
  //background: linear-gradient(270deg, rgba(4, 20, 34, 1) 0%, rgba(14, 37, 61, 0.9) 41%, rgba(26, 54, 77, 0.75) 66%, rgba(42, 89, 135, 0.9) 88%, rgba(47, 82, 117, 0.9) 95%, rgba(44, 69, 94, 0.9) 100%);
  background-image: url("../../assets/蓝色银河星空带鱼屏.png");
  background-size: cover;
  .closeAll {
    button {
      position: absolute;
      left: calc(95vw + 6px);
      top: 8px;
      z-index: 1;
      // 基础样式
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background-color: transparent;
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 5px;
      padding: 5px 12px;
      color: white;
      cursor: pointer;
      height: 30px;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.3s ease;
      user-select: none;

      // 悬停时的流动边框
      &:hover {
        border-color: transparent; // 隐藏原始边框

        &::after {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          border-radius: 6px;
          padding: 1px; // 边框厚度
          background: linear-gradient(90deg,
          #0453fc,
          #00f7ff,
          #0453fc,);
          background-size: 200% auto;
          -webkit-mask: linear-gradient(#fff 0 0) content-box,
          linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          animation: borderFlow 1.5s linear infinite;
          z-index: 0;
        }
      }
    }
  }

  .knowledgeGraph {
    flex: 1;
    height: 100%;
    width:100%;
    position:relative;

    .chartContainer {
      width: 100%;
      height: 100%;
    }

    .restart{
      button {
        position: absolute;
        top: 8px;
        z-index: 1;
        // 基础样式
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background-color: transparent;
        border: 1px solid rgba(255, 255, 255, 0.3);
        font-size: 14px;
        font-weight: 500;
        color: white;
        border-radius: 5px;
        padding: 5px 12px;
        cursor: pointer;
        height: 30px;
        transition: all 0.3s ease;
        user-select: none;

        // 悬停时的流动边框
        &:hover {
          border-color: transparent; // 隐藏原始边框

          &::after {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            border-radius: 6px;
            padding: 1px; // 边框厚度
            background: linear-gradient(90deg,
            #0453fc,
            #00f7ff,
            #0453fc,);
            background-size: 200% auto;
            -webkit-mask: linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            animation: borderFlow 1.5s linear infinite;
            z-index: 0;
          }
        }
      }
    }

    .chartCount{
      button {
        position: absolute;
        top: 46px;
        z-index: 1;
        // 基础样式
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background-color: transparent;
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 5px;
        padding: 5px 12px;
        color: white;
        cursor: pointer;
        height: 30px;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.3s ease;
        user-select: none;

        // 悬停时的流动边框
        &:hover {
          border-color: transparent; // 隐藏原始边框

          &::after {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            border-radius: 6px;
            padding: 1px; // 边框厚度
            background: linear-gradient(90deg,
            #0453fc,
            #00f7ff,
            #0453fc,);
            background-size: 200% auto;
            -webkit-mask: linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            animation: borderFlow 1.5s linear infinite;
            z-index: 0;
          }
        }
      }
    }

    .go{
      button {
        position: absolute;
        top: 8px;
        z-index: 1;
        right:0.3vw;
        // 基础样式
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background-color: transparent;
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 5px;
        padding: 5px 12px;
        color: white;
        cursor: pointer;
        height: 30px;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.3s ease;
        user-select: none;

        // 悬停时的流动边框
        &:hover {
          border-color: transparent; // 隐藏原始边框

          &::after {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            border-radius: 6px;
            padding: 1px; // 边框厚度
            background: linear-gradient(90deg,
            #0453fc,
            #00f7ff,
            #0453fc,);
            background-size: 200% auto;
            -webkit-mask: linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            animation: borderFlow 1.5s linear infinite;
            z-index: 0;
          }
        }
      }
    }

    .graphLagend{
      position: absolute;
      bottom: 0px;
      z-index:1;
      left:0vw;
      // 基础样式
      background-color: rgba(59, 80, 149, .1);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 5px;
      padding: 5px 12px;
      color: white;
      font-size: 14px;
      font-weight: 500;
      user-select: none;
      display: flex;
      flex-direction: column;

      .legendHeader{
        text-align: center;
        margin-bottom: 10px;
      }

      .legendContent{
        flex:1;
        display: flex;
        flex-direction: column;

        .legend-item{
          display: flex;
          flex-direction: row;
          margin-bottom: 10px;
          .legend-image{
            img{
              margin-top: 3px;
              width: 15px;
              margin-right: 10px;
            }
          }
        }
      }
    }
  }


  .chat-panel {
    padding: 16px;
    max-height: 80vh;
    overflow-y: auto;
    color: white;
    background-color: rgba(59, 80, 149, .1);
    height: 100%;
    border-top-right-radius: 20px; /* 右上角圆角 */
    border-bottom-right-radius: 20px; /* 左下角圆角 */
  }

  .chat-title {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 12px;
  }

  .toggle-button {
    cursor: pointer;
    color: #409eff;
    float: right;
    margin-top: -28px;
  }

  .disaster-list {
    margin-top: 10px;
  }

  .disaster-item {
    padding: 10px;
    margin-bottom: 8px;
    border-bottom: 1px solid #eee;
    line-height: 1.6;
  }

  .no-data {
    color: #999;
    text-align: center;
    padding: 20px 0;
  }

  .catalog {
    background-color: rgba(59, 80, 149, .1);
    height: 100%;
    display: flex;
    flex-direction: column;
    border-top-left-radius: 20px;
    border-bottom-left-radius: 20px;


    .titleName {
      height: 100px;
      text-align: center;
      line-height: 100px;
      color: white;
      font-size: 30px;
      user-select: none; /* 禁用文本选择 */
    }

    .search {
      text-align: center;
      margin-bottom: 10px;

      .search-button, .search-input {
        background-color: rgba(0, 0, 0, 0);
        box-shadow: inset 0 -1px 1px 0 #0453fc;
        border-color: #FFFFFF00;
        height: 44px;
      }

      .search-button {
        border-radius: 12px 0 0 12px;
      }

      .search-input {
        border-radius: 0 12px 12px 0;
        color: whitesmoke;
        width: 170px;
      }
    }

    .list {
      flex: 1;
      overflow-y: scroll; /* 使内容可以垂直滚动 */

      li {
        list-style-type: none; /* 先去掉默认的小圆点 */
        position: relative; /* 为了定位伪元素 */
        margin-left: 40px;
        font-size: 16px;
        //height: 60px;
        line-height: 60px;
        color: #fff;
        user-select: none; /* 禁用文本选择 */

        ul{
          margin-top: 0px;
          margin-bottom: 0px;
          margin-right: 20px;

          li{x
          line-height: 40px;
            margin-left: 0px;
            white-space: nowrap;  /* 防止换行 */
            text-overflow: ellipsis; /* 使用省略号显示超出部分 */
          }

          li::before {
            content: ''; /* 空内容 */
            position: absolute; /* 定位 */
            right: 10px; /* 左偏移，调整圆点位置 */
            top: 20px; /* 垂直居中 */
            transform: translateY(-50%); /* 垂直居中 */
            width: 8px; /* 圆点的宽度 */
            height: 8px; /* 圆点的高度 */
            border-radius: 50%; /* 使其变成圆形 */
            background-color: #fff; /* 圆点颜色 */
            user-select: none; /* 禁用文本选择 */
          }

        }

        li.clicked::before {
          background-image: linear-gradient(151deg, #66c8f2, #35f 66%);
        }

      }

      li::before {
        content: ''; /* 空内容 */
        position: absolute; /* 定位 */
        left: -20px; /* 左偏移，调整圆点位置 */
        top: 30px; /* 垂直居中 */
        transform: translateY(-50%); /* 垂直居中 */
        width: 8px; /* 圆点的宽度 */
        height: 8px; /* 圆点的高度 */
        border-radius: 50%; /* 使其变成圆形 */
        background-color: #fff; /* 圆点颜色 */
        user-select: none; /* 禁用文本选择 */
      }



      li.clicked::before {
        background-image: linear-gradient(151deg, #66c8f2, #35f 66%);
      }
    }

    /* 隐藏滚动条 */

    .list::-webkit-scrollbar {
      display: none;
    }
  }

}

.toggle-button {
  // 基础样式
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 5px;
  padding: 5px 12px;
  color: white;
  cursor: pointer;
  width: 200px;
  height: 30px;
  font-size: 14px;
  font-weight: 500;
  position: relative;
  transition: all 0.3s ease;
  user-select: none;

  // 悬停时的流动边框
  &:hover {
    border-color: transparent; // 隐藏原始边框

    &::after {
      content: '';
      position: absolute;
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      border-radius: 6px;
      padding: 1px; // 边框厚度
      background: linear-gradient(90deg,
      #0453fc,
      #00f7ff,
      #0453fc,);
      background-size: 200% auto;
      -webkit-mask: linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      animation: borderFlow 1.5s linear infinite;
      z-index: 0;
    }
  }
}

@keyframes borderFlow {
  0% {
    background-position: 0% center;
  }
  100% {
    background-position: 200% center;
  }
}

.close {
  position: relative;
  top: -20px;
  left: 10px;
  width: 100px;
}

.open {
  position: absolute;
  right: 10px;
  bottom: 10px;
}

</style>


