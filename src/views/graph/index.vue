<template>
  <div class="content-body">

    <div class="closeAll">
      <button @click="handleClick"></button>
    </div>

    <div class="catalog" v-show="ifShowCatalog">
      <div class="titleName">
        多灾种知识图谱
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
      <div class="container">
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
      <!-- 按钮区域 -->
      <div class="button themes"
           :class="{ active: isPanelShow.NewsInfo }"
           style="height: 40px; margin-top: -15px; margin-bottom: 10px;text-align: center;"
           @click="handleNewsPanel">
        新闻信息展示
      </div>
      <!-- 新闻展示悬浮框 - 列表表格样式 -->
      <div v-if="isNewsBoxVisible" class="news-float-box">
        <div class="news-box-title">新闻信息列表</div>
        <div class="news-scroll-area fixed-header-table">
          <table class="news-table">
            <thead>
            <tr>
              <th style="width: 50px">序号</th>
              <th style="width: 130px">来源</th>
              <th style="width: 120px">标题</th>
              <th style="width: 160px">时间</th>
              <th style="width: 80px">发布者</th>
              <th>内容</th>
              <th style="width: 90px">实体分类</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="(news, index) in newsDataList" :key="news.newId">
              <td :title="(pageNum - 1) * pageSize + index + 1">{{ (pageNum - 1) * pageSize + index + 1 }}</td>
              <td class="truncate-content" :title="news.sourceName">{{ news.sourceName }}</td>
              <td class="truncate-content" :title="news.title">{{ news.title }}</td>
              <td class="truncate-content" :title="formatDate(news.publishTime)">{{ formatDate(news.publishTime) }}</td>
              <td class="truncate-content" :title="news.publishName">{{ news.publishName }}</td>
              <td class="truncate-content" :title="news.content">{{ news.content }}</td>
              <td class="truncate-content" :title="news.newEntity">{{ news.newEntity }}</td>
            </tr>
            </tbody>

          </table>
        </div>
        <div style="display: flex; justify-content: center;">
        <el-pagination
            style="text-align: center; margin-top: 10px;"
            background
            layout="prev, pager, next"
            :current-page="pageNum"
            :page-size="pageSize"
            :total="total"
            :page-sizes="[5]"
            @current-change="handlePageChange"
        />
        </div>
      </div>
      </div>


    <div class="knowledgeGraph">
      <div class="chartContainer" ref="chart"></div>
      <div class="restart">
        <button @click="getData(lastDisasterData)">一键复原</button>
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
      <div class="toggle-button closed" @click="closePanel">关闭</div>

      <div class="disaster-list">
        <table v-if="tableData.length" class="disaster-table">
          <thead>
          <tr>
            <th style="width: 50px">序号</th>
            <th>灾害名称</th>
            <th>发生时间</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="(item, index) in tableData" :key="item.eqid">
            <td>{{ (currentPage - 1) * pageSizeNum + index + 1 }}</td>
            <td>
             <span class="clickable"
                   @click="getData(item)"
                   :title="item.disasterName">{{ item.disasterName }}</span>
            </td>
            <td :title="formatDate(item.occurTime)">
              {{ formatDate(item.occurTime) }}
            </td>
          </tr>
          </tbody>
        </table>
        <div v-else class="no-data">暂无灾害信息</div>
      </div>

      <!-- 分页控件 -->
      <el-pagination
          style="margin-top: 10px; text-align: center;"
          background
          layout="prev, pager, next"
          :total="disTotal"
          :page-size="pageSizeNum"
          :current-page="currentPage"
          @current-change="handlePageChangeDisaster"
      />
    </div>

    <!-- 底部时间轴组件 -->
    <div class="timeline-container">
      <div class="timeline-scroll" ref="timelineScroll">
        <div class="timeline-wrapper" ref="timelineWrapper">
          <!-- 横线容器 - 用于连接所有月份 -->
          <div class="timeline-connector"></div>

          <div
              class="timeline-item"
              v-for="(month, index) in months"
              :key="index"
              :class="{ active: currentMonth === index }"
              @click="handleMonthClick(index)"
              @mouseenter="showTooltip(index, $event)"
              @mouseleave="hideTooltip"
          >
            <div class="month-circle"></div>
            <div class="month-label">{{ month }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 灾害提示框 -->
    <div v-if="tooltipVisible" class="tooltip" :style="tooltipStyle">
      <div class="tooltip-title">频发灾害</div>
      <div class="tooltip-content">
        <div v-for="(disaster, idx) in currentDisasters" :key="idx">
          {{ disasterMap[disaster] || disaster }}
        </div>
      </div>
    </div>


  </div>
</template>

<script setup>
import {Search} from "@element-plus/icons-vue";
import * as echarts from 'echarts';
import {ref, onMounted, onBeforeUnmount, nextTick} from 'vue';
import {getChartDataBy, getEarthquakeRainPage, getNewsPage} from "@/api/system/knowledgeGraph.js";
import {ElMessage} from "element-plus";
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
    description:"灾害实体"
  },
  {
    id:1,
    img:eqentity2,
    description:"一级实体"
  },
  {
    id:2,
    img:eqentity3,
    description:"二级实体"
  },
  {
    id:3,
    img:eqentity4,
    description:"三级实体"
  },
]
// 定义要触发的事件
const emit = defineEmits(['bigGraphShow'])
// 响应式数据
const inputValue = ref('');
const currentIndex = ref(null);
const showChat = ref(false);
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
const echartsInstance = ref(null);
// 控制左侧列表是否隐藏
const ifShowCatalog = ref(true);
const list = ref([]);

