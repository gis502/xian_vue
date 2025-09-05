import * as echarts from "echarts";
import CarrierInformation from "../../api/multi_hazard_disaster_chain_risk_model/carrier_information/CarrierInformation";

// 图表实例映射
const chartInstances = new Map();

// 生成随机颜色
const getRandomColor = () => {
  const letters = "0123456789abcdef";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

// 处理接口返回的数据，转换为图表需要的数据格式
const getSeriesDatas = (result) => {
  const seriesDatas = [];
  for (let i = 0; i < result.series.length; i++) {
    const seriesData = {
      name: result.series[i].name,
      type: "bar",
      data: result.series[i].data.map((item) => ({
        value: item,
        itemStyle: {
          color: getRandomColor(),
        },
      })),
    };
    seriesDatas.push(seriesData);
  }
  return seriesDatas;
};

// 绘制饼图
const drawPieChart = (config) => {
  const { element, title, colors, data } = config;
  
  if (!element) return;
  
  let chartInstance = chartInstances.get(element);
  if (!chartInstance) {
    chartInstance = echarts.init(element);
    chartInstances.set(element, chartInstance);
  }
  
  chartInstance.clear();
  
  const option = {
    title: {
      text: title,
      left: "center",
      textStyle: {
        color: "#fff",
        fontSize: "1rem",
      },
    },
    color: colors,
    tooltip: {
      trigger: "item",
    },
    legend: {
      top: "25px",
      left: "center",
      textStyle: {
        color: "#FFF",
        fontSize: "1rem",
      },
    },
    series: [
      {
        type: "pie",
        radius: ["40%", "70%"],
        label: {
          show: false,
          color: "#FFF",
          fontSize: "1.0rem",
        },
        labelLine: {
          show: false,
        },
        data: data,
      },
    ],
  };
  
  chartInstance.setOption(option);
  return chartInstance;
};

// 绘制柱状图
const drawBarChart = (config) => {
  const { element, title, data, xAxisData } = config;
  
  if (!element) return;
  
  let chartInstance = chartInstances.get(element);
  if (!chartInstance) {
    chartInstance = echarts.init(element);
    chartInstances.set(element, chartInstance);
  }
  
  chartInstance.clear();
  
  const option = {
    title: {
      text: title,
      left: "center",
      textStyle: {
        color: "#fff",
        fontSize: "1rem",
      },
    },
    legend: {
      show: true,
      top: "25px",
      left: "center",
      textStyle: {
        color: "#FFF",
        fontSize: "1rem",
      },
    },
    grid: {
      top: "100px",
    },
    label: {
      show: true,
      color: "#FFF",
    },
    xAxis: {
      type: "category",
      data: xAxisData,
      axisLabel: {
        color: "#FFF",
        fontSize: "1rem",
      },
    },
    yAxis: {
      type: "value",
      max: function (e) {
        return Math.ceil(e.max * 1.1);
      },
      axisLabel: {
        color: "#FFF",
        fontSize: "1rem",
      },
    },
    series: data,
  };
  
  chartInstance.setOption(option);
  return chartInstance;
};

export const useChart = (form) => {
  // 调整所有图表大小
  const resizeAllCharts = () => {
    chartInstances.forEach((chartInstance) => {
      if (chartInstance) {
        chartInstance.resize();
      }
    });
  };

  // 绘制人口图
  const drawPopulationChart = (element) => {
    CarrierInformation.getAffectedPeople(form.value).then((res) => {
      const result = res;
      const seriesData = getSeriesDatas(result);
      drawBarChart({
        title: "各县区交通受影响情况",
        element: element,
        data: seriesData,
        xAxisData: result.xdata,
      });
    });
  };

  // 绘制交通
  const drawTrafficChart = (element) => {
    CarrierInformation.getAffectedTraffic(form.value).then((res) => {
      const result = res;
      drawPieChart({
        title: "交通受影响情况",
        colors: [getRandomColor(), getRandomColor(), getRandomColor()],
        data: result,
        element: element,
      });
    });
  };

  // 绘制危险源
  const drawDangerChart = (element) => {
    CarrierInformation.getAffectedDanger(form.value).then((res) => {
      const result = res;
      const seriesData = getSeriesDatas(result);
      drawBarChart({
        title: "危险源受影响情况",
        element: element,
        data: seriesData,
        xAxisData: result.xdata,
      });
    });
  };

  // 绘制地铁站
  const drawStationChart = (element) => {
    CarrierInformation.getAffectedStation(form.value).then((res) => {
      const result = res;
      const seriesData = getSeriesDatas(result);
      drawBarChart({
        title: "地铁站受影响情况",
        element: element,
        data: seriesData,
        xAxisData: result.xdata,
      });
    });
  };

  return {
    drawPopulationChart,
    drawTrafficChart,
    drawDangerChart,
    drawStationChart,
    resizeAllCharts
  };
};