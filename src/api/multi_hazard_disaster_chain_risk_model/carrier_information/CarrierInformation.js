import request from "@/utils/request";

export default {
  // 获取灾害名称列表
  getDisasterNames: async () => {
    // return request({
    //     url: '/carrier_information/disaster_names',
    //     method: 'get'
    // });
    return [
      {
        name: "高桥村一组西安高桥墓园(C45)",
        disasterId: "1",
      },
      {
        name: "三阳院村栗沟二组姜家(C8)",
        disasterId: "2",
      },
      {
        name: "毛河湾村一组  毛窑院(C60)",
        disasterId: "3",
      },
    ];
  },

  // 影响人数
  getAffectedPeople: async (form) => {
    // return request({
    //     url: '/carrier_information/people',
    //     method: 'post',
    //     data: form
    // });
    return {
      xdata: [
        "新城区",
        "碑林区",
        "莲湖区",
        "灞桥区",
        "未央区",
        "雁塔区",
        "阎良区",
        "临潼区",
        "长安区",
        "高陵区",
        "鄠邑区",
        "蓝田县",
        "周至县",
      ],
      series: [
        {
          name: "受影响人数",
          data: [
            1200, 2000, 1500, 3000, 2000, 4000, 5000, 3500, 2800, 2200, 1800,
            1600, 1400,
          ],
        },
      ],
    };
  },

  // 影响交通
  getAffectedTraffic: async (form) => {
    // return request({
    //     url: '/carrier_information/traffic',
    //     method: 'post',
    //     data: form
    // });
    return [
      {
        name: "受影响国道",
        value: 8,
      },
      {
        name: "受影响高速",
        value: 10,
      },
      {
        name: "受影响市政道路",
        value: 12,
      },
    ];
  },

  // 危险源受影响情况
  getAffectedDanger: async (form) => {
    // return request({
    //     url: '/carrier_information/danger',
    //     method: 'post',
    //     data: form
    // });
    return {
      xdata: [
        "新城区",
        "碑林区",
        "莲湖区",
        "灞桥区",
        "未央区",
        "雁塔区",
        "阎良区",
        "临潼区",
        "长安区",
        "高陵区",
        "鄠邑区",
        "蓝田县",
        "周至县",
      ],
      series: [
        {
          name: "受影响数量",
          data: [10, 23, 15, 30, 20, 40, 50, 35, 28, 22, 18, 16, 14],
        },
      ],
    };
  },

  // 地铁站受影响数量
  getAffectedStation: async (form) => {
    // return request({
    //     url: '/carrier_information/station',
    //     method: 'post',
    //     data: form
    // });
    return {
      xdata: [
        "新城区",
        "碑林区",
        "莲湖区",
        "灞桥区",
        "未央区",
        "雁塔区",
        "阎良区",
        "临潼区",
        "长安区",
        "高陵区",
        "鄠邑区",
        "蓝田县",
        "周至县",
      ],
      series: [
        {
          name: "受影响数量",
          data: [1, 2, 3, 2, 3, 2, 1, 2, 3, 2, 1, 1, 2],
        },
      ],
    };
  },
};