//新闻模块************
const isNewsBoxVisible = ref(true)
const newsDataList = ref([])
const pageNum = ref(1)
const pageSize = ref(6)
const currentPage = ref(1)
const pageSizeNum=ref(5)
const total = ref(0)
const disTotal = ref(0)
// 控制面板和新闻框显示
const isPanelShow = ref({ NewsInfo: false })
// 按钮点击处理
const handleNewsPanel = () => {
  isPanelShow.value.NewsInfo = !isPanelShow.value.NewsInfo
  isNewsBoxVisible.value = isPanelShow.value.NewsInfo
}
//新闻数据处理逻辑
const fetchNewsData = async (item = lastItem) => {
  lastItem = item
  console.log('最新数据lastItem:', lastItem)
  try {
    const res = await getNewsPage(pageNum.value, pageSize.value, lastItem)
    console.log("新闻数据",res)
    if (res.code === 200) {
      newsDataList.value = res.data.records
      total.value = res.data.total
    } else {
      ElMessage.error('获取新闻失败')
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('请求异常')
  }
}
// 新增：存储完整原始数据（不做过滤，用于查询）
const fullData = ref([]);
const fullLinks = ref([]);


// 分页变化时调用
const handlePageChange = (newPage) => {
  pageNum.value = newPage
  fetchNewsData() // 使用已有 lastItem
}
const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleString()
}
//新闻模块结束*********************


// 时间轴相关变量****************
const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
const currentMonth = ref(new Date().getMonth());
const timelineScroll = ref(null)
const timelineWrapper = ref(null)
const timer = ref(null)
// 月份与灾害类型的映射关系（索引0=1月，11=12月）
const monthDisasterMap = [
  // 1月
  ['snow', 'coldDamage', 'earthquake', 'safetyAccident'],
  // 2月
  ['snow', 'coldDamage', 'earthquake', 'safetyAccident'],
  // 3月
  ['snow', 'drought', 'sandstorm', 'bioDisaster', 'earthquake', 'safetyAccident'],
  // 4月
  ['collapse', 'landslide', 'galeHail', 'bioDisaster', 'earthquake', 'safetyAccident'],
  // 5月
  ['collapse', 'landslide', 'heatwave', 'drought', 'galeHail', 'sandstorm', 'bioDisaster', 'wildfire', 'earthquake', 'safetyAccident'],
  // 6月
  ['rain', 'debrisFlow', 'collapse', 'landslide', 'heatwave', 'bioDisaster', 'earthquake', 'safetyAccident'],
  // 7月
  ['rain', 'debrisFlow', 'collapse', 'landslide', 'heatwave', 'galeHail', 'bioDisaster', 'earthquake', 'safetyAccident'],
  // 8月
  ['rain', 'debrisFlow', 'collapse', 'landslide', 'heatwave', 'bioDisaster', 'earthquake', 'safetyAccident'],
  // 9月
  ['rain', 'debrisFlow', 'collapse', 'landslide', 'earthquake', 'safetyAccident'],
  // 10月
  ['collapse', 'landslide', 'wildfire', 'earthquake', 'safetyAccident'],
  // 11月
  ['snow', 'coldDamage', 'wildfire', 'earthquake', 'safetyAccident'],
  // 12月
  ['snow', 'coldDamage', 'earthquake', 'safetyAccident']
];
// 鼠标悬浮显示灾害
const tooltipVisible = ref(false);
const tooltipStyle = ref({ top: '0px', left: '0px' });
const currentDisasters = ref([]);

// 英文 -> 中文映射
const disasterMap = {
  snow: '雪灾',
  coldDamage: '风雹',
  earthquake: '地震',
  safetyAccident: '安全事故',
  drought: '干旱',
  sandstorm: '沙尘暴',
  bioDisaster: '生物灾害',
  collapse: '崩塌',
  landslide: '滑坡',
  galeHail: '风雹',
  heatwave: '高温',
  wildfire: '森林火灾',
  rain: '暴雨',
  debrisFlow: '泥石流'
}

// 获取优先展示的灾害（优先有图谱，否则第一条）
const getPreferredItem = async () => {
  if (allData.value.length === 0) return null;

  const checks = await Promise.all(
      allData.value.map(async (item) => ({
        item,
        hasChart: await hasChartData(item)
      }))
  );

  const firstWithChart = checks.find(c => c.hasChart);
  return firstWithChart ? firstWithChart.item : allData.value[0];
};


// 判断是否有图谱数据
const hasChartData = async (item) => {
  const eqid = getEqId(item);
  if (!eqid) return false;
  const res = await getChartDataBy(eqid, item.disasterType);
  return res && res.length > 0;
};

// 获取灾害 ID（支持14种类型）
const disasterIdMap = {
  earthquake: 'earthquakeDisasterId',  // 地震
  rain: 'rainDisasterId',              // 暴雨
  snow: 'snowDisasterId',              // 积雪
  coldDamage: 'coldDamageDisasterId',  // 冷害
  collapse: 'collapseDisasterId',      // 崩塌
  landslide: 'landslideDisasterId',    // 滑坡
  debrisFlow: 'debrisFlowDisasterId',  // 泥石流
  galeHail: 'galeHailDisasterId',      // 风雹
  sandstorm: 'sandstormDisasterId',    // 沙尘暴
  drought: 'droughtDisasterId',        // 干旱
  heatwave: 'heatwaveDisasterId',      // 高温
  wildfire: 'wildfireDisasterId',      // 森林火灾
  bioDisaster: 'bioDisasterId',        // 生物灾害
  safetyAccident: 'safetyAccidentDisasterId' // 安全事故
};


const getEqId = (item) => {
  if (!item?.disasterType) return null;
  const key = disasterIdMap[item.disasterType];
  return key ? item[key] : null;
};
// 获取优先展示的灾害结束


function showTooltip(index, event) {
  currentDisasters.value = monthDisasterMap[index]
  tooltipVisible.value = true

  nextTick(() => { // 等DOM更新
    const tooltipEl = document.querySelector('.tooltip')
    if (!tooltipEl) return
    const tooltipHeight = tooltipEl.offsetHeight
    const offsetY = 30 // 弹框与鼠标的垂直间距
    const offsetX = 20 // 弹框与鼠标的水平间距
    let top = event.clientY - tooltipHeight - offsetY // 由下向上
    let left = event.clientX - offsetX
    // 边界处理
    if (top < 0) top = event.clientY + offsetY
    if (left < 0) left = 0

    tooltipStyle.value = {
      top: `${top}px`,
      left: `${left}px`,
      backgroundColor: 'rgba(255,255,255,0.95)', // 白底
      color: '#000',
      padding: '6px 10px',
      borderRadius: '6px',
      fontSize: '14px',
      pointerEvents: 'none',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      maxWidth: '220px'
    }
  })
}


function hideTooltip() {
  tooltipVisible.value = false
}
const autoPlayEnabled = ref(true);

// 点击月份切换
const handleMonthClick = async (index) => {
  autoPlayEnabled.value = false // 暂停自动轮播
  currentMonth.value = index;
  scrollToCurrentMonth();
  currentPage.value = 1;

  await fetchData();
  const targetItem = await getPreferredItem();
  if (targetItem) await getData(targetItem);
};

// 切换到下一个月（自动轮播用）
const nextMonth = async () => {
  if (!autoPlayEnabled.value) return; // 用户操作后直接返回，不跳转

  currentMonth.value = (currentMonth.value + 1) % months.length;
  scrollToCurrentMonth();
  currentPage.value = 1;

  await fetchData();
  const targetItem = await getPreferredItem();
  if (targetItem) await getData(targetItem);
};

// 鼠标悬停或点击恢复自动轮播
const enableAutoPlay = () => {
  autoPlayEnabled.value = true
}

// 初始化自动轮播
const resetTimer = () => {
  if (timer.value) clearInterval(timer.value)
  timer.value = setInterval(() => {
    nextMonth()
  }, 180000)
}


// 滚动到当前选中月份
const scrollToCurrentMonth = () => {
  if (timelineScroll.value && timelineWrapper.value) {
    const itemWidth = 100 // 每个月份项宽度
    const scrollLeft = currentMonth.value * itemWidth - 200 // 居中显示
    timelineScroll.value.scrollTo({
      left: scrollLeft > 0 ? scrollLeft : 0,
      behavior: 'smooth'
    })
  }
}
//时间轴结束**************



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
      layoutAnimation: true, // 关闭布局动画（关键：避免新增节点时的位置突变）
      gravity: 0.1, // 降低引力，减少整体向中心聚集的趋势
      friction: 0.9 // 增加摩擦系数，让布局更快稳定
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



