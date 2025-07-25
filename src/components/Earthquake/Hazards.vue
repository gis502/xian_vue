<!-- 致灾因子 -->
<template>
  <div class="container">
    <span class="text">产生滑坡的概率：{{ probability }}%</span>
    <!-- 致灾因子信息 -->
    <el-form :model="form" label-width="auto" style="max-width: 100%">
      <el-form-item
        v-for="item, index in hazardsDatas"
        :key="item.attributeNameAlias"
        :label="item.attributeName"
      >
        <!-- input -->
        <el-input
          v-if="item.type.includes('input')"
          v-model="form[index].factorValue"
          :disabled="!item.isModified"
          :type="item.type.split('.')[1]"
          :value="item.factorValue"
        >
          <template v-if="item.unit" #append>{{ item.unit }}</template>
        </el-input>

        <!-- select -->
        <el-select
          v-model="form[index].factorValue"
          :disabled="!item.isModified"
          v-if="item.type.includes('select')"
        >
          <el-option
            v-for="(option, optionIndex) in item.options"
            :key="optionIndex"
            :value="option.value"
            :label="option.label"
          />
        </el-select>
      </el-form-item>
      <div class="button-container">
        <el-button type="primary" @click="modifyDatas">修改</el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup name="Hazards">
import { onBeforeMount, reactive, ref } from "vue";
import { getHazardProbability } from "../../api/earthquake/hazards";

// 接收父组件数据
const hazards = defineProps(["hazardsDatas"]);

// 表单数据
let form = reactive([]);

// 概率值
let probability = ref(0);

onBeforeMount(() => {
  // 设置默认值
  hazards.hazardsDatas.forEach(element => {
    form.push({
      hideId: element.hideId,
      attributeId: element.attributeId,
      valueId: element.valueId,
      factorValue: element.factorValue
    })
  });

  // 从后台获取一次概率
  // modifyDatas();
});

async function modifyDatas() {
  // 从后台获取概率值
  const res = await getHazardProbability(form);
  console.log(res);
}
</script>

<style lang="scss" scoped>
.container {
  padding: 10px;
}
.text {
  font-size: 20px;
  color: red;
  font-weight: bold;
  margin-bottom: 10px;
  display: block;
}
.button-container {
  display: flex;
  justify-content: center; /* 水平居中 */
  align-items: center; /* 垂直居中 */
}
</style>
