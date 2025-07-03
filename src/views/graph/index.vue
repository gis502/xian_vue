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

        <button @click="getData(lastEqqueueId)">一键复原</button>
      </div>
      <div class="chartCount">
        <button>共{{chartDataCount}}个实体球</button>
      </div>
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

    <div class="toggle-button open" @click="updateChartData" v-show="ifShowCatalog"><p style="color: black">多灾种信息列表</p></div>

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
import eqentity1 from '@/assets/images/eqentity1.png'
import eqentity2 from '@/assets/images/eqentity2.png'
import eqentity3 from '@/assets/images/eqentity3.png'
import eqentity4 from '@/assets/images/eqentity4.png'

// 该数据不准二次赋值，用于全局调用，保存初始数据 ！！！
let allDataLinks = [];
// 存放图例的信息
const legend = [
  {
    id:0,
    img:eqentity1,
    description:"一级实体"
  },
  {
    id:1,
    img:eqentity2,
    description:"二级实体"
  },
  {
    id:2,
    img:eqentity3,
    description:"三级实体"
  },
  {
    id:3,
    img:eqentity4,
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
    zoom: 0.4,
    draggable: true,
    focusNodeAdjacency: false,
    edgeSymbol: ['circle', 'arrow'],
    label: {
      show: true,
      position: 'bottom',
      color: '#000'
    },
    edgeLabel: {
      show: true,
      fontSize: 12,
      color: '#000',
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
    // eqid: 'T2025062222234112888',
    eqid: 'T2025062222234112333',
    eqAddr: '2023年8月11日陕西省西安市长安区喂子坪村鸡窝子组山洪泥石流',
    time: '2023-08-11 18:00:00'
  },
  {
    // eqid: 'T2025062222234112777',
    eqid: 'T2025062222234112111',
    eqAddr: '2018年9月12日陕西汉中宁强县5.3级地震',
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
    lastEqqueueId.value=eqid;

    // 判断是否传入 eqid 且不是默认的那个 ID
    // if (eqid && eqid !== 'T2025062222234112777') {
    if (eqid && eqid !== 'T2025062222234112111') {
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
          { name: '基本信息' },
          { name: '人员与损失信息' },
          { name: '救援与响应' },
          { name: '外部条件与环境' },
          { name: '影响范围' },
          { name: '气象信息' },
          { name: '水文信息' },
          { name: '应急响应信息' },
          { name: '人员伤亡信息' },
          { name: '转移安置信息' },
          { name: '房屋破坏信息' },
          { name: '基础设施破坏信息' },
          { name: '次生灾害事件信息' },
          { name: '响应与救援部门信息' },
          { name: '企业援助信息' },
          { name: '慈善机构援助信息' },
          { name: '恢复与评估信息' },

    ];
      list.value = [
          {
            id: 1,
            value: '灾害基本信息类',
            isOpen: false,
            children: [
              { id: 11, value: '基本信息' },
              { id: 12, value: '人员与损失信息' },
              { id: 13, value: '救援与响应' },
              { id: 14, value: '外部条件与环境' },
              { id: 15, value: '影响范围' }
            ],
            fatherCount: 5
          },
          {
            id: 2,
            value: '气象与水文触发信息类',
            isOpen: false,
            children: [
              { id: 21, value: '气象信息' },
              { id: 22, value: '水文信息' }
            ],
            fatherCount: 2
          },
          {
            id: 3,
            value: '人员伤亡与转移',
            isOpen: false,
            children: [
              { id: 31, value: '人员伤亡信息' },
              { id: 32, value: '转移安置信息' }
            ],
            fatherCount: 2
          },
          {
            id: 4,
            value: '房屋与基础设施破坏类',
            isOpen: false,
            children: [
              { id: 41, value: '房屋破坏信息' },
              { id: 42, value: '基础设施破坏信息' }
            ],
            fatherCount: 2
          },
          {
            id: 5,
            value: '次生灾害类',
            isOpen: false,
            children: [
              { id: 51, value: '次生灾害事件信息' }
            ],
            fatherCount: 1
          },
          {
            id: 6,
            value: '应急响应与救援行动类',
            isOpen: false,
            children: [
              { id: 61, value: '响应与救援部门信息' }
            ],
            fatherCount: 1
          },
          {
            id: 7,
            value: '社会援助与捐赠类',
            isOpen: false,
            children: [
              { id: 71, value: '企业援助信息' },
              { id: 72, value: '慈善机构援助信息' }
            ],
            fatherCount: 2
          },
          {
            id: 8,
            value: '灾后恢复与评估类',
            isOpen: false,
            children: [
              { id: 81, value: '恢复与评估信息' }
            ],
            fatherCount: 1
          }
        ]




    } else if (tableData.value && tableData.value[1]) {
      // 默认使用 tableData.value[1]
      lastEqData.value = tableData.value[1];
      usedEqid = lastEqData.value.eqid;
      firstData.value = [
        { name: '地震震情信息' },
        { name: '地震灾情信息' },
        { name: '应急指挥协调信息' },
        { name: '应急决策信息' },
        { name: '态势标绘' },
        { name: '社会反应动态信息' },
        { name: '灾害现场动态信息' },
        { name: '应急处置信息' }
      ];

      secondData.value = [
        { "name": "地震参数" },
        { "name": "强震监测信息" },
        { "name": "测震监测信息" },
        { "name": "预报信息" },
        { "name": "余震情况" },
        { "name": "人员伤亡" },
        { "name": "房屋破坏" },
        { "name": "经济损失" },
        { "name": "会议信息" },
        { "name": "生命线震害信息" },
        { "name": "次生灾害信息" },
        { "name": "人员伤亡" },
        { "name": "灾区灾情简报" },
        { "name": "用户上传会议信息" },
        { "name": "应急响应信息" },
        { "name": "应急决策基础信息" },
        { "name": "应急处置基础信息" },
        { "name": "态势标绘基础信息" },
        { "name": "灾害现场动态基础信息" },
        { "name": "社会反应动态基础信息" }
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
            { id: 31, value: '会议信息' },
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

    // 构建 links
    chartLinks.value = res.map(item => ({
      source: item.source.name,
      target: item.target.name,
      value: item.value.type
    }));

    // 构建节点（去重+保留结构）
    const nodeMap = new Map();
    res.forEach(item => {
      nodeMap.set(item.source.name, item.source);
      nodeMap.set(item.target.name, item.target);
    });

    chartData.value = Array.from(nodeMap.values());
    console.log("chartData111",chartData.value)

    allDataLinks = chartLinks.value;

    // 给每个子项计算 sonCount
    list.value.forEach(item => {
      item.children.forEach(child => {
        const sonCount = chartLinks.value.filter(link => link.source === child.value).length;
        child.sonCount = sonCount;
      });
    });

    // 给节点分配图标样式
    chartStartData.value = chartData.value.map(item => {
      if (item.name === lastEqData.value.eqAddr) {
        item.symbol = `image:///images/eqentity1.png`;
        item.itemStyle = {
          borderColor: '#f20404',
          borderWidth: 2,
          shadowBlur: 10,
          shadowColor: '#f20404',
          color: 'rgba(242, 4, 4, 0.7)',
        };
      } else if (firstData.value.some(i => i.name === item.name)) {
        item.symbol = `image:///images/eqentity2.png`;
        item.itemStyle = {
          borderColor: '#e2f204',
          borderWidth: 2,
          shadowBlur: 10,
          shadowColor: '#e2f204',
          color: 'rgba(226, 242, 4, 0.6)',
        };
      } else if (secondData.value.some(i => i.name === item.name)) {
        item.symbol = `image:///images/eqentity3.png`;
        item.itemStyle = {
          borderColor: '#04f2c6',
          borderWidth: 2,
          shadowBlur: 10,
          shadowColor: '#04f2c6',
          color: 'rgba(4, 242, 198, 0.7)',
        };
      } else {
        item.symbol = `image:///images/eqentity4.png`;
        item.itemStyle = {
          borderColor: '#04f218',
          borderWidth: 2,
          shadowBlur: 10,
          shadowColor: '#04f218',
          color: 'rgba(4, 242, 24, 0.7)',
        };
      }
      return item;
    });

    chartStartLinks.value = chartLinks.value;

    StartData.value = chartStartData.value;
    StartLinks.value = chartStartLinks.value;
    chartDataCount.value = StartData.value.length;

    initChart(); // 渲染图表
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

  echartsOption.value.series[0].data = chartStartData.value;
  echartsOption.value.series[0].links = chartStartLinks.value;

  echartsInstance.value = echarts.init(chart.value);
  echartsInstance.value.setOption(echartsOption.value);
  echartsInstance.value.resize();

  echartsInstance.value.on('click', function (params) {
    if (params.componentType === 'series' && params.seriesType === 'graph') {
      if (params.dataType === 'node') {
        handleNodeClick(params.data);
      }
    }
  });

  window.addEventListener('resize', handleResize);
};


// 点击节点触发函数
// 用于记录已展开的节点名
const expandedNodes = new Set();

// 点击节点处理展开或收起
const handleNodeClick = (value) => {
  const nodeName = value.name;

  if (expandedNodes.has(nodeName)) {
    // 如果已展开，则收起子孙
    removeDescendantsSafely(nodeName);
    expandedNodes.delete(nodeName);
  } else {
    // 如果未展开，则展开当前节点的下一级
    const relatedLinks = chartLinks.value.filter(link => link.source === nodeName);

    relatedLinks.forEach(link => {
      if (!chartStartLinks.value.some(item => item.source === link.source && item.target === link.target)) {
        chartStartLinks.value.push(link);
      }
    });

    relatedLinks.map(link => link.target).forEach(target => {
      if (!chartStartData.value.some(item => item.name === target)) {
        chartStartData.value.push({ name: target });
      }
    });

    chartChangeLinks.value = [...chartStartLinks.value];
    chartChangeData.value = [...chartStartData.value];

    expandedNodes.add(nodeName);
  }

  updateEchart(chartChangeData.value, chartChangeLinks.value);
};



// 递归移除节点及其所有后代节点和连线
const removeDescendantsSafely = (nodeName) => {
  const directLinks = chartStartLinks.value.filter(link => link.source === nodeName);

  directLinks.forEach(link => {
    const target = link.target;

    // 先递归处理子节点
    removeDescendantsSafely(target);

    // 移除当前连接
    chartStartLinks.value = chartStartLinks.value.filter(
        l => !(l.source === nodeName && l.target === target)
    );

    // 检查 target 是否还有其他连接（有就说明不能删）
    const stillLinked = chartStartLinks.value.some(
        l => l.source === target || l.target === target
    );

    if (!stillLinked) {
      chartStartData.value = chartStartData.value.filter(node => node.name !== target);
      expandedNodes.delete(target);
    }
  });

  // 更新图谱
  chartChangeLinks.value = [...chartStartLinks.value];
  chartChangeData.value = [...chartStartData.value];
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
    const nodeData = echartsOption.value.series[0].data[index];

    // 获取节点的屏幕坐标
    const pixelCoords = echartsInstance.value.convertToPixel({seriesIndex: 0}, [nodeData.x, nodeData.y]);

    // 获取图表容器的尺寸
    const containerWidth = echartsInstance.value.getWidth();
    const containerHeight = echartsInstance.value.getHeight();

    // 计算需要移动的距离（将节点移动到屏幕中心）
    const dx = containerWidth / 2 - pixelCoords[0];
    const dy = containerHeight / 2 - pixelCoords[1];
    // 重置视图位置和缩放
    echartsInstance.value.dispatchAction({
      type: 'restore'
    });

    // 高亮目标节点
    echartsInstance.value.dispatchAction({
      type: 'highlight',
      name: echartsOption.value.series[0].data[index].name
    });

    // 聚焦目标节点及其关联节点
    echartsInstance.value.dispatchAction({
      type: 'focusNodeAdjacency',
      seriesIndex: 0,
      dataIndex: index
    });

    // 移动视图使节点居中
    echartsInstance.value.dispatchAction({
      type: 'graphRoam',
      dx: dx,
      dy: dy
    });

    // 设置缩放和中心点
    // echartsInstance.value.setOption({
    //   series: [{
    //     zoom: 2,  // 设置合适的缩放级别
    //     center: [echartsOption.value.series[0].data[index].x, echartsOption.value.series[0].data[index].y]
    //   }]
    // });

    // 显示节点的提示框
    // echartsInstance.value.dispatchAction({
    //   type: 'showTip',
    //   seriesIndex: 0,
    //   dataIndex: index
    // });
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
  height: calc(100vh - 50px);
  position: relative;
  display: flex;
  flex-direction: row; /* 使元素横向排列 */
  // 确保 flex 容器允许子元素增长和收缩
  z-index: 2;
  //background: linear-gradient(270deg, rgba(4, 20, 34, 1) 0%, rgba(14, 37, 61, 0.9) 41%, rgba(26, 54, 77, 0.75) 66%, rgba(42, 89, 135, 0.9) 88%, rgba(47, 82, 117, 0.9) 95%, rgba(44, 69, 94, 0.9) 100%);
  //background-image: url("../../assets/蓝色银河星空带鱼屏.png");
  background-color: #f5f7fa;
  color: #2c3e50;
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
      color: black;
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
          background: linear-gradient(90deg, rgba(4, 83, 252, 0.8), rgba(0, 247, 255, 0.8), rgba(4, 83, 252, 0.8));
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
        border: 1px solid rgba(255, 255, 255, 0.9);
        left: 10px;
        font-size: 14px;
        font-weight: 500;
        color: black;
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
        border: 1px solid rgba(255, 255, 255, 0.9);
        left: 10px;
        border-radius: 5px;
        padding: 5px 12px;
        color: black;
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
        color: black;
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
      left:1vw;
      // 基础样式
      //background-color: rgba(59, 80, 149, .1);
      //border: 1px solid rgba(255, 255, 255, 0.1);
      //background-color: ;
      //border: 1px solid ;
      background-color: rgba(52, 152, 219, 0.1); // 更蓝些
      border: 1px solid rgba(52, 73, 94, 0.3); // 柔和边框
      border-radius: 5px;
      padding: 5px 12px;
      color: black;
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
    color: black;
    background-color: rgba(52, 73, 94, 0.05); // 柔和科技蓝灰
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
    float: right;
    margin-top: -28px;
  }

  .disaster-list {
    margin-top: 10px;
  }

  .disaster-item {
    padding: 10px;
    margin-bottom: 8px;
    border-bottom: 1px solid black;
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
      //color: white;
      color: black;
      font-size: 30px;
      user-select: none; /* 禁用文本选择 */
    }

    .search {
      text-align: center;
      margin-bottom: 10px;

      .search-button, .search-input {
        background-color: rgba(255,255,255,0.8);
        border: 1px solid rgba(52, 152, 219, 0.3);
        box-shadow: inset 0 -1px 1px 0 rgba(52, 152, 219, 0.3);
        color: #34495e;
        height: 44px;
      }

      .search-button {
        border-radius: 12px 0 0 12px;
      }

      .search-input {
        border-radius: 0 12px 12px 0;
        //color: whitesmoke;
        color: black;
        width: 200px;
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
        //color: #fff;
        color: black;
        user-select: none; /* 禁用文本选择 */

        ul{
          margin-top: 0px;
          margin-bottom: 0px;
          margin-right: 20px;

          li{
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
            //background-color: #fff; /* 圆点颜色 */
            background-color: black; /* 圆点颜色 */
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
        //background-color: #fff; /* 圆点颜色 */
        background-color: black; /* 圆点颜色 */
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
  border: 1px solid darkgray;
  border-radius: 5px;
  padding: 5px 12px;
  color: black;
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


