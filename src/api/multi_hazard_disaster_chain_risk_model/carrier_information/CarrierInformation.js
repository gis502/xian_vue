import request from "@/utils/request";

export default {
  // 获取灾害名称列表
  getDisasterNames: async () => {
    return request({
      url: "/carrier_information/disaster_names",
      method: "get",
    });
  },

  // 影响人数
  getAffectedPeople: async (form) => {
    return request({
      url: "/carrier_information/people",
      method: "post",
      params: {
        disasterId: form.disasterId,
      },
    });
  },

  // 影响交通
  getAffectedTraffic: async (form) => {
    return request({
      url: "/carrier_information/traffic",
      method: "post",
      params: {
        disasterId: form.disasterId,
      },
    });
  },

  // 危险源受影响情况
  getAffectedDanger: async (form) => {
    return request({
      url: "/carrier_information/danger",
      method: "post",
      params: {
        disasterId: form.disasterId,
      },
    });
  },

  // 地铁站受影响数量
  getAffectedStation: async (form) => {
    return request({
      url: "/carrier_information/station",
      method: "post",
      params: {
        disasterId: form.disasterId,
      },
    });
  },

  // 获取表格数据
  queryTableInfo: async (form) => {
    return request({
      url: "/carrier_information/table_info",
      method: "post",
      params: {
        disasterId: form.disasterId,
      },
    });
  }
};
