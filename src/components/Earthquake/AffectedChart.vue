<template>
  <div class="bar-chart-container">
    <!-- 区县标题 - 使用当前选中区县的district值 -->
    <div class="district-title">{{ currentDistrictData?.district || '区县数据' }} 受暴雨影响</div>

    <!-- 图表容器 -->
    <div ref="chartRef" class="chart"></div>

    <!-- 分页控制按钮 -->
    <div class="pagination-controls">
      <button
          @click="prevPage"
          :disabled="currentPage === 1"
          class="page-btn"
      >
        <
      </button>
      <span class="page-info">
        第 {{ currentPage }} / {{ totalPages }} 页
      </span>
      <button
          @click="nextPage"
          :disabled="currentPage === totalPages"
          class="page-btn"
      >
        >
      </button>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts';

export default {
  name: 'AffectedChart',
  props: {
    extraOptions: {
      type: Object,
      default() {
        return {
          title: '长安区'
        };
      }
    },
    dimensions: {
      type: Array,
      default() {
        return ['grade', '高', '中', '低'];
      }
    },
    source: {
      type: Array,
      default() {
        return [
          {
            district: '灞桥区',
            disasters: [
              {type: '滑坡', '高': 43, '中': 85, '低': 93},
              {type: '泥石流', '高': 83, '中': 73, '低': 55},
              {type: '山洪', '高': 86, '中': 65, '低': 82},
              {type: '内涝', '高': 72, '中': 53, '低': 39}
            ]
          },
          {
            district: '碑林区',
            disasters: [
              {type: '滑坡', '高': 12, '中': 35, '低': 43},
              {type: '泥石流', '高': 5, '中': 13, '低': 25},
              {type: '山洪', '高': 8, '中': 25, '低': 32},
              {type: '内涝', '高': 32, '中': 63, '低': 89}
            ]
          }
        ];
      }
    },
    pageSize: {
      type: Number,
      default: 1
    },

  },
  data() {
    return {
      myChart: null,
      app: {
        configParameters: {},
        config: {}
      },
      currentPage: 1,
      // 风险等级颜色配置
      riskColors: {
        '高': '#ff4d4f', // 红色
        '中': '#faad14', // 土黄色
        '低': '#52c41a'  // 绿色
      }
    };
  },
  computed: {
    totalPages() {
      return Math.ceil(this.source.length / this.pageSize);
    },
    currentDistrictData() {
      const startIndex = (this.currentPage - 1) * this.pageSize;
      const endIndex = startIndex + this.pageSize;
      return this.source.slice(startIndex, endIndex)[0];
    }
  },
  watch: {
    // 监听页码变化更新图表
    currentPage() {
      this.setChartOptions();
    },
    // 监听数据源变化，重置到第一页
    source() {
      this.currentPage = 1;
      this.setChartOptions();
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.initConfig();
      this.initChart();
    });
  },
  beforeDestroy() {
    this.destroyChart();
  },
  methods: {
    initConfig() {
      const posList = [
        'left', 'right', 'top', 'bottom', 'inside',
        'insideTop', 'insideLeft', 'insideRight', 'insideBottom',
        'insideTopLeft', 'insideTopRight', 'insideBottomLeft', 'insideBottomRight'
      ];

      this.app.configParameters = {
        rotate: {min: -90, max: 90},
        align: {options: {left: 'left', center: 'center', right: 'right'}},
        verticalAlign: {options: {top: 'top', middle: 'middle', bottom: 'bottom'}},
        position: {
          options: posList.reduce((map, pos) => {
            map[pos] = pos;
            return map;
          }, {})
        },
        distance: {min: 0, max: 100}
      };

      this.app.config = {
        rotate: 0,
        align: 'center',
        verticalAlign: 'bottom',
        position: 'top',
        distance: 10,
        onChange: () => {
          const labelOption = {
            rotate: this.app.config.rotate,
            align: this.app.config.align,
            verticalAlign: this.app.config.verticalAlign,
            position: this.app.config.position,
            distance: this.app.config.distance
          };
          this.myChart.setOption({
            series: this.dimensions.slice(1).map(() => ({label: labelOption}))
          });
        }
      };
    },

    initChart() {
      if (this.$refs.chartRef && !this.myChart) {
        this.myChart = echarts.init(this.$refs.chartRef);
        this.setChartOptions();
        window.addEventListener('resize', this.handleResize);
      }
    },

    setChartOptions() {
      if (!this.myChart || !this.currentDistrictData) return;

      // 数值标签配置（显示在柱子上方）
      const labelOption = {
        show: true,
        position: 'top', // 数值显示在柱子上方
        align: 'center',
        verticalAlign: 'bottom',
        rotate: 0,
        formatter: '{c}', // 只显示数值
        fontSize: 14,
        color: '#fff', // 数值颜色为白色
        rich: {name: {}}
      };

      // 提取x轴数据
      const xData = this.currentDistrictData.disasters.map(item => item.type);

      // 提取系列数据（带颜色配置）
      const seriesData = this.dimensions.slice(1).map((level) => ({
        name: level,
        type: 'bar',
        barGap: 0,
        label: labelOption,
        emphasis: {focus: 'series'},
        itemStyle: {
          color: this.riskColors[level] // 应用对应颜色
        },
        data: this.currentDistrictData.disasters.map(item => item[level] || 0)
      }));

      const baseOption = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {type: 'shadow'}
        },
        legend: {
          data: this.dimensions.slice(1),
          textStyle: {color: 'white'},
          // 图例位置调整到图表下方
          bottom: 10, // 留出分页控件空间
          left: 'center'
        },
        toolbox: {
          show: true,
          orient: 'vertical',
          left: 'right',
          top: 'center',
          feature: {
            mark: {show: true},
            dataView: {show: true, readOnly: false},
            magicType: {show: true, type: ['line', 'bar', 'stack']},
            restore: {show: true},
            saveAsImage: {show: true}
          }
        },
        xAxis: [
          {
            type: 'category',
            axisTick: {show: false},
            data: xData,
            axisLine: {lineStyle: {color: 'rgba(255,255,255,0.6)'}},
            axisLabel: {color: 'white'}
          }
        ],
        yAxis: [
          {
            type: 'value',
            axisLine: {lineStyle: {color: 'rgba(255,255,255,0.6)'}},
            axisLabel: {color: 'white'},
            splitLine: {lineStyle: {color: 'rgba(255,255,255,0.1)'}}
          }
        ],
        series: seriesData,
        backgroundColor: 'rgba(40, 40, 40, 0.8)'
      };

      const option = {...baseOption, ...this.extraOptions.chartOptions};
      this.myChart.setOption(option);
    },

    handleResize() {
      if (this.myChart) {
        this.myChart.resize();
      }
    },

    destroyChart() {
      if (this.myChart) {
        this.myChart.dispose();
        this.myChart = null;
        window.removeEventListener('resize', this.handleResize);
      }
    },

    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
      }
    },

    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
      }
    }
  }
};
</script>

<style scoped>
.bar-chart-container {
  position: absolute;
  bottom: 10px;
  left: 20px;
  background-color: rgba(40, 40, 40, 0.8);
  color: white;
  padding: 15px;
  border-radius: 4px;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  font-size: 14px;
  width: 430px;
}

.district-title {
  text-align: center;
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #fff;
}

.chart {
  width: 100%;
  height: 400px;
  transition: all 0.3s ease;
}

/* 分页控件样式 */
.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 5px;
  gap: 10px;
  position: relative;
  z-index: 10; /* 确保分页控件在图例上方 */
}

.page-btn {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 3px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.page-btn:hover:enabled {
  background-color: rgba(255, 255, 255, 0.4);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: rgba(255, 255, 255, 0.8);
}
</style>
