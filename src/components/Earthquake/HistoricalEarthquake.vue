<template>
  <table class="disaster-info-table">
    <tbody>
    <tr>
      <td class="label">历史地震名称</td>
      <td>{{ info?.disasterName || '暂无数据' }}</td>
    </tr>
    <tr>
      <td class="label">历史地震位置</td>
      <td>{{ info?.position || '暂无数据' }}</td>
    </tr>
    <tr>
      <td class="label">历史地震震级</td>
      <td>{{ info?.magnitude || '暂无数据' }}</td>
    </tr>
    <tr>
      <td class="label">历史地震震源深度</td>
      <td>{{ info?.depth || '暂无数据' }}</td>
    </tr>
    <tr>
      <td class="label">经度</td>
      <td>东经{{ info?.longitude || '暂无数据' }}</td>
    </tr>
    <tr>
      <td class="label">纬度</td>
      <td>北纬{{ info?.latitude || '暂无数据' }}</td>
    </tr>
    <tr>
      <td class="label">发生时间</td>
      <td>{{ info?.occurrenceTime || '暂无数据' }}</td>
    </tr>
    </tbody>
  </table>
</template>

<script setup name="HistoricalEarthquake">
import { defineProps } from 'vue';

// 为info设置默认值为空对象，防止为null或undefined
const props = defineProps({
  info: {
    type: Object,
    default: () => ({})
  }
});
</script>

<style scoped>
.disaster-info-table {
  width: 100%;
  border-collapse: collapse;
}

.disaster-info-table td {
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
}

.disaster-info-table .label {
  font-weight: bold;
  background-color: #f3f4f6;
  width: 35%;
}
</style>