// 多灾害列表数据***************
const allData = ref([]); // 保存全量数据
const tableData = ref([]); // 当前页数据
//默认最新灾害数据
let lastItem = null;
// 最新的灾害数据
const lastDisasterData = ref([])
// 最新的灾害的eqid
const lastDiasterId = ref()
const lastEqRainId = ref()

const fetchData = async () => {
  try {
    const allowedTypes = monthDisasterMap[currentMonth.value] || [];
    let page = 1;
    const tempData = [];

    while (true) {
      const res = await getEarthquakeRainPage({
        pageNum: page,
        pageSize: 5, // 后端分页固定 5 条
        disasterTypes: allowedTypes
      });

      const records = res.data.records || [];
      if (records.length === 0) break;

      tempData.push(...records);

      if (tempData.length >= res.data.total) break; // 已加载完所有数据
      page++;
    }

    allData.value = tempData;
    disTotal.value = tempData.length;

    // 初始化第一页数据
    updateTableData();

    console.log('全量数据:', allData.value);
  } catch (error) {
    console.error('请求数据失败', error);
    allData.value = [];
    tableData.value = [];
    disTotal.value = 0;
  }
};

// 更新当前页数据
const updateTableData = () => {
  const start = (currentPage.value - 1) * pageSizeNum.value;
  const end = currentPage.value * pageSizeNum.value;
  tableData.value = allData.value.slice(start, end);
};


// 翻页事件
const handlePageChangeDisaster = (page) => {
  currentPage.value = page;
  updateTableData();
};


const closePanel = () => {
  showChat.value = false
}
//多灾害列表结束***************



const router = useRouter();
// 计算一共有多少个实体球
const chartDataCount = ref();
// 获取数据并初始化图表
/**
 * 过滤图谱数据，只保留与当前灾害 eqid 对应的关系
 * @param {Array} data - 后端返回的原始图谱数组
 * @param {String} disasterType - 当前灾害类型，例如 'rain', 'earthquake'
 * @param {String} eqid - 当前灾害 ID
 * @returns {Array} 过滤后的图谱数组
 */
const filterGraphByDisasterType = (data, disasterType, eqid) => {
  const fieldMap = {
    earthquake: 'earthquakeDisasterId',
    rain: 'rainDisasterId',
    snow: 'snowDisasterId',
    coldDamage: 'coldDamageDisasterId',
    collapse: 'collapseDisasterId',
    landslide: 'landslideDisasterId',
    debrisFlow: 'debrisFlowDisasterId',
    galeHail: 'galeHailDisasterId',
    sandstorm: 'sandstormDisasterId',
    drought: 'droughtDisasterId',
    heatwave: 'heatwaveDisasterId',
    wildfire: 'wildfireDisasterId',
    bioDisaster: 'bioDisasterId',
    safetyAccident: 'safetyAccidentDisasterId'
  };
  const idField = fieldMap[disasterType];
  if (!idField || !eqid) return [];

  return data.filter(item => {
    const targetId = item.target[idField];
    // 严格判断 target 中是否包含当前 eqid
    return targetId === eqid;
  });
};




