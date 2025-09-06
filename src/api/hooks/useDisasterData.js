import { ref } from "vue";
import CarrierInformation from "../../api/multi_hazard_disaster_chain_risk_model/carrier_information/CarrierInformation";

export const useDisasterData = () => {
  // 灾害名称
  const disasterNames = ref([]);
  
  // 获取灾害名称
  const fetchDisasterNames = () => {
    CarrierInformation.getDisasterNames().then((res) => {
      disasterNames.value = res;
    });
  };
  
  fetchDisasterNames();

  // 表单数据
  const form = ref({
    disasterId: null,
    type: null,
  });

  return {
    disasterNames,
    form
  };
};