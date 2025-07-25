<!-- 风险点信息 -->
<template>
  <table class="disaster-info-table">
    <tbody>
      <tr>
        <td class="label">风险区名称</td>
        <td>{{ info["disasterName"] }}</td>
      </tr>
      <tr>
        <td class="label">统一编号</td>
        <td>{{ info["unitCode"] }}</td>
      </tr>
      <tr>
        <td class="label">住房</td>
        <td>{{ info["housing"] }} 间</td>
      </tr>
      <tr>
        <td class="label">常住人口</td>
        <td>{{ info["permanentPopulation"] }} 人</td>
      </tr>
      <tr>
        <td class="label">居民户数</td>
        <td>{{ info["residentCounts"] }} 户</td>
      </tr>
      <tr>
        <td class="label">威胁财产</td>
        <td>{{ info["riskProperty"] }} 万元</td>
      </tr>
      <tr>
        <td class="label">巡查员姓名</td>
        <td>{{ info["inspectorName"] }}</td>
      </tr>
      <tr>
        <td class="label">巡查员手机号</td>
        <td>{{ info["inspectorTele"] }}</td>
      </tr>
      <tr>
        <td class="label">位置</td>
        <td>{{ info["position"] }}</td>
      </tr>
      <tr>
        <td class="label">经度</td>
        <td>{{ info["lon"] }}</td>
      </tr>
      <tr>
        <td class="label">纬度</td>
        <td>{{ info["lat"] }}</td>
      </tr>
    </tbody>
  </table>
</template>

<script setup name="RiskPoints">
defineProps(['info'])
</script>

<style scoped></style>