const getData = async (item) => {
  console.log("item", item)
  await fetchNewsData(item);
  try {
    if (!item || !item.disasterType) {
      console.warn("无效灾害数据");
      return;
    }
    let eqid;
    let disasterType;
    if (item.disasterType === 'rain') {
      eqid = item.rainDisasterId;
      disasterType = 'rain';
    } else if (item.disasterType === 'earthquake') {
      eqid = item.earthquakeDisasterId;
      disasterType = 'earthquake';
    } else {
      // 其他灾害类型处理逻辑，比如洪水、台风
      eqid = null;
      disasterType = 'unknown';
    }

    if (!eqid) {
      console.warn("灾害 ID 缺失，无法获取图谱");
      return;
    }

    // 更新记录
    lastEqRainId.value = eqid;
    lastDiasterId.value = eqid;
    lastDisasterData.value = item;

    // 设置不同的分类数据结构
    firstData.value = [
      { name: '突发事件' },
      { name: '危险源和风险隐患区' },
      { name: '防护目标' },
      { name: '应急保障资源' },
      { name: '应急知识' },
      { name: '应急预案' },
      { name: '应急平台' }
    ];
    secondData.value = [
      // 对应“突发事件”的二级分类（原始结构中“自然灾害/事故灾难...”为二级）
      { name: '自然灾害' },
      { name: '事故灾难' },
      { name: '公共卫生事件' },
      { name: '社会安全事件' },

      // 对应“危险源和风险隐患区”的二级分类
      { name: '自然灾害风险隐患区' },
      { name: '事故灾难风险隐患区' },
      { name: '公共卫生风险隐患区' },
      { name: '社会安全风险隐患区' },

      // 对应“防护目标”的二级分类
      { name: '重要部位' },
      { name: '关键基础设施' },

      // 对应“应急保障资源”的二级分类
      { name: '应急机构' },
      { name: '应急人力资源' },
      { name: '应急物资保障资源' },
      { name: '应急通信资源' },
      { name: '应急运输与物流资源' },
      { name: '医疗卫生资源' },
      { name: '应急避难场区' },
      { name: '应急财力资源' },

      // 对应“应急知识”的二级分类
      { name: '法律法规' },
      { name: '技术规范' },

      // 对应“应急预案”的二级分类
      { name: '国家级应急预案' },
      { name: '省级应急预案' },
      { name: '市级应急预案' },
      { name: '县级应急预案' },
      { name: '基层应急预案' },
      { name: '企业级应急预案' },
      { name: '军队应急预案' },

      // 对应“应急平台”的二级分类
      { name: '国务院应急平台' },
      { name: '地方应急平台' },
      { name: '部门应急平台' },
      { name: '基层应急平台' },
      { name: '企业应急平台' },
      { name: '军队应急平台' },
      { name: '移动应急平台' }
    ];
    list.value = [
        {
          id: 1,
          value: '突发事件',
          isOpen: false,
          children: [
            { id: 11, value: '自然灾害' },
            { id: 12, value: '事故灾难' },
            { id: 13, value: '公共卫生事件' },
            { id: 14, value: '社会安全事件' }
          ],
          fatherCount: 4
        },
        {
          id: 2,
          value: '危险源和风险隐患区',
          isOpen: false,
          children: [
            { id: 21, value: '自然灾害风险隐患区' },
            { id: 22, value: '事故灾难危险源' },
            { id: 23, value: '公共卫生危险源' },
            { id: 24, value: '社会安全隐患' }
          ],
          fatherCount: 4
        },
        {
          id: 3,
          value: '防护目标',
          isOpen: false,
          children: [
            { id: 31, value: '重要部位' },
            { id: 32, value: '关键基础设施' }
          ],
          fatherCount: 2
        },
        {
          id: 4,
          value: '应急保障资源',
          isOpen: false,
          children: [
            { id: 41, value: '应急机构' },
            { id: 42, value: '应急人力资源' },
            { id: 43, value: '应急物资保障资源' },
            { id: 44, value: '应急通信资源' },
            { id: 45, value: '应急运输与物流资源' },
            { id: 46, value: '医疗卫生资源' },
            { id: 47, value: '应急避难场区' },
            { id: 48, value: '应急财力资源' }
          ],
          fatherCount: 8
        },
        {
          id: 5,
          value: '应急知识',
          isOpen: false,
          children: [
            { id: 51, value: '法律法规' },
            { id: 52, value: '技术规范' }
          ],
          fatherCount: 2
        },
        {
          id: 6,
          value: '应急预案',
          isOpen: false,
          children: [
            { id: 61, value: '国家级应急预案' },
            { id: 62, value: '省级应急预案' },
            { id: 63, value: '市级应急预案' },
            { id: 64, value: '县级应急预案' },
            { id: 65, value: '基层应急预案' },
            { id: 66, value: '企业级应急预案' },
            { id: 67, value: '军队应急预案' }
          ],
          fatherCount: 6
        },
        {
          id: 7,
          value: '应急平台',
          isOpen: false,
          children: [
            { id: 71, value: '国务院应急平台' },
            { id: 72, value: '地方应急平台' },
            { id: 73, value: '部门应急平台' },
            { id: 74, value: '基层应急平台' },
            { id: 75, value: '企业应急平台' },
            { id: 76, value: '军队应急平台' },
            { id: 77, value: '移动应急平台' }
          ],
          fatherCount: 7
        }
      ];
    // 获取图谱数据
    const res = await getChartDataBy(eqid, disasterType);

// 只保留 target 中属于当前灾害 ID 的关系
    const filteredRes = filterGraphByDisasterType(res, disasterType, eqid);

// 构建 links
    chartLinks.value = filteredRes.map(item => ({
      source: item.source.name,
      target: item.target.name,
      value: item.value.type
    }));

// 构建节点
    const nodeMap = new Map();
    filteredRes.forEach(item => {
      nodeMap.set(item.source.name, item.source);
      nodeMap.set(item.target.name, item.target);
    });
    chartData.value = Array.from(nodeMap.values());
    console.log("图标匹配",chartData.value)
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
      if (item.name === lastDisasterData.value.disasterName) {
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

// 计算节点层级并返回前三级节点和关联关系
const filterTopThreeLevels = () => {
  // 假设lastDisasterData是根节点(第一级)
  const rootNode = lastDisasterData.value.disasterName;
  if (!rootNode) return { data: [], links: [] };
  // 层级映射表，根节点为第1级
  const nodeLevels = { [rootNode]: 1 };
  // 待处理的节点队列
  const queue = [rootNode];
  // 收集前三级节点
  const topThreeNodes = new Set([rootNode]);
  // 收集前三级节点间的连接
  const topThreeLinks = [];

  // 遍历计算节点层级（基于完整数据）
  while (queue.length > 0) {
    const currentNode = queue.shift();
    const currentLevel = nodeLevels[currentNode];

    // 如果当前节点已是第三级，则不再处理其子节点
    if (currentLevel >= 3) continue;

    // 找到当前节点的直接子节点连接（使用完整links数据）
    const childLinks = fullLinks.value.filter(link => link.source === currentNode);

    childLinks.forEach(link => {
      const childNode = link.target;

      // 记录子节点层级
      if (!nodeLevels[childNode]) {
        nodeLevels[childNode] = currentLevel + 1;
        queue.push(childNode);

        // 如果是前三级节点，添加到展示集合中
        if (nodeLevels[childNode] <= 3) {
          topThreeNodes.add(childNode);
          topThreeLinks.push(link);
        }
      } else if (nodeLevels[childNode] <= 3) {
        // 已存在但仍在前三级的节点，添加连接
        topThreeLinks.push(link);
      }
    });
  }

  // 过滤出前三级的节点数据（使用完整data数据）
  const filteredData = fullData.value.filter(node =>
      topThreeNodes.has(node.name)
  );
  return {
    data: filteredData,
    links: topThreeLinks
  };
};

// 初始化图表
const initChart = () => {
  if (!chart.value) return;
  if (echartsInstance.value !== null) {
    echartsInstance.value.dispose();
  }

  // 保存完整数据副本（用于查询）
  fullData.value = [...chartStartData.value];
  fullLinks.value = [...chartStartLinks.value];

  // 获取前三级数据（用于展示）
  const { data: topThreeData, links: topThreeLinks } = filterTopThreeLevels();

  // 只展示前三级
  chartStartData.value = [...topThreeData];
  chartStartLinks.value = [...topThreeLinks];

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


// 点击节点触发函数,用于记录已展开的节点名
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
    if (item.name === lastDisasterData.value.disasterName) {
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

// 关闭多灾害信息列表
const updateChartData = () => {
  showChat.value = !showChat.value;
  nextTick(() => {
    handleResize();
  });
};

// 优化：模糊查找匹配的节点下标（基于完整数据）
const findNodeIndexes = (keyword) => {
  if (!keyword) return [];
  const lowerKeyword = keyword.toLowerCase();
  return fullData.value  // 这里改为使用完整数据
      .map((node, index) => ({
        name: node.name,
        index
      }))
      .filter(item => item.name.toLowerCase().includes(lowerKeyword))
      .map(item => ({
        ...item,
        // 标记该节点是否当前可见
        isVisible: chartStartData.value.some(n => n.name === item.name)
      }));
};

// 优化：模糊查找匹配的边（基于完整数据）
const findLinkMatches = (keyword) => {
  if (!keyword) return [];
  const lowerKeyword = keyword.toLowerCase();
  return fullLinks.value  // 这里改为使用完整数据
      .filter(link => {
        const sourceMatch = link.source?.toLowerCase().includes(lowerKeyword);
        const targetMatch = link.target?.toLowerCase().includes(lowerKeyword);
        const valueMatch = link.value?.toString().toLowerCase().includes(lowerKeyword);
        const labelMatch = typeof link.label?.formatter === 'string' &&
            link.label.formatter.toLowerCase().includes(lowerKeyword);
        return sourceMatch || targetMatch || valueMatch || labelMatch;
      })
      .map(link => ({
        ...link,
        // 标记该边是否当前可见
        isVisible: chartStartLinks.value.some(l =>
            l.source === link.source && l.target === link.target
        )
      }));
};

// 优化：聚焦节点（如果节点不可见则自动展开路径）
const focusNode = (keyword) => {
  if (!keyword?.trim()) {
    inputValue.value = '';
    return;
  }
  const matchedNodes = findNodeIndexes(keyword);
  const matchedLinks = findLinkMatches(keyword);
  if (matchedNodes.length === 0 && matchedLinks.length === 0) {
    ElMessage.warning(`未找到包含 "${keyword}" 的节点或关系`);
    inputValue.value = '';
    return;
  }
  // 检查是否有匹配但不可见的节点，需要自动展开
  const invisibleNodes = matchedNodes.filter(n => !n.isVisible);
  if (invisibleNodes.length > 0) {
    ElMessage.info(`正在展开包含"${keyword}"的节点...`);
    // 自动展开这些节点的路径
    invisibleNodes.forEach(node => {
      expandNodePath(node.name);
    });
  }
  // 检查 link 是否不可见，如果不可见，自动展开其路径
  const invisibleLinks = matchedLinks.filter(l => !l.isVisible);
  if (invisibleLinks.length > 0) {
    ElMessage.info(`正在展开包含"${keyword}"的关系...`);
    invisibleLinks.forEach(link => {
      expandNodePath(link.source); // 从 link 的 source 开始展开
      expandNodePath(link.target); // 确保 target 也展开
    });
  }

  // 恢复默认视图
  echartsInstance.value.dispatchAction({ type: 'restore' });
  // 高亮匹配节点
  matchedNodes.forEach(item => {
    // 从当前展示数据中找到索引
    const displayIndex = chartStartData.value.findIndex(n => n.name === item.name);
    if (displayIndex !== -1) {
      echartsInstance.value.dispatchAction({ type: 'highlight', name: item.name });
      echartsInstance.value.dispatchAction({
        type: 'focusNodeAdjacency',
        seriesIndex: 0,
        dataIndex: displayIndex
      });
    }
  });

  // 高亮匹配边
  matchedLinks.forEach(link => {
    if (link.isVisible) {
      const sourceIndex = chartStartData.value.findIndex(n => n.name === link.source);
      const targetIndex = chartStartData.value.findIndex(n => n.name === link.target);

      [sourceIndex, targetIndex].forEach(idx => {
        if (idx !== -1) {
          echartsInstance.value.dispatchAction({ type: 'highlight', name: chartStartData.value[idx].name });
        }
      });
    }
  });
};

// 新增：自动展开节点路径（从根节点到目标节点）
const expandNodePath = (targetNode) => {
  // 找到从根节点到目标节点的路径
  const path = findPathToNode(lastDisasterData.value.disasterName, targetNode);

  // 依次展开路径上的节点
  path.forEach(nodeName => {
    if (!expandedNodes.has(nodeName)) {
      // 模拟点击展开节点
      const nodeData = { name: nodeName };
      handleNodeClick(nodeData);
    }
  });
};

// 新增：查找从源节点到目标节点的路径
const findPathToNode = (sourceNode, targetNode) => {
  const visited = new Set();
  const path = [];

  const dfs = (currentNode) => {
    if (visited.has(currentNode)) return false;
    visited.add(currentNode);
    path.push(currentNode);

    if (currentNode === targetNode) return true;

    // 查找当前节点的所有子节点
    const childNodes = fullLinks.value
        .filter(link => link.source === currentNode)
        .map(link => link.target);

    for (const child of childNodes) {
      if (dfs(child)) return true;
    }

    // 没有找到路径，回溯
    path.pop();
    return false;
  };

  dfs(sourceNode);
  return path;
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
  const newChild = { name: child.value };
  handleNodeClick(newChild);
  focusNode(newChild.name);
};



onMounted(async () => {
  await fetchData();
  const targetItem = await getPreferredItem();
  if (targetItem) await getData(targetItem);
  resetTimer();
});



onBeforeUnmount(() => {
  if (echartsInstance.value) {
    echartsInstance.value.dispose();
    window.removeEventListener('resize', handleResize);
  }
  if (timer.value) {
    clearInterval(timer.value)
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
        border: 1px solid #48D1CC;
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
        border: 1px solid #48D1CC;
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
      bottom: 2px;
      z-index:1;
      left:1vw;
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


//多灾害列表***********
  .chat-panel {
    position: absolute;
    bottom: 80px;
    right: 20px;
    width: 600px;
    background: #ffffff;
    border-radius: 10px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
    padding: 20px;
    font-family: "Microsoft YaHei", sans-serif;
    z-index: 1000;
  }

  .chat-title {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 12px;
    color: #333;
  }
  .toggle-button.closed {
    position: absolute;
    top: 10px;
    right: 15px;
    cursor: pointer;
    color: #666;
    font-size: 14px;
    width: 150px;
  }
  .disaster-list {
    max-height: 350px;
    overflow-y: auto;
    overflow-x: auto; /* 横向滚动条 */
  }

  .disaster-table {
    min-width: 600px; /* 超过容器就会横向滚动 */
    border-collapse: collapse;
    font-size: 14px;
    width: 100%;
    table-layout: fixed;
  }

  .disaster-table th,
  .disaster-table td {
    padding: 10px;
    text-align: center;
    border-bottom: 1px solid #eaeaea;
    color: #333;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 180px;
    position: relative;
  }

  /* 鼠标悬停显示完整内容 */
  .disaster-table td:hover::after {
    content: attr(title);
    position: absolute;
    white-space: normal;
    background-color: #fff;
    border: 1px solid #ccc;
    padding: 5px 8px;
    z-index: 10;
    left: 50%;
    top: 100%;
    transform: translateX(-50%);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    max-width: 300px;
  }

  .disaster-table th {
    background-color: #f5f7fa;
    font-weight: 600;
  }

  .no-data {
    color: #999;
    text-align: center;
    margin-top: 20px;
  }
  //多灾害列表结束****************************


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
      width: 16vw;
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
      overflow-y: auto;
      min-height: 0; /* 防止撑开容器（必须） */

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

/* 外层容器给固定高度，例如你整个区域高度为400px */
.container {
  height: 600px;
  display: flex;
  flex-direction: column;
  margin-bottom: 50px; /* 确保与按钮有间隔 */
}

.button.themes {
  flex-shrink: 0;
  height: 40px;
  margin-left: 10px;
  margin-right: 10px;
  border: 1px solid #409EFF; /* 设置边框颜色 */
  border-radius: 6px;
  color: #409EFF;
  background-color: white; /* 按钮白底 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); /* 添加轻微阴影 */
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.button.themes:hover {
  background-color: #ecf5ff; /* hover 状态颜色 */
}

.button.themes.active {
  background-color: #409EFF;
  color: white;
  border: 1px solid #409EFF;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

//新闻列表
.news-float-box {
  position: absolute;
  top: 10px;
  right: 20px;
  bottom: 60px;
  width: 500px;
  max-height: 400px;
  border: 1px solid #ddd;
  background: rgba(0, 0, 0, 0.4); /* 半透明黑色背景 */
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  padding: 20px;
  z-index: 999;
  font-family: "Microsoft YaHei", sans-serif;
  overflow: hidden;
  text-align: center;
}

.news-box-title {
  font-weight: bold;
  margin-bottom: 8px;
  font-size: 16px;
  color: #FFFFFF;
}

.news-scroll-area {
  /* 限制最大高度，超出滚动 */
  max-height: 300px;
  overflow-y: auto;
}
.fixed-header-table table {
  border-collapse: collapse;
  width: 100%;
  table-layout: fixed;
}

.fixed-header-table thead th {
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 1px solid #ccc;
}
.news-table {
  min-width: 800px; /* ✅ 设置表格整体宽度，触发横向滚动 */
  width: 100%;
  border-collapse: collapse;
  font-size: 15px;
}


.news-table th,
.news-table td {
  padding: 8px;
  border-bottom: 1px solid #eee;
  text-align: center;
  color: #FFFFFF;
}

.news-table th {
  background-color: #909399;
  font-weight: 600;
}

.truncate-content {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

// 时间轴组件样式（调整后）
.timeline-container {
  position: absolute;
  bottom: 20px;
  left: 55%;
  transform: translateX(-50%);
  width: 35%;
  max-width: 1200px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;

  .timeline-title {
    color: #333;
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 10px;
  }


  .timeline-wrapper {
    display: flex;
    gap: 25px; /* 增大间距，适应中文显示 */
    padding: 0 20px;
    position: relative;
  }

  .timeline-connector {
    position: absolute;
    top: 10px; /* 调整横线位置以适应更小的圆圈 */
    left: 30px;
    right: 30px; /* 向右延伸一点，确保截止到12月的球 */
    height: 2px;
    background: linear-gradient(90deg,
    rgba(64, 158, 255, 0.3) 0%,
    rgba(64, 158, 255, 0.8) 50%,
    rgba(64, 158, 255, 0.3) 100%);
    z-index: 0;
  }

  .timeline-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    z-index: 1;
    width: 30px; /* 固定宽度确保对齐 */
    text-align: center;

    // 进一步缩小圆形尺寸
    .month-circle {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background-color: rgba(255, 255, 255, 0.8);
      border: 2px solid #409EFF;
      transition: all 0.3s ease;
    }

    .month-label {
      margin-top: 5px;
      font-size: 12px;
      color: #666;
      transition: all 0.3s ease;
    }

    &:hover {
      .month-circle {
        transform: scale(1.2);
        box-shadow: 0 0 8px rgba(64, 158, 255, 0.5);
      }
    }

    &.active {
      .month-circle {
        background-color: #409EFF;
        color: white;
        box-shadow: 0 0 12px rgba(64, 158, 255, 0.7);
      }

      .month-label {
        color: #409EFF;
        font-weight: 600;
      }
    }
  }

  .timeline-controls {
    display: flex;
    gap: 15px;
    margin-top: 10px;

    .control-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 1px solid #409EFF;
      background-color: white;
      color: #409EFF;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        background-color: #409EFF;
        color: white;
        transform: scale(1.1);
      }
    }
  }
}
// 调整底部元素位置
.knowledgeGraph {
  padding-bottom: 100px;
}

.tooltip {
  position: fixed;
  background-color: #ffffff;   /* 白底 */
  color: #000000;              /* 黑字 */
  padding: 8px 12px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  font-size: 18px;
  pointer-events: none;
  z-index: 9999;
  width: 100px;
}

.tooltip div {
  margin: 2px 0; /* 每条灾害间距 */
}

.tooltip-title {
  font-weight: bold;
  text-align: center;
  margin-bottom: 4px;
  font-size: 16px;
  color: #333;
}

</style>


