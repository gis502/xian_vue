const plotType = {
    standbyTeam: {
        name: "待命队伍",
        teamName: {
            type: "text",
            name: "队伍名称",
            value: ""
        },
        personnelCount: {
            type: "text",
            name: "人员数量",
            value: ""
        },
        teamNature: {
            type: "select",
            name: "队伍性质",
            value: "",
            content: [
                {
                    value: "teamNature",
                    label: "消防救援队伍"
                },
                {
                    value: "teamNature",
                    label: "森林消防队伍"
                },
                {
                    value: "teamNature",
                    label: "专业救援队伍"
                },
                {
                    value: "teamNature",
                    label: "社会应急队伍"
                },
                {
                    value: "teamNature",
                    label: "其他救援队伍（驻川解放军、武警部队、民兵、党员突击队等）"
                }
            ]
        },
        teamType: {
            type: "select",
            name: "队伍类型",
            value: "",
            content: [
                {
                    value: "teamType",
                    label: "综合救援类"
                },
                {
                    value: "teamType",
                    label: "工程抢险类"
                },
                {
                    value: "teamType",
                    label: "水域救援类"
                },
                {
                    value: "teamType",
                    label: "排涝抢险类"
                },
                {
                    value: "teamType",
                    label: "航空救援类"
                },
                {
                    value: "teamType",
                    label: "应急通信类"
                },
                {
                    value: "teamType",
                    label: "电力抢险类"
                },
                {
                    value: "teamType",
                    label: "医疗救援类"
                },
                {
                    value: "teamType",
                    label: "后勤保障类"
                }
            ]
        },
        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        }
    },
    dispatchedTeam: {
        name: "已出发队伍",
        teamName: {
            type: "text",
            name: "队伍名称",
            value: ""
        },
        stationProvince: {
            type: "text",
            name: "省",
            value: ""
        },
        stationCity: {
            type: "text",
            name: "市（州）",
            value: ""
        },
        stationCounty: {
            type: "text",
            name: "县（市、区）",
            value: ""
        },
        personnelCount: {
            type: "text",
            name: "人员数量",
            value: ""
        },
        teamNature: {
            type: "select",
            name: "队伍性质",
            value: "",
            content: [
                {
                    value: "teamNature",
                    label: "消防救援队伍"
                },
                {
                    value: "teamNature",
                    label: "森林消防队伍"
                },
                {
                    value: "teamNature",
                    label: "专业救援队伍"
                },
                {
                    value: "teamNature",
                    label: "社会应急队伍"
                },
                {
                    value: "teamNature",
                    label: "其他救援队伍（驻川解放军、武警部队和民兵等）"
                }
            ]
        },
        teamType: {
            type: "select",
            name: "队伍类型",
            value: "",
            content: [
                {
                    value: "teamType",
                    label: "综合救援类"
                },
                {
                    value: "teamType",
                    label: "工程抢险类"
                },
                {
                    value: "teamType",
                    label: "水域救援类"
                },
                {
                    value: "teamType",
                    label: "排涝抢险类"
                },
                {
                    value: "teamType",
                    label: "航空救援类"
                },
                {
                    value: "teamType",
                    label: "应急通信类"
                },
                {
                    value: "teamType",
                    label: "电力抢险类"
                },
                {
                    value: "teamType",
                    label: "医疗救援类"
                },
                {
                    value: "teamType",
                    label: "后勤保障类"
                }
            ]
        },
        plannedRescueArea: {
            type: "text",
            name: "拟抢险救援区域",
            value: ""
        },
        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        }
    },
    participatingTeam: {
        name: "正在参与队伍",
        teamName: {
            type: "text",
            name: "队伍名称",
            value: ""
        },
        personnelCount: {
            type: "text",
            name: "人员数量",
            value: ""
        },
        teamNature: {
            type: "select",
            name: "队伍性质",
            value: "",
            content: [
                {
                    value: "teamNature",
                    label: "消防救援队伍"
                },
                {
                    value: "teamNature",
                    label: "森林消防队伍"
                },
                {
                    value: "teamNature",
                    label: "专业救援队伍"
                },
                {
                    value: "teamNature",
                    label: "社会应急队伍"
                },
                {
                    value: "teamNature",
                    label: "其他救援队伍（驻川解放军、武警部队和民兵等）"
                }
            ]
        },
        teamType: {
            type: "select",
            name: "队伍类型",
            value: "",
            content: [
                {
                    value: "teamType",
                    label: "综合救援类"
                },
                {
                    value: "teamType",
                    label: "工程抢险类"
                },
                {
                    value: "teamType",
                    label: "水域救援类"
                },
                {
                    value: "teamType",
                    label: "排涝抢险类"
                },
                {
                    value: "teamType",
                    label: "航空救援类"
                },
                {
                    value: "teamType",
                    label: "应急通信类"
                },
                {
                    value: "teamType",
                    label: "电力抢险类"
                },
                {
                    value: "teamType",
                    label: "医疗救援类"
                },
                {
                    value: "teamType",
                    label: "后勤保障类"
                }
            ]
        },
        plannedRescueArea: {
            type: "text",
            name: "抢险救援区域",
            value: ""
        },
        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        }
    },

    straightArrows: {
        name: "直线箭头",
        startingPoint: {
            type: "text",
            name: "起始点",
            value: ""
        },
        targetPoint: {
            type: "text",
            name: "目标点",
            value: ""
        },
        actionContent: {
            type: "text",
            name: "行动内容",
            value: ""
        },
    },
    attackArrows: {
        name: "攻击箭头",
        startingPoint: {
            type: "text",
            name: "起始点",
            value: ""
        },
        targetPoint: {
            type: "text",
            name: "目标点",
            value: ""
        },
        actionContent: {
            type: "text",
            name: "行动内容",
            value: ""
        },
    },
    pincerArrows: {
        name: "钳击箭头",
        startingPoint: {
            type: "text",
            name: "起始点",
            value: ""
        },
        targetPoint: {
            type: "text",
            name: "目标点",
            value: ""
        },
        actionContent: {
            type: "text",
            name: "行动内容",
            value: ""
        },
    },
    unsearchedArea: {
        name: "未搜索区域",
        rescueAreaLocation: {
            type: "text",
            name: "搜索区域位置",
            value: ""
        },
        rescueAreaSizeKm2: {
            type: "text",
            name: "未搜索区域面积",
            value: ""
        },
        rescueTeamAndPersonnelCount: {
            type: "text",
            name: "所需搜索人员数量",
            value: ""
        },
        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        }

    },
    searchedArea: {
        name: "已搜索区域",
        rescueAreaLocation: {
            type: "text",
            name: "搜索区域位置",
            value: ""
        },
        rescueAreaSizeKm2: {
            type: "text",
            name: "已搜索区域面积",
            value: ""
        },
        rescueTeamAndPersonnelCount: {
            type: "text",
            name: "参与搜索队伍及人员数量",
            value: ""
        },
        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        }

    },

    unrescuedArea: {
        name: "未营救区域",
        rescueAreaLocation: {
            type: "text",
            name: "营救区域位置",
            value: ""
        },
        rescueAreaSizeKm2: {
            type: "text",
            name: "营救区域面积",
            value: ""
        },
        rescueTeamAndPersonnelCount: {
            type: "text",
            name: "所需营救人员数量",
            value: ""
        },
        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        },
        rescueType: {
            type: "select",
            name: "队伍类型",
            value: "",
            content: [
                {
                    value: "rescueType",
                    label: "综合救援"
                },
                {
                    value: "rescueType",
                    label: "水域救援"
                },
                {
                    value: "rescueType",
                    label: "航空救援"
                },
                {
                    value: "rescueType",
                    label: "医疗救援"
                },
                {
                    value: "rescueType",
                    label: "其他"
                }
            ]
        },
    },
    rescuedArea: {
        name: "已营救区域",
        rescueAreaLocation: {
            type: "text",
            name: "营救区域位置",
            value: ""
        },
        rescueAreaSizeKm2: {
            type: "text",
            name: "营救区域面积",
            value: ""
        },
        rescueTeamAndPersonnelCount: {
            type: "text",
            name: "营救队伍及人员数量",
            value: ""
        },
        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        },
        rescueType: {
            type: "select",
            name: "队伍类型",
            value: "",
            content: [
                {
                    value: "rescueType",
                    label: "综合救援类"
                },
                {
                    value: "rescueType",
                    label: "工程抢险类"
                },
                {
                    value: "rescueType",
                    label: "水域救援类"
                },
                {
                    value: "rescueType",
                    label: "排涝抢险类"
                },
                {
                    value: "rescueType",
                    label: "其他"
                }
            ]
        },
    },
    rescueArea: {
        name: "正在营救区域",
        rescueAreaLocation: {
            type: "text",
            name: "营救区域位置",
            value: ""
        },
        rescueAreaSizeKm2: {
            type: "text",
            name: "营救区域面积",
            value: ""
        },
        rescueTeamAndPersonnelCount: {
            type: "text",
            name: "营救队伍及人员数量",
            value: ""
        },
        rescueType: {
            type: "select",
            name: "队伍类型",
            value: "",
            content: [
                {
                    value: "rescueType",
                    label: "综合救援"
                },
                {
                    value: "rescueType",
                    label: "水域救援"
                },
                {
                    value: "rescueType",
                    label: "航空救援"
                },
                {
                    value: "rescueType",
                    label: "医疗救援"
                },
                {
                    value: "rescueType",
                    label: "其他"
                }
            ]
        },
        rescueEquipmentType: {
            type: "selectMultiple",
            name: "救援装备类型",
            value: "",
            content: [
                {
                    value: "rescueEquipmentType",
                    label: "破拆类（如液压剪、切割机等"
                },
                {
                    value: "rescueEquipmentType",
                    label: "支撑类（如气垫、千斤顶等）"
                },
                {
                    value: "rescueEquipmentType",
                    label: "提升类（如吊机、担架等）"
                },
                {
                    value: "rescueEquipmentType",
                    label: "其他"
                }
            ]
        },
        needEngineeringMachinery: {
            type: "select",
            name: "是否需要工程机械",
            value: "",
            content: [
                {
                    value: "needEngineeringMachinery",
                    label: "是"
                },
                {
                    value: "needEngineeringMachinery",
                    label: "否"
                }
            ]
        },
        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        },
    },

    bufferZone: {
        name: "集结缓冲区",
        area: {
            type: "text",
            name: "缓存区面积 (m²)",
            value: ""
        },
        capacity: {
            type: "select",
            name: "容纳人数",
            value: "",
            content: [
                {value: "50人以下", label: "50人以下"},
                {value: "50—100人", label: "50—100人"},
                {value: "100—200人", label: "100—200人"},
                {value: "200人以上", label: "200人以上"}
            ]
        },
        basicSupport: {
            type: "select",
            name: "基本保障",
            value: '',
            content: [
                {value: "食宿", label: "食宿"},
                {value: "通电", label: "通电"},
                {value: "通水", label: "通水"},
                {value: "通网", label: "通网"}
            ]
        },
        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        }
    },

    missingPersons: {
        name: "失踪人员",
        missingLocation: {
            type: "text",
            name: "失联位置",
            value: ""
        },
        newMissingCount: {
            type: "text",
            name: "新增失踪人数",
            value: ""
        },
        totalMissingCount: {
            type: "text",
            name: "累计失踪人数",
            value: ""
        },
        missingReason: {
            type: "select",
            name: "失联原因",
            value: "",
            content: [
                {
                    value: "missingReason",
                    label: "埋压"
                },
                {
                    value: "missingReason",
                    label: "淹溺"
                },
                {
                    value: "missingReason",
                    label: "其他"
                }
            ]
        },
        searchTeam: {
            type: "text",
            name: "搜寻队伍",
            value: ""
        },
        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        }
    },

    injuredPerson: {
        name: "轻伤人员",
        location: {
            type: "text",
            name: "所在位置",
            value: ""
        },

        casualtyStatus: {
            type: "select",
            name: "人员伤亡状态",
            value: "",
            content: [
                {
                    value: "casualtyStatus",
                    label: "轻伤"
                },
                {
                    value: "casualtyStatus",
                    label: "重伤"
                },
                {
                    value: "casualtyStatus",
                    label: "危重伤"
                },
                {
                    value: "casualtyStatus",
                    label: "死亡"
                }
            ]
        },
        abcdScore: {
            type: "select",
            name: "ABCD评分",
            value: "",
            content: [
                {
                    value: "abcdScore",
                    label: "窒息与呼吸困难"
                },
                {
                    value: "abcdScore",
                    label: "出血与失血性休克"
                },
                {
                    value: "abcdScore",
                    label: "昏迷与颅脑外伤"
                },
                {
                    value: "abcdScore",
                    label: "正在发生的突然死亡"
                }
            ]
        },
        // newInjuries: {
        //     minorInjury: {
        //         type: "text",
        //         name: "轻伤新增人数",
        //         value: ""
        //     },
        //     seriousInjury: {
        //         type: "text",
        //         name: "重伤新增人数",
        //         value: ""
        //     },
        //     criticalInjury: {
        //         type: "text",
        //         name: "危重伤新增人数",
        //         value: ""
        //     },
        //     death: {
        //         type: "text",
        //         name: "死亡新增人数",
        //         value: ""
        //     }
        // },
        // cumulativeInjuries: {
        //     minorInjury: {
        //         type: "text",
        //         name: "轻伤累计人数",
        //         value: ""
        //     },
        //     seriousInjury: {
        //         type: "text",
        //         name: "重伤累计人数",
        //         value: ""
        //     },
        //     criticalInjury: {
        //         type: "text",
        //         name: "危重伤累计人数",
        //         value: ""
        //     },
        //     death: {
        //         type: "text",
        //         name: "死亡累计人数",
        //         value: ""
        //     }
        // },
        newCount: {
            type: "text",
            name: "新增总数",
            value: ""
        },
        totalCount: {
            type: "text",
            name: "累计总数",
            value: ""
        },
        medicalRescueTeam: {
            type: "text",
            name: "医疗救援队伍",
            value: ""
        },
        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        }
    },
    severelyInjuredPerson: {
        name: "重伤人员",
        location: {
            type: "text",
            name: "所在位置",
            value: ""
        },

        casualtyStatus: {
            type: "select",
            name: "人员伤亡状态",
            value: "",
            content: [
                {
                    value: "casualtyStatus",
                    label: "轻伤"
                },
                {
                    value: "casualtyStatus",
                    label: "重伤"
                },
                {
                    value: "casualtyStatus",
                    label: "危重伤"
                },
                {
                    value: "casualtyStatus",
                    label: "死亡"
                }
            ]
        },
        abcdScore: {
            type: "select",
            name: "ABCD评分",
            value: "",
            content: [
                {
                    value: "abcdScore",
                    label: "窒息与呼吸困难"
                },
                {
                    value: "abcdScore",
                    label: "出血与失血性休克"
                },
                {
                    value: "abcdScore",
                    label: "昏迷与颅脑外伤"
                },
                {
                    value: "abcdScore",
                    label: "正在发生的突然死亡"
                }
            ]
        },
        // newInjuries: {
        //     minorInjury: {
        //         type: "text",
        //         name: "轻伤新增人数",
        //         value: ""
        //     },
        //     seriousInjury: {
        //         type: "text",
        //         name: "重伤新增人数",
        //         value: ""
        //     },
        //     criticalInjury: {
        //         type: "text",
        //         name: "危重伤新增人数",
        //         value: ""
        //     },
        //     death: {
        //         type: "text",
        //         name: "死亡新增人数",
        //         value: ""
        //     }
        // },
        // cumulativeInjuries: {
        //     minorInjury: {
        //         type: "text",
        //         name: "轻伤累计人数",
        //         value: ""
        //     },
        //     seriousInjury: {
        //         type: "text",
        //         name: "重伤累计人数",
        //         value: ""
        //     },
        //     criticalInjury: {
        //         type: "text",
        //         name: "危重伤累计人数",
        //         value: ""
        //     },
        //     death: {
        //         type: "text",
        //         name: "死亡累计人数",
        //         value: ""
        //     }
        // },
        newCount: {
            type: "text",
            name: "新增总数",
            value: ""
        },
        totalCount: {
            type: "text",
            name: "累计总数",
            value: ""
        },
        medicalRescueTeam: {
            type: "text",
            name: "医疗救援队伍",
            value: ""
        },
        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        }
    },
    criticallyInjuredPerson: {
        name: "危重伤人员",
        location: {
            type: "text",
            name: "所在位置",
            value: ""
        },

        casualtyStatus: {
            type: "select",
            name: "人员伤亡状态",
            value: "",
            content: [
                {
                    value: "casualtyStatus",
                    label: "轻伤"
                },
                {
                    value: "casualtyStatus",
                    label: "重伤"
                },
                {
                    value: "casualtyStatus",
                    label: "危重伤"
                },
                {
                    value: "casualtyStatus",
                    label: "死亡"
                }
            ]
        },
        abcdScore: {
            type: "select",
            name: "ABCD评分",
            value: "",
            content: [
                {
                    value: "abcdScore",
                    label: "窒息与呼吸困难"
                },
                {
                    value: "abcdScore",
                    label: "出血与失血性休克"
                },
                {
                    value: "abcdScore",
                    label: "昏迷与颅脑外伤"
                },
                {
                    value: "abcdScore",
                    label: "正在发生的突然死亡"
                }
            ]
        },
        // newInjuries: {
        //     minorInjury: {
        //         type: "text",
        //         name: "轻伤新增人数",
        //         value: ""
        //     },
        //     seriousInjury: {
        //         type: "text",
        //         name: "重伤新增人数",
        //         value: ""
        //     },
        //     criticalInjury: {
        //         type: "text",
        //         name: "危重伤新增人数",
        //         value: ""
        //     },
        //     death: {
        //         type: "text",
        //         name: "死亡新增人数",
        //         value: ""
        //     }
        // },
        // cumulativeInjuries: {
        //     minorInjury: {
        //         type: "text",
        //         name: "轻伤累计人数",
        //         value: ""
        //     },
        //     seriousInjury: {
        //         type: "text",
        //         name: "重伤累计人数",
        //         value: ""
        //     },
        //     criticalInjury: {
        //         type: "text",
        //         name: "危重伤累计人数",
        //         value: ""
        //     },
        //     death: {
        //         type: "text",
        //         name: "死亡累计人数",
        //         value: ""
        //     }
        // },
        newCount: {
            type: "text",
            name: "新增总数",
            value: ""
        },
        totalCount: {
            type: "text",
            name: "累计总数",
            value: ""
        },
        medicalRescueTeam: {
            type: "text",
            name: "医疗救援队伍",
            value: ""
        },
        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        }
    },
    deadPerson: {
        name: "死亡人员",
        location: {
            type: "text",
            name: "所在位置",
            value: ""
        },

        casualtyStatus: {
            type: "select",
            name: "人员伤亡状态",
            value: "",
            content: [
                {
                    value: "casualtyStatus",
                    label: "轻伤"
                },
                {
                    value: "casualtyStatus",
                    label: "重伤"
                },
                {
                    value: "casualtyStatus",
                    label: "危重伤"
                },
                {
                    value: "casualtyStatus",
                    label: "死亡"
                }
            ]
        },
        abcdScore: {
            type: "select",
            name: "ABCD评分",
            value: "",
            content: [
                {
                    value: "abcdScore",
                    label: "窒息与呼吸困难"
                },
                {
                    value: "abcdScore",
                    label: "出血与失血性休克"
                },
                {
                    value: "abcdScore",
                    label: "昏迷与颅脑外伤"
                },
                {
                    value: "abcdScore",
                    label: "正在发生的突然死亡"
                }
            ]
        },
        newCount: {
            type: "text",
            name: "新增总数",
            value: ""
        },
        totalCount: {
            type: "text",
            name: "累计总数",
            value: ""
        },
        medicalRescueTeam: {
            type: "text",
            name: "医疗救援队伍",
            value: ""
        },
        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        }
    },

    collapse: {
        name: "崩塌",
        lengthM: {
            type: "text",
            name: "长度 (m)",
            value: ""
        },
        widthM: {
            type: "text",
            name: "宽度 (m)",
            value: ""
        },
        averageThicknessM: {
            type: "text",
            name: "平均厚度 (m)",
            value: ""
        },
        volumeM3: {
            type: "text",
            name: "体积 (m³)",
            value: ""
        },
        casualties: {
            type: "select",
            name: "人员伤亡",
            value: "",
            content: [
                {
                    value: "casualties",
                    label: "无"
                },
                {
                    value: "casualties",
                    label: "有"
                }
            ]
        },
        threatenedObjects: {
            type: "select",
            name: "威胁对象",
            value: "",
            content: [
                {
                    value: "threatenedObjects",
                    label: "地表建筑"
                },
                {
                    value: "threatenedObjects",
                    label: "交通线路"
                },
                {
                    value: "threatenedObjects",
                    label: "通讯电力设施"
                },
                {
                    value: "threatenedObjects",
                    label: "水库电站"
                },
                {
                    value: "threatenedObjects",
                    label: "管网工程"
                },
                {
                    value: "threatenedObjects",
                    label: "其他设施"
                }
            ]
        },
        disposalTeam: {
            type: "text",
            name: "处置队伍",
            value: ""
        },
        disposalMeasures: {
            type: "text",
            name: "处置措施",
            value: ""
        },
        initialDisposalPhase: {
            type: "select",
            name: "先期处置阶段",
            value: "",
            content: [
                {value: "initialDisposalPhase", label: "暂未处置"},
                {value: "initialDisposalPhase", label: "正在处置"},
                {value: "initialDisposalPhase", label: "完成处置"}
            ]
        },
        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        }
    },
    landslide: {
        name: "滑坡",
        lengthM: {
            type: "text",
            name: "长度 (m)",
            value: ""
        },
        widthM: {
            type: "text",
            name: "宽度 (m)",
            value: ""
        },
        averageThicknessM: {
            type: "text",
            name: "平均厚度 (m)",
            value: ""
        },
        volumeM3: {
            type: "text",
            name: "体积 (m³)",
            value: ""
        },
        casualties: {
            type: "select",
            name: "人员伤亡",
            value: "",
            content: [
                {
                    value: "casualties",
                    label: "无"
                },
                {
                    value: "casualties",
                    label: "有"
                }
            ]
        },
        threatenedObjects: {
            type: "select",
            name: "威胁对象",
            value: "",
            content: [
                {
                    value: "threatenedObjects",
                    label: "地表建筑"
                },
                {
                    value: "threatenedObjects",
                    label: "交通线路"
                },
                {
                    value: "threatenedObjects",
                    label: "通讯电力设施"
                },
                {
                    value: "threatenedObjects",
                    label: "水库电站"
                },
                {
                    value: "threatenedObjects",
                    label: "管网工程"
                },
                {
                    value: "threatenedObjects",
                    label: "其他设施"
                }
            ]
        },
        disposalTeam: {
            type: "text",
            name: "处置队伍",
            value: ""
        },
        disposalMeasures: {
            type: "text",
            name: "处置措施",
            value: ""
        },
        initialDisposalPhase: {
            type: "select",
            name: "先期处置阶段",
            value: "",
            content: [
                {value: "initialDisposalPhase", label: "暂未处置"},
                {value: "initialDisposalPhase", label: "正在处置"},
                {value: "initialDisposalPhase", label: "完成处置"}
            ]
        },
        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        }
    },
    mudslide: {
        name: "泥石流",
        riverSlope: {
            type: "select",
            name: "河沟坡度",
            value: "",
            content: [
                {value: "riverSlope", label: "陡峭"},
                {value: "riverSlope", label: "中等"},
                {value: "riverSlope", label: "平缓"}
            ]
        },
        vegetationCoverage: {
            type: "select",
            name: "植被覆盖率",
            value: "",
            content: [
                {value: "vegetationCoverage", label: "低"},
                {value: "vegetationCoverage1", label: "中"},
                {value: "vegetationCoverage2", label: "高"}
            ]
        },
        flowSpeed: {
            type: "select",
            name: "流速",
            value: "",
            content: [
                {value: "flowSpeed", label: "快"},
                {value: "flowSpeed1", label: "中"},
                {value: "flowSpeed2", label: "慢"}
            ]
        },
        area: {
            type: "text",
            name: "面积 (m²)",
            value: ""
        },
        averageThickness: {
            type: "text",
            name: "平均厚度 (m)",
            value: ""
        },
        materialComposition: {
            type: "select",
            name: "物质组成",
            value: "",
            content: [
                {value: "materialComposition", label: "泥流"},
                {value: "materialComposition", label: "泥石流"},
                {value: "materialComposition", label: "水石流"}
            ]
        },
        currentStabilityStatus: {
            type: "select",
            name: "目前稳定状况",
            value: "",
            content: [
                {value: "currentStabilityStatus", label: "基本稳定"},
                {value: "currentStabilityStatus", label: "不稳定"}
            ]
        },
        casualties: {
            type: "select",
            name: "人员伤亡",
            value: "",
            content: [
                {value: "casualties", label: "无"},
                {value: "casualties", label: "有"}
            ]
        },
        threatenedObjects: {
            type: "selectMultiple",
            name: "威胁对象",
            value: "",
            content: [
                {value: "threatenedObjects", label: "地表建筑"},
                {value: "threatenedObjects", label: "交通线路"},
                {value: "threatenedObjects", label: "通讯电力设施"},
                {value: "threatenedObjects", label: "水库电站"},
                {value: "threatenedObjects", label: "管网工程"},
                {value: "threatenedObjects", label: "其他设施"}
            ]
        },
        disposalTeam: {
            type: "text",
            name: "处置队伍",
            value: ""
        },
        disposalMeasures: {
            type: "text",
            name: "处置措施",
            value: ""
        },
        initialDisposalPhase: {
            type: "select",
            name: "先期处置阶段",
            value: "",
            content: [
                {value: "initialDisposalPhase", label: "暂未处置"},
                {value: "initialDisposalPhase", label: "正在处置"},
                {value: "initialDisposalPhase", label: "完成处置"}
            ]
        },
        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        }

    },
    groundFissure: {
        name: "地裂缝",
        length: {
            type: "text",
            name: "长度 (m)",
            value: ""
        },
        width: {
            type: "text",
            name: "宽度 (m)",
            value: ""
        },
        depth: {
            type: "text",
            name: "深度 (m)",
            value: ""
        },
        activityStatus: {
            type: "select",
            name: "活动性",
            value: "",
            content: [
                {value: "activityStatus", label: "停止"},
                {value: "activityStatus", label: "仍有活动"}
            ]
        },
        casualties: {
            type: "select",
            name: "人员伤亡",
            value: "",
            content: [
                {value: "casualties", label: "无"},
                {value: "casualties", label: "有"}
            ]
        },
        threatenedObjects: {
            type: "select",
            name: "威胁对象",
            value: "",
            content: [
                {value: "threatenedObjects", label: "地表建筑"},
                {value: "threatenedObjects", label: "交通线路"},
                {value: "threatenedObjects", label: "通讯电力设施"},
                {value: "threatenedObjects", label: "水库电站"},
                {value: "threatenedObjects", label: "管网工程"},
                {value: "threatenedObjects", label: "其他设施"}
            ]
        },
        disposalTeam: {
            type: "text",
            name: "处置队伍",
            value: ""
        },
        disposalMeasures: {
            type: "text",
            name: "处置措施",
            value: ""
        },
        initialDisposalStage: {
            type: "select",
            name: "先期处置阶段",
            value: "",
            content: [
                {value: "initialDisposalStage", label: "暂未处置"},
                {value: "initialDisposalStage", label: "正在处置"},
                {value: "initialDisposalStage", label: "完成处置"}
            ]
        },
        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        }
    },
    landSubsidence: {
        name: "地面沉降",
        affectedArea: {
            type: "text",
            name: "沉降面积 (m²)",
            value: ""
        },
        cumulativeSettlement: {
            type: "text",
            name: "累计沉降量 (h) (m)",
            value: ""
        },
        developmentChange: {
            type: "select",
            name: "发展变化",
            value: "",
            content: [
                {value: "developmentChange", label: "停止"},
                {value: "developmentChange", label: "尚在发展"}
            ]
        },
        casualties: {
            type: "select",
            name: "人员伤亡",
            value: "",
            content: [
                {value: "casualties", label: "无"},
                {value: "casualties", label: "有"}
            ]
        },
        threatenedTarget: {
            type: "selectMultiple",
            name: "威胁对象",
            value: "",
            content: [
                {value: "threatenedTarget", label: "地表建筑"},
                {value: "threatenedTarget", label: "交通线路"},
                {value: "threatenedTarget", label: "通讯电力设施"},
                {value: "threatenedTarget", label: "水库电站"},
                {value: "threatenedTarget", label: "管网工程"},
                {value: "threatenedTarget", label: "其他设施"}
            ]
        },
        responseTeam: {
            type: "text",
            name: "处置队伍",
            value: ""
        },
        responseMeasures: {
            type: "text",
            name: "处置措施",
            value: ""
        },
        initialDisposalStage: {
            type: "select",
            name: "先期处置阶段",
            value: "",
            content: [
                {value: "initialDisposalStage", label: "暂未处置"},
                {value: "initialDisposalStage", label: "正在处置"},
                {value: "initialDisposalStage", label: "完成处置"}
            ]
        },
        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        }
    },

    groundCollapse: {
        name: "地面塌陷",
        affectedArea: {
            type: "text",
            name: "影响范围面积 (m²)",
            value: ""
        },
        cumulativeSettlement: {
            type: "text",
            name: "塌陷坑直径 (m)",
            value: ""
        },
        developmentChange: {
            type: "select",
            name: "发展变化",
            value: "",
            content: [
                {value: "developmentChange", label: "停止"},
                {value: "developmentChange", label: "尚在发展"}
            ]
        },
        casualties: {
            type: "select",
            name: "人员伤亡",
            value: "",
            content: [
                {value: "casualties", label: "无"},
                {value: "casualties", label: "有"}
            ]
        },
        threatenedTarget: {
            type: "selectMultiple",
            name: "威胁对象",
            value: "",
            content: [
                {value: "threatenedTarget", label: "地表建筑"},
                {value: "threatenedTarget", label: "交通线路"},
                {value: "threatenedTarget", label: "通讯电力设施"},
                {value: "threatenedTarget", label: "水库电站"},
                {value: "threatenedTarget", label: "管网工程"},
                {value: "threatenedTarget", label: "其他设施"}
            ]
        },
        responseTeam: {
            type: "text",
            name: "处置队伍",
            value: ""
        },
        responseMeasures: {
            type: "text",
            name: "处置措施",
            value: ""
        },
        initialDisposalStage: {
            type: "select",
            name: "先期处置阶段",
            value: "",
            content: [
                {value: "initialDisposalStage", label: "暂未处置"},
                {value: "initialDisposalStage", label: "正在处置"},
                {value: "initialDisposalStage", label: "完成处置"}
            ]
        },
        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        }
    },

    minorDamageToBuildings: {
        name: "轻微破坏建筑物",
        casualties: {
            type: "select",
            name: "人员伤亡",
            value: "",
            content: [
                {value: "casualties", label: "无"},
                {value: "casualties", label: "有（10人及以下）"},
                {value: "casualties", label: "有（10人以上）"}
            ]
        },
        usageType: {
            type: "select",
            name: "使用性质",
            value: "",
            content: [
                {value: "usageType", label: "住宅楼"},
                {value: "usageType", label: "自建房"},
                {value: "usageType", label: "办公楼"},
                {value: "usageType", label: "学校"},
                {value: "usageType", label: "医院"},
                {value: "usageType", label: "厂房"},
                {value: "usageType", label: "仓库"},
                {value: "usageType", label: "体育馆"},
                {value: "usageType", label: "展览馆"},
                {value: "usageType", label: "其它"}
            ]
        },
        structureType: {
            type: "select",
            name: "结构类型",
            value: "",
            content: [
                {value: "structureType", label: "砖木结构"},
                {value: "structureType", label: "砖混结构"},
                {value: "structureType", label: "钢筋混凝土结构"},
                {value: "structureType", label: "钢结构"},
                {value: "structureType", label: "其它"}
            ]
        },
        damageForm: {
            type: "select",
            name: "破坏形式",
            value: "",
            content: [
                {value: "damageForm", label: "振动破坏（地面振动通过基础传递到建筑物导致）"},
                {value: "damageForm", label: "地基失效破坏（如震后地基不均匀沉降、水平变位等导致）"},
                {value: "damageForm", label: "次生效应破坏（如震后滑坡、崩塌等导致）"}
            ]
        },
        disposalTeam: {
            type: "text",
            name: "处置队伍",
            value: ""
        },
        disposalMeasures: {
            type: "text",
            name: "处置措施",
            value: ""
        },
        initialDisposalPhase: {
            type: "select",
            name: "先期处置阶段",
            value: "",
            content: [
                {value: "initialDisposalPhase", label: "暂未处置"},
                {value: "initialDisposalPhase", label: "正在处置"},
                {value: "initialDisposalPhase", label: "完成处置"}
            ]
        },
        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        }
    },
    moderatelyDamagedBuildings: {
        name: "中等破坏建筑物",
        casualties: {
            type: "select",
            name: "人员伤亡",
            value: "",
            content: [
                {
                    value: "casualties",
                    label: "有（10人以上）"
                },
                {
                    value: "casualties",
                    label: "有（10人以下）"
                },
                {
                    value: "casualties",
                    label: "无"
                },
            ]
        },
        usageType: {
            type: "select",
            name: "使用性质",
            value: "",
            content: [
                {
                    value: "usageType",
                    label: "住宅楼"
                },
                {
                    value: "usageType",
                    label: "自建房"
                },
                {
                    value: "usageType",
                    label: "办公楼"
                },
                {
                    value: "usageType",
                    label: "学校"
                },
                {
                    value: "usageType",
                    label: "医院"
                },
                {
                    value: "usageType",
                    label: "厂房"
                },
                {
                    value: "usageType",
                    label: "仓库"
                },
                {
                    value: "usageType",
                    label: "体育馆"
                },
                {
                    value: "usageType",
                    label: "展览馆"
                },
                {
                    value: "usageType",
                    label: "其它"
                },
            ]
        },
        structureType: {
            type: "select",
            name: "结构类型",
            value: "",
            content: [
                {
                    value: "structureType",
                    label: "砖木结构"
                },
                {
                    value: "structureType",
                    label: "砖混结构"
                },
                {
                    value: "structureType ",
                    label: "钢筋混凝土结构"
                },
                {
                    value: "structureType",
                    label: "钢结构"
                },
                {
                    value: "structureType",
                    label: "其它"
                },
            ]
        },
        damageForm: {
            type: "select",
            name: "破坏模式",
            value: "",
            content: [
                {
                    value: "damageForm",
                    label: "振动破坏（地面振动通过基础传递到建筑物导致）"
                },
                {
                    value: "damageForm",
                    label: "地基失效破坏（如震后地基不均匀沉降、水平变位等导致）"
                },
                {
                    value: "damageForm",
                    label: "次生效应破坏（如震后滑坡、崩塌等导致）"
                },
            ]
        },
        disposalTeam: {
            type: "text",
            name: "处置队伍",
            value: ""
        },
        disposalMeasures: {
            type: "text",
            name: "处置措施",
            value: ""
        },
        initialDisposalPhase: {
            type: "select",
            name: "处置阶段",
            value: "",
            content: [
                {
                    value: "initialDisposalPhase",
                    label: "暂未处置"
                },
                {
                    value: "initialDisposalPhase",
                    label: "正在处置"
                },
                {
                    value: "initialDisposalPhase",
                    label: "完成处置"
                },
            ]
        },
        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        },
    },
    basicallyIntactBuildings: {
        name: "基本完好建筑物",
        casualties: {
            type: "select",
            name: "人员伤亡",
            value: "",
            content: [
                {
                    value: "casualties",
                    label: "有（10人以上）"
                },
                {
                    value: "casualties",
                    label: "有（10人以下）"
                },
                {
                    value: "casualties",
                    label: "无"
                },
            ]
        },
        usageType: {
            type: "select",
            name: "使用性质",
            value: "",
            content: [
                {
                    value: "usageType",
                    label: "住宅楼"
                },
                {
                    value: "usageType",
                    label: "自建房"
                },
                {
                    value: "usageType",
                    label: "办公楼"
                },
                {
                    value: "usageType",
                    label: "学校"
                },
                {
                    value: "usageType",
                    label: "医院"
                },
                {
                    value: "usageType",
                    label: "厂房"
                },
                {
                    value: "usageType",
                    label: "仓库"
                },
                {
                    value: "usageType",
                    label: "体育馆"
                },
                {
                    value: "usageType",
                    label: "展览馆"
                },
                {
                    value: "usageType",
                    label: "其它"
                },
            ]
        },
        structureType: {
            type: "select",
            name: "结构类型",
            value: "",
            content: [
                {
                    value: "structureType",
                    label: "砖木结构"
                },
                {
                    value: "structureType",
                    label: "砖混结构"
                },
                {
                    value: "structureType ",
                    label: "钢筋混凝土结构"
                },
                {
                    value: "structureType",
                    label: "钢结构"
                },
                {
                    value: "structureType",
                    label: "其它"
                },
            ]
        },
        damageForm: {
            type: "select",
            name: "破坏模式",
            value: "",
            content: [
                {
                    value: "damageForm",
                    label: "振动破坏（地面振动通过基础传递到建筑物导致）"
                },
                {
                    value: "damageForm",
                    label: "地基失效破坏（如震后地基不均匀沉降、水平变位等导致）"
                },
                {
                    value: "damageForm",
                    label: "次生效应破坏（如震后滑坡、崩塌等导致）"
                },
            ]
        },
        disposalTeam: {
            type: "text",
            name: "处置队伍",
            value: ""
        },
        disposalMeasures: {
            type: "text",
            name: "处置措施",
            value: ""
        },
        initialDisposalPhase: {
            type: "select",
            name: "处置阶段",
            value: "",
            content: [
                {
                    value: "initialDisposalPhase",
                    label: "暂未处置"
                },
                {
                    value: "initialDisposalPhase",
                    label: "正在处置"
                },
                {
                    value: "initialDisposalPhase",
                    label: "完成处置"
                },
            ]
        },
        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        },
    },
    seriousDamageBuildings: {
        name: "严重破坏建筑物",
        casualties: {
            type: "select",
            name: "人员伤亡",
            value: "",
            content: [
                {
                    value: "casualties",
                    label: "有（10人以上）"
                },
                {
                    value: "casualties",
                    label: "有（10人以下）"
                },
                {
                    value: "casualties",
                    label: "无"
                },
            ]
        },
        usageType: {
            type: "select",
            name: "使用性质",
            value: "",
            content: [
                {
                    value: "usageType",
                    label: "住宅楼"
                },
                {
                    value: "usageType",
                    label: "自建房"
                },
                {
                    value: "usageType",
                    label: "办公楼"
                },
                {
                    value: "usageType",
                    label: "学校"
                },
                {
                    value: "usageType",
                    label: "医院"
                },
                {
                    value: "usageType",
                    label: "厂房"
                },
                {
                    value: "usageType",
                    label: "仓库"
                },
                {
                    value: "usageType",
                    label: "体育馆"
                },
                {
                    value: "usageType",
                    label: "展览馆"
                },
                {
                    value: "usageType",
                    label: "其它"
                },
            ]
        },
        structureType: {
            type: "select",
            name: "结构类型",
            value: "",
            content: [
                {
                    value: "structureType",
                    label: "砖木结构"
                },
                {
                    value: "structureType",
                    label: "砖混结构"
                },
                {
                    value: "structureType ",
                    label: "钢筋混凝土结构"
                },
                {
                    value: "structureType",
                    label: "钢结构"
                },
                {
                    value: "structureType",
                    label: "其它"
                },
            ]
        },
        damageForm: {
            type: "select",
            name: "破坏模式",
            value: "",
            content: [
                {
                    value: "damageForm",
                    label: "振动破坏（地面振动通过基础传递到建筑物导致）"
                },
                {
                    value: "damageForm",
                    label: "地基失效破坏（如震后地基不均匀沉降、水平变位等导致）"
                },
                {
                    value: "damageForm",
                    label: "次生效应破坏（如震后滑坡、崩塌等导致）"
                },
            ]
        },
        disposalTeam: {
            type: "text",
            name: "处置队伍",
            value: ""
        },
        disposalMeasures: {
            type: "text",
            name: "处置措施",
            value: ""
        },
        initialDisposalPhase: {
            type: "select",
            name: "处置阶段",
            value: "",
            content: [
                {
                    value: "initialDisposalPhase",
                    label: "暂未处置"
                },
                {
                    value: "initialDisposalPhase",
                    label: "正在处置"
                },
                {
                    value: "initialDisposalPhase",
                    label: "完成处置"
                },
            ]
        },

        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        },
    },

    destructionCollapseBuildings: {
        name: "毁坏或倒塌建筑物",
        casualties: {
            type: "select",
            name: "人员伤亡",
            value: "",
            content: [
                {
                    value: "casualties",
                    label: "有（10人以上）"
                },
                {
                    value: "casualties",
                    label: "有（10人以下）"
                },
                {
                    value: "casualties",
                    label: "无"
                },
            ]
        },
        usageType: {
            type: "select",
            name: "使用性质",
            value: "",
            content: [
                {
                    value: "usageType",
                    label: "住宅楼"
                },
                {
                    value: "usageType",
                    label: "自建房"
                },
                {
                    value: "usageType",
                    label: "办公楼"
                },
                {
                    value: "usageType",
                    label: "学校"
                },
                {
                    value: "usageType",
                    label: "医院"
                },
                {
                    value: "usageType",
                    label: "厂房"
                },
                {
                    value: "usageType",
                    label: "仓库"
                },
                {
                    value: "usageType",
                    label: "体育馆"
                },
                {
                    value: "usageType",
                    label: "展览馆"
                },
                {
                    value: "usageType",
                    label: "其它"
                },
            ]
        },
        structureType: {
            type: "select",
            name: "结构类型",
            value: "",
            content: [
                {
                    value: "structureType",
                    label: "砖木结构"
                },
                {
                    value: "structureType",
                    label: "砖混结构"
                },
                {
                    value: "structureType ",
                    label: "钢筋混凝土结构"
                },
                {
                    value: "structureType",
                    label: "钢结构"
                },
                {
                    value: "structureType",
                    label: "其它"
                },
            ]
        },
        damageForm: {
            type: "select",
            name: "破坏模式",
            value: "",
            content: [
                {
                    value: "damageForm",
                    label: "振动破坏（地面振动通过基础传递到建筑物导致）"
                },
                {
                    value: "damageForm",
                    label: "地基失效破坏（如震后地基不均匀沉降、水平变位等导致）"
                },
                {
                    value: "damageForm",
                    label: "次生效应破坏（如震后滑坡、崩塌等导致）"
                },
            ]
        },
        disposalTeam: {
            type: "text",
            name: "处置队伍",
            value: ""
        },
        disposalMeasures: {
            type: "text",
            name: "处置措施",
            value: ""
        },
        initialDisposalPhase: {
            type: "select",
            name: "处置阶段",
            value: "",
            content: [
                {
                    value: "initialDisposalPhase",
                    label: "暂未处置"
                },
                {
                    value: "initialDisposalPhase",
                    label: "正在处置"
                },
                {
                    value: "initialDisposalPhase",
                    label: "完成处置"
                },
            ]
        },
        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        },
    },

    restrictedHighway: {
        name: "限制通行公路",
        roadName: {
            type: "text",
            name: "公路名称",
            value: ""
        },
        roadLevel: {
            type: "select",
            name: "公路级别",
            value: "",
            content: [
                {
                    value: "roadLevel",
                    label: "高速"
                },
                {
                    value: "roadLevel",
                    label: "国道"
                },
                {
                    value: "roadLevel",
                    label: "省道"
                },
                {
                    value: "roadLevel",
                    label: "县道"
                },
                {
                    value: "roadLevel",
                    label: "乡道"
                },
                {
                    value: "roadLevel",
                    label: "其它"
                }
            ]
        }
    },
    impassableHighway: {
        name: "不可通行公路",
        roadName: {
            type: "text",
            name: "公路名称",
            value: ""
        },
        roadLevel: {
            type: "select",
            name: "公路级别",
            value: "",
            content: [
                {
                    value: "roadLevel",
                    label: "高速"
                },
                {
                    value: "roadLevel",
                    label: "国道"
                },
                {
                    value: "roadLevel",
                    label: "省道"
                },
                {
                    value: "roadLevel",
                    label: "县道"
                },
                {
                    value: "roadLevel",
                    label: "乡道"
                },
                {
                    value: "roadLevel",
                    label: "其它"
                }
            ]
        }
    },
    roadDamagePoint: {
        name: "公路破坏点",
        roadName: {
            type: "text",
            name: "公路名称",
            value: ""
        },
        roadLevel: {
            type: "select",
            name: "公路等级",
            value: "",
            content: [
                {
                    value: "roadLevel",
                    label: "高速"
                },
                {
                    value: "roadLevel",
                    label: "国道"
                },
                {
                    value: "roadLevel",
                    label: "省道"
                },
                {
                    value: "roadLevel",
                    label: "县道"
                },
                {
                    value: "roadLevel",
                    label: "乡道"
                },
                {
                    value: "roadLevel",
                    label: "其它"
                }
            ]
        },
        casualties: {
            type: "select",
            name: "人员伤亡",
            value: "",
            content: [
                {
                    value: "casualties",
                    label: "有（10人以上）"
                },
                {
                    value: "casualties",
                    label: "有（10人以下）"
                },
                {
                    value: "casualties",
                    label: "无"
                },
            ]
        },
        damageType: {
            type: "select",
            name: "破坏形式",
            value: "",
            content: [
                {
                    value: "damageType",
                    label: "路面破坏（如路面出现裂缝、悬空、断裂等）"
                },
                {
                    value: "damageType",
                    label: "路基破坏（如路基隆起、沉陷等）"
                },
                {
                    value: "damageType",
                    label: "边坡破坏（如震后滑坡、崩塌等）"
                }
            ]
        },
        disposalTeam: {
            type: "text",
            name: "处置队伍",
            value: ""
        },
        disposalMeasures: {
            type: "text",
            name: "处置措施",
            value: ""
        },
        initialDisposalPhase: {
            type: "select",
            name: "先期处置阶段",
            value: "",
            content: [
                {
                    value: "initialDisposalPhase",
                    label: "暂未处置"
                },
                {
                    value: "initialDisposalPhase",
                    label: "正在处置"
                },
                {
                    value: "initialDisposalPhase",
                    label: "完成处置"
                }
            ]
        },
        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        }
    },
    trafficControlPoint: {
        name: "交通管制点",
        roadName: {
            type: "text",
            name: "公路名称",
            value: ""
        },
        roadLevel: {
            type: "select",
            name: "公路等级",
            value: "",
            content: [
                {
                    value: "roadLevel",
                    label: "高速"
                },
                {
                    value: "roadLevel",
                    label: "国道"
                },
                {
                    value: "roadLevel",
                    label: "省道"
                },
                {
                    value: "roadLevel",
                    label: "县道"
                },
                {
                    value: "roadLevel",
                    label: "乡道"
                },
                {
                    value: "roadLevel",
                    label: "其它"
                }
            ]
        },
        controlType: {
            type: "select",
            name: "管制类型",
            value: "",
            content: [
                {
                    value: "controlType",
                    label: "限行"
                },
                {
                    value: "controlType",
                    label: "禁行"
                }
            ]
        },
        controlUnit: {
            type: "text",
            name: "管制单位",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        }
    },
    impassableRailways: {
        name: "不可通行铁路",
        railwayName: {
            type: "text",
            name: "铁路名称",
            value: ""
        },
        casualties: {
            type: "select",
            name: "人员伤亡",
            value: "",
            content: [
                {value: "casualties", label: "无"},
                {value: "casualties", label: "有（10人及以下）"},
                {value: "casualties", label: "有（10人以上）"}
            ]
        },
        railwayLevel: {
            type: "select",
            name: "铁路等级",
            value: "",
            content: [
                {value: "passengerDedicatedLine", label: "客运专线"},
                {value: "mixedPassengerFreight", label: "客货共线"},
                {value: "freightDedicatedLine", label: "货运专线"}
            ]
        },
        disposalTeam: {
            type: "text",
            name: "处置队伍",
            value: ""
        },
        disposalMeasures: {
            type: "text",
            name: "处置措施",
            value: ""
        },
        initialDisposalPhase: {
            type: "select",
            name: "先期处置阶段",
            value: "",
            content: [
                {value: "notDisposed", label: "暂未处置"},
                {value: "inProcess", label: "正在处置"},
                {value: "completed", label: "完成处置"}
            ]
        },
        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        }
    },
    railwayDamagePoints: {
        name: "铁路破坏点",
        railwayName: {
            type: "text",
            name: "铁路名称",
            value: ""
        },
        casualties: {
            type: "select",
            name: "人员伤亡",
            value: "",
            content: [
                {value: "casualties", label: "无"},
                {value: "casualties", label: "有（10人及以下）"},
                {value: "casualties", label: "有（10人以上）"}
            ]
        },
        railwayLevel: {
            type: "select",
            name: "铁路等级",
            value: "",
            content: [
                {value: "passengerDedicatedLine", label: "客运专线"},
                {value: "mixedPassengerFreight", label: "客货共线"},
                {value: "freightDedicatedLine", label: "货运专线"}
            ]
        },
        disposalTeam: {
            type: "text",
            name: "处置队伍",
            value: ""
        },
        disposalMeasures: {
            type: "text",
            name: "处置措施",
            value: ""
        },
        initialDisposalPhase: {
            type: "select",
            name: "先期处置阶段",
            value: "",
            content: [
                {value: "notDisposed", label: "暂未处置"},
                {value: "inProcess", label: "正在处置"},
                {value: "completed", label: "完成处置"}
            ]
        },
        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        }
    },
    availableAirport: {
        name: "可用机场",
        airportName: {
            type: "text",
            name: "机场名称",
            value: ""
        },
        casualties: {
            type: "select",
            name: "人员伤亡",
            value: "",
            content: [
                {value: "casualties", label: "无"},
                {value: "casualties", label: "有"}
            ]
        },
        airportLevel: {
            type: "select",
            name: "飞行区等级",
            value: "",
            content: [
                {value: "4F", label: "4F"},
                {value: "4E", label: "4E"},
                {value: "4D", label: "4D"},
                {value: "4C", label: "4C"},
                {value: "3C", label: "3C"}
            ]
        },
        disposalTeam: {
            type: "text",
            name: "处置队伍",
            value: ""
        },
        disposalMeasures: {
            type: "text",
            name: "处置措施",
            value: ""
        },
        initialDisposalPhase: {
            type: "select",
            name: "先期处置阶段",
            value: "",
            content: [
                {value: "initialDisposalPhase", label: "暂未处置"},
                {value: "initialDisposalPhase", label: "正在处置"},
                {value: "initialDisposalPhase", label: "完成处置"}
            ]
        },
        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        }
    },
    unAvailableAirport: {
        name: "不可用机场",
        airportName: {
            type: "text",
            name: "机场名称",
            value: ""
        },
        casualties: {
            type: "select",
            name: "人员伤亡",
            value: "",
            content: [
                {value: "casualties", label: "无"},
                {value: "casualties", label: "有"}
            ]
        },
        airportLevel: {
            type: "select",
            name: "飞行区等级",
            value: "",
            content: [
                {value: "4F", label: "4F"},
                {value: "4E", label: "4E"},
                {value: "4D", label: "4D"},
                {value: "4C", label: "4C"},
                {value: "3C", label: "3C"}
            ]
        },
        disposalTeam: {
            type: "text",
            name: "处置队伍",
            value: ""
        },
        disposalMeasures: {
            type: "text",
            name: "处置措施",
            value: ""
        },
        initialDisposalPhase: {
            type: "select",
            name: "先期处置阶段",
            value: "",
            content: [
                {value: "initialDisposalPhase", label: "暂未处置"},
                {value: "initialDisposalPhase", label: "正在处置"},
                {value: "initialDisposalPhase", label: "完成处置"}
            ]
        },
        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        }
    },
    limitedAccessBridge: {
        name: "限制通行桥梁",
        bridgeName: {
            type: "text",
            name: "桥梁名称",
            value: ""
        },
        roadName: {
            type: "text",
            name: "所在公路",
            value: ""
        },
        bridgeType: {
            type: "select",
            name: "桥梁类型",
            value: "",
            content: [
                {value: "bridgeType", label: "小桥（≤30m）"},
                {value: "bridgeType", label: "中桥（30-100m）"},
                {value: "bridgeType", label: "大桥（100-1000m）"},
                {value: "bridgeType", label: "特大桥（＞1000m）"}
            ]
        },
        casualties: {
            type: "select",
            name: "人员伤亡",
            value: "",
            content: [
                {value: "casualties", label: "无"},
                {value: "casualties", label: "有"}
            ]
        },
        damageForm: {
            type: "select",
            name: "破坏形式",
            value: "",
            content: [
                {value: "damageForm", label: "上部结构破坏（如桥面开裂、沉陷、断裂，落梁等）"},
                {value: "damageForm", label: "桥台、桥墩破坏（如桥台滑移、倾斜等，桥墩开裂、沉降、倒塌等）"},
                {value: "damageForm", label: "支承连接件破坏（支座移位、倾倒、脱落，锚固螺栓拔出、剪断等）"}
            ]
        },
        responseTeam: {
            type: "text",
            name: "处置队伍",
            value: ""
        },
        responseMeasure: {
            type: "text",
            name: "处置措施",
            value: ""
        },
        initialResponsePhase: {
            type: "select",
            name: "先期处置阶段",
            value: "",
            content: [
                {value: "initialResponsePhase", label: "暂未处置"},
                {value: "initialResponsePhase", label: "正在处置"},
                {value: "initialResponsePhase", label: "完成处置"}
            ]
        },
        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        }
    },
    inaccessibleBridge: {
        name: "不可通行桥梁",
        bridgeName: {
            type: "text",
            name: "桥梁名称",
            value: ""
        },
        roadName: {
            type: "text",
            name: "所在公路",
            value: ""
        },
        bridgeType: {
            type: "select",
            name: "桥梁类型",
            value: "",
            content: [
                {value: "bridgeType", label: "小桥（≤30m）"},
                {value: "bridgeType", label: "中桥（30-100m）"},
                {value: "bridgeType", label: "大桥（100-1000m）"},
                {value: "bridgeType", label: "特大桥（＞1000m）"}
            ]
        },
        casualties: {
            type: "select",
            name: "人员伤亡",
            value: "",
            content: [
                {value: "casualties", label: "无"},
                {value: "casualties", label: "有"}
            ]
        },
        damageForm: {
            type: "select",
            name: "破坏形式",
            value: "",
            content: [
                {value: "damageForm", label: "上部结构破坏（如桥面开裂、沉陷、断裂，落梁等）"},
                {value: "damageForm", label: "桥台、桥墩破坏（如桥台滑移、倾斜等，桥墩开裂、沉降、倒塌等）"},
                {value: "damageForm", label: "支承连接件破坏（支座移位、倾倒、脱落，锚固螺栓拔出、剪断等）"}
            ]
        },
        responseTeam: {
            type: "text",
            name: "处置队伍",
            value: ""
        },
        responseMeasure: {
            type: "text",
            name: "处置措施",
            value: ""
        },
        initialResponsePhase: {
            type: "select",
            name: "先期处置阶段",
            value: "",
            content: [
                {value: "initialResponsePhase", label: "暂未处置"},
                {value: "initialResponsePhase", label: "正在处置"},
                {value: "initialResponsePhase", label: "完成处置"}
            ]
        },
        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        }
    },
    unpassableTunnel: {
        name: "不可通行隧道",
        tunnelName: {
            type: "text",
            name: "隧道名称",
            value: ""
        },
        line: {
            type: "text",
            name: "所在线路",
            value: ""
        },
        tunnelType: {
            type: "select",
            name: "隧道类型",
            value: "",
            content: [
                {
                    value: "tunnelType",
                    label: "短隧道（≤0.5km）"
                },
                {
                    value: "tunnelType",
                    label: "中隧道（0.5-3km）"
                },
                {
                    value: "tunnelType",
                    label: "长隧道（3-10km）"
                },
                {
                    value: "tunnelType",
                    label: "特长隧道（＞10km）"
                }
            ]
        },
        casualties: {
            type: "select",
            name: "人员伤亡",
            value: "",
            content: [
                {
                    value: "casualties",
                    label: "无"
                },
                {
                    value: "casualties",
                    label: "有"
                }
            ]
        },
        damageForm: {
            type: "select",
            name: "破坏形式",
            value: "",
            content: [
                {
                    value: "damageForm",
                    label: "衬砌破坏（如开裂、剥落、移位、坍塌等）"
                },
                {
                    value: "damageForm",
                    label: "底板破坏（如底板开裂、隆起等）"
                },
                {
                    value: "damageForm",
                    label: "洞口破坏（洞口塌方、洞门裂损等）"
                }
            ]
        },
        responseTeam: {
            type: "text",
            name: "处置队伍",
            value: ""
        },
        responseMeasures: {
            type: "text",
            name: "处置措施",
            value: ""
        },
        initialResponseStage: {
            type: "select",
            name: "先期处置阶段",
            value: "",
            content: [
                {
                    value: "initialResponseStage",
                    label: "暂未处置"
                },
                {
                    value: "initialResponseStage",
                    label: "正在处置"
                },
                {
                    value: "initialResponseStage",
                    label: "完成处置"
                }
            ],
            initialDisposalPhase: {
                type: "select",
                name: "先期处置阶段",
                value: "",
                content: [
                    {value: "initialDisposalPhase", label: "暂未处置"},
                    {value: "initialDisposalPhase", label: "正在处置"},
                    {value: "initialDisposalPhase", label: "完成处置"}
                ]
            },
            contactPerson: {
                type: "text",
                name: "联系人员",
                value: ""
            },
            contactPhone: {
                type: "text",
                name: "联系电话",
                value: ""
            }
        },
        // initialDisposalTime: {
        //     type: "text",
        //     name: "先期处置时间",
        //     value: ""
        // },
        // estimatedDisposalTime: {
        //     type: "text",
        //     name: "预计处置时间",
        //     value: ""
        // },
        // actualDisposalTime: {
        //     type: "text",
        //     name: "实际处置时间",
        //     value: ""
        // },
    },
    unavailableWaterSupplyNetwork: {
        name: "不可用供水管网",
        waterSupplyArea: {
            type: "text",
            name: "供水区域",
            value: ""
        },
        waterSupplyNetworkType: {
            type: "select",
            name: "供水管网类型",
            value: "",
            content: [
                {value: "waterSupplyNetworkType", label: "一级"},
                {value: "waterSupplyNetworkType", label: "二级"},
                {value: "waterSupplyNetworkType", label: "三级"}
            ]
        }
    },
    waterSupplyPipelineDamagePoint: {
        name: "供水管线破坏点",
        damageForm: {
            type: "selectMultiple",
            name: "破坏形式",
            value: "",
            content: [
                {value: "damageForm", label: "连接破坏"},
                {value: "damageForm", label: "接口破坏"},
                {value: "damageForm", label: "管体破坏"}
            ]
        },
        disposalTeam: {
            type: "text",
            name: "处置队伍",
            value: ""
        },
        disposalMeasure: {
            type: "text",
            name: "处置措施",
            value: ""
        },
        initialDisposalStage: {
            type: "select",
            name: "先期处置阶段",
            value: "",
            content: [
                {value: "initialDisposalStage", label: "暂未处置"},
                {value: "initialDisposalStage", label: "正在处置"},
                {value: "initialDisposalStage", label: "完成处置"}
            ]
        },
        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        }
    },
    unavailableTransmissionAndDistributionLines: {
        name: "不可用输、配电线路",
        supplyArea: {
            type: "text",
            name: "供电区域",
            value: ""
        },
        voltageLevel: {
            type: "select",
            name: "电压等级",
            value: "",
            content: [
                {value: "voltageLevel", label: "低压（≤1kV）"},
                {value: "voltageLevel", label: "高压（10-220kV）"},
                {value: "voltageLevel", label: "超高压（330-750kV）"},
                {value: "voltageLevel", label: "特高压（＞750kV）"}
            ]
        }
    },
    // 后端找不到对应的实体类
    transmissionAndDistributionLineDamagePoints: {
        name: "输、配电线路破坏点",
        damageForm: {
            type: "selectMultiple",
            name: "破坏形式",
            value: "",
            content: [
                {value: "electricalEquipmentDamage", label: "电气设备破坏（如变压器、电线等破坏）"},
                {value: "towerDamage", label: "杆塔破坏（如杆塔倾斜、断裂、倒塌等）"}
            ]
        },
        disposalTeam: {
            type: "text",
            name: "处置队伍",
            value: ""
        },
        disposalMeasures: {
            type: "text",
            name: "处置措施",
            value: ""
        },
        initialDisposalStage: {
            type: "select",
            name: "先期处置阶段",
            value: "",
            content: [
                {value: "notDisposed", label: "暂未处置"},
                {value: "inProcess", label: "正在处置"},
                {value: "completed", label: "完成处置"}
            ]
        },
        managementUnit: {
            type: "text",
            name: "管理单位",
            value: ""
        },
        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhoneNumber: {
            type: "text",
            name: "联系电话",
            value: ""
        }
    },

    unusableGasPipeline: {
        name: "不可用输气管线",
        supplyArea: {
            type: "text",
            name: "供气区域",
            value: ""
        },
        pipeType: {
            type: "select",
            name: "管道分类",
            value: "",
            content: [
                {value: "pipeType", label: "长距离输气管线"},
                {value: "pipeType", label: "城市燃气管道"},
                {value: "pipeType", label: "工业企业燃气管道"}
            ]
        },
        managementUnit: {
            type: "text",
            name: "管理单位",
            value: ""
        },
        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        }
    },
    damagePointsOfGasSupplyPipelines: {
        name: "供气管线破坏点",
        damageForm: {
            type: "selectMultiple",
            name: "破坏形式",
            value: "",
            content: [
                {value: "damageForm", label: "接口破坏"},
                {value: "damageForm", label: "管道破坏"}
            ]
        },
        disposalTeam: {
            type: "text",
            name: "处置队伍",
            value: ""
        },
        disposalMeasure: {
            type: "text",
            name: "处置措施",
            value: ""
        },
        initialDisposalStage: {
            type: "select",
            name: "先期处置阶段",
            value: "",
            content: [
                {value: "initialDisposalStage", label: "暂未处置"},
                {value: "initialDisposalStage", label: "正在处置"},
                {value: "initialDisposalStage", label: "完成处置"}
            ]
        },
        managementUnit: {
            type: "text",
            name: "管理单位",
            value: ""
        },
        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        }
    },
    barrierLake: {
        name: "堰塞湖",
        riverSystem: {
            type: "text",
            name: "所在水系",
            value: ""
        },
        damScaleLength: {
            type: "text",
            name: "顺河长度 (m)",
            value: ""
        },
        damScaleWidth: {
            type: "text",
            name: "宽度 (m)",
            value: ""
        },
        damScaleHeight: {
            type: "text",
            name: "高度 (m)",
            value: ""
        },
        estimatedDanger: {
            type: "select",
            name: "堰塞体危险性",
            value: "",
            content: [
                {
                    value: "estimatedDanger",
                    label: "低危险"
                },
                {
                    value: "estimatedDanger",
                    label: "中危险"
                },
                {
                    value: "estimatedDanger",
                    label: "高危险"
                },
                {
                    value: "estimatedDanger",
                    label: "极高危险"
                }
            ]
        },
        estimatedStorageCapacity: {
            type: "select",
            name: "预估库容",
            value: "",
            content: [
                {
                    value: "estimatedStorageCapacity",
                    label: "≤100万方"
                },
                {
                    value: "estimatedStorageCapacity",
                    label: "100-1000万方"
                },
                {
                    value: "estimatedStorageCapacity",
                    label: "1000万方-1亿方"
                },
                {
                    value: "estimatedStorageCapacity",
                    label: "≥1亿方"
                }
            ]
        },
        area: {
            type: "select",
            name: "淹没和溃决影响区",
            value: "",
            content: [
                {
                    value: "area",
                    label: "城镇乡村"
                },
                {
                    value: "area",
                    label: "工矿企业"
                },
                {
                    value: "area",
                    label: "重要基础设施"
                },
                {
                    value: "area",
                    label: "其他（如文物、珍稀动植物、水源地等）"
                }
            ]
        },
        responseTeam: {
            type: "text",
            name: "处置队伍",
            value: ""
        },
        responseMeasures: {
            type: "text",
            name: "处置措施",
            value: ""
        },
        initialDisposalPhase: {
            type: "select",
            name: "先期处置阶段",
            value: "",
            content: [
                {
                    value: "initialDisposalPhase",
                    label: "暂未处置"
                },
                {
                    value: "initialDisposalPhase",
                    label: "正在处置"
                },
                {
                    value: "initialDisposalPhase",
                    label: "完成处置"
                }
            ]
        },
        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        }
    },
    basicallyIntactDam: {
        name: "基本完好大坝",
        reservoirName: {
            type: "text",
            name: "水库（电站）名称",
            value: ""
        },
        damType: {
            type: "select",
            name: "大坝类型",
            value: "",
            content: [
                {value: "damType", label: "土石坝"},
                {value: "damType", label: "混凝土坝"},
                {value: "damType", label: "砌石坝"},
                {value: "damType", label: "其他"}
            ]
        },
        projectScale: {
            type: "select",
            name: "工程规模",
            value: "",
            content: [
                {value: "projectScale", label: "小（2）型"},
                {value: "projectScale", label: "小（1）型"},
                {value: "projectScale", label: "中型"},
                {value: "projectScale", label: "大（2）型"},
                {value: "projectScale", label: "大（1）型"}
            ]
        },
        disposalTeam: {
            type: "text",
            name: "处置队伍",
            value: ""
        },
        disposalMeasures: {
            type: "text",
            name: "处置措施",
            value: ""
        },
        initialDisposalPhase: {
            type: "select",
            name: "先期处置阶段",
            value: "",
            content: [
                {value: "initialDisposalPhase", label: "暂未处置"},
                {value: "initialDisposalPhase", label: "正在处置"},
                {value: "initialDisposalPhase", label: "完成处置"}
            ]
        },
        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        }
    },
    moderatelyDamagedDam: {
        name: "中等破坏大坝",
        reservoirName: {
            type: "text",
            name: "水库（电站）名称",
            value: ""
        },
        damType: {
            type: "select",
            name: "大坝类型",
            value: "",
            content: [
                {value: "damType", label: "土石坝"},
                {value: "damType", label: "混凝土坝"},
                {value: "damType", label: "砌石坝"},
                {value: "damType", label: "其他"}
            ]
        },
        projectScale: {
            type: "select",
            name: "工程规模",
            value: "",
            content: [
                {value: "projectScale", label: "小（2）型"},
                {value: "projectScale", label: "小（1）型"},
                {value: "projectScale", label: "中型"},
                {value: "projectScale", label: "大（2）型"},
                {value: "projectScale", label: "大（1）型"}
            ]
        },
        disposalTeam: {
            type: "text",
            name: "处置队伍",
            value: ""
        },
        disposalMeasures: {
            type: "text",
            name: "处置措施",
            value: ""
        },
        initialDisposalPhase: {
            type: "select",
            name: "先期处置阶段",
            value: "",
            content: [
                {value: "initialDisposalPhase", label: "暂未处置"},
                {value: "initialDisposalPhase", label: "正在处置"},
                {value: "initialDisposalPhase", label: "完成处置"}
            ]
        },
        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        }
    },
    severelyDamagedDam: {
        name: "严重破坏大坝",
        reservoirName: {
            type: "text",
            name: "水库（电站）名称",
            value: ""
        },
        damType: {
            type: "select",
            name: "大坝类型",
            value: "",
            content: [
                {value: "damType", label: "土石坝"},
                {value: "damType", label: "混凝土坝"},
                {value: "damType", label: "砌石坝"},
                {value: "damType", label: "其他"}
            ]
        },
        projectScale: {
            type: "select",
            name: "工程规模",
            value: "",
            content: [
                {value: "projectScale", label: "小（2）型"},
                {value: "projectScale", label: "小（1）型"},
                {value: "projectScale", label: "中型"},
                {value: "projectScale", label: "大（2）型"},
                {value: "projectScale", label: "大（1）型"}
            ]
        },
        disposalTeam: {
            type: "text",
            name: "处置队伍",
            value: ""
        },
        disposalMeasures: {
            type: "text",
            name: "处置措施",
            value: ""
        },
        initialDisposalPhase: {
            type: "select",
            name: "先期处置阶段",
            value: "",
            content: [
                {value: "initialDisposalPhase", label: "暂未处置"},
                {value: "initialDisposalPhase", label: "正在处置"},
                {value: "initialDisposalPhase", label: "完成处置"}
            ]
        },
        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        }
    },
    basicallyIntactLevee: {
        name: "基本完好堤防",
        waterSystem: {
            type: "text",
            name: "所在水系",
            value: ""
        },
        floodStandard: {
            type: "select",
            name: "防洪标准",
            value: "",
            content: [
                {value: "floodStandard", label: "1级"},
                {value: "floodStandard", label: "2级"},
                {value: "floodStandard", label: "3级"},
                {value: "floodStandard", label: "4级"},
                {value: "floodStandard", label: "5级"}
            ]
        },
        constructionMaterial: {
            type: "select",
            name: "建筑材料",
            value: "",
            content: [
                {value: "constructionMaterial", label: "土堤"},
                {value: "constructionMaterial", label: "石堤"},
                {value: "constructionMaterial", label: "土石混合堤"},
                {value: "constructionMaterial", label: "钢筋混凝土堤"}
            ]
        },
        disposalTeam: {
            type: "text",
            name: "处置队伍",
            value: ""
        },
        disposalMeasures: {
            type: "text",
            name: "处置措施",
            value: ""
        },
        initialDisposalPhase: {
            type: "select",
            name: "先期处置阶段",
            value: "",
            content: [
                {value: "initialDisposalPhase", label: "暂未处置"},
                {value: "initialDisposalPhase", label: "正在处置"},
                {value: "initialDisposalPhase", label: "完成处置"}
            ]
        },
        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        }
    },
    moderatelyDamagedLevee: {
        name: "中等破坏堤防",
        waterSystem: {
            type: "text",
            name: "所在水系",
            value: ""
        },
        floodStandard: {
            type: "select",
            name: "防洪标准",
            value: "",
            content: [
                {value: "floodStandard", label: "1级"},
                {value: "floodStandard", label: "2级"},
                {value: "floodStandard", label: "3级"},
                {value: "floodStandard", label: "4级"},
                {value: "floodStandard", label: "5级"}
            ]
        },
        constructionMaterial: {
            type: "select",
            name: "建筑材料",
            value: "",
            content: [
                {value: "constructionMaterial", label: "土堤"},
                {value: "constructionMaterial", label: "石堤"},
                {value: "constructionMaterial", label: "土石混合堤"},
                {value: "constructionMaterial", label: "钢筋混凝土堤"}
            ]
        },
        disposalTeam: {
            type: "text",
            name: "处置队伍",
            value: ""
        },
        disposalMeasures: {
            type: "text",
            name: "处置措施",
            value: ""
        },
        initialDisposalPhase: {
            type: "select",
            name: "先期处置阶段",
            value: "",
            content: [
                {value: "initialDisposalPhase", label: "暂未处置"},
                {value: "initialDisposalPhase", label: "正在处置"},
                {value: "initialDisposalPhase", label: "完成处置"}
            ]
        },
        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        }
    },
    severelyDamagedLevee: {
        name: "严重破坏堤防",
        waterSystem: {
            type: "text",
            name: "所在水系",
            value: ""
        },
        floodStandard: {
            type: "select",
            name: "防洪标准",
            value: "",
            content: [
                {value: "floodStandard", label: "1级"},
                {value: "floodStandard", label: "2级"},
                {value: "floodStandard", label: "3级"},
                {value: "floodStandard", label: "4级"},
                {value: "floodStandard", label: "5级"}
            ]
        },
        constructionMaterial: {
            type: "select",
            name: "建筑材料",
            value: "",
            content: [
                {value: "constructionMaterial", label: "土堤"},
                {value: "constructionMaterial", label: "石堤"},
                {value: "constructionMaterial", label: "土石混合堤"},
                {value: "constructionMaterial", label: "钢筋混凝土堤"}
            ]
        },
        disposalTeam: {
            type: "text",
            name: "处置队伍",
            value: ""
        },
        disposalMeasures: {
            type: "text",
            name: "处置措施",
            value: ""
        },
        initialDisposalPhase: {
            type: "select",
            name: "先期处置阶段",
            value: "",
            content: [
                {value: "initialDisposalPhase", label: "暂未处置"},
                {value: "initialDisposalPhase", label: "正在处置"},
                {value: "initialDisposalPhase", label: "完成处置"}
            ]
        },
        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        }
    },
    explosion: {
        name: "爆炸",
        enterpriseName: {
            type: "text",
            name: "企业（单位）名称",
            value: ""
        },
        explosionType: {
            type: "select",
            name: "爆炸类型",
            value: "",
            content: [
                {value: "explosionType", label: "物理性爆炸（如压力容器、油桶受热等）"},
                {value: "explosionType", label: "化学性爆炸（如危化品、可燃气体、粉尘等）"},
                {value: "explosionType", label: "核爆炸"}
            ]
        },
        impactArea: {
            type: "text",
            name: "影响范围 (m²)",
            value: ""
        },
        casualties: {
            type: "select",
            name: "人员伤亡",
            value: "",
            content: [
                {value: "casualties", label: "无"},
                {value: "casualties", label: "有"}
            ]
        },
        responseTeam: {
            type: "text",
            name: "处置队伍",
            value: ""
        },
        responseMeasure: {
            type: "text",
            name: "处置措施",
            value: ""
        },
        initialResponseStage: {
            type: "select",
            name: "先期处置阶段",
            value: "",
            content: [
                {value: "initialResponseStage", label: "暂未处置"},
                {value: "initialResponseStage", label: "正在处置"},
                {value: "initialResponseStage", label: "完成处置"}
            ]
        },
        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        }
    },
    fireDisaster: {
        name: "火灾",
        companyName: {
            type: "text",
            name: "企业（单位）名称",
            value: ""
        },
        fireType: {
            type: "select",
            name: "火灾类型",
            value: "",
            content: [
                {value: "fireType", label: "明火引发（炉具倾倒、防震棚起火、烟囱损坏等）"},
                {value: "fireType", label: "易燃易爆物质反应（如危化品、天然气、汽油等）"},
                {value: "fireType", label: "电气设施损坏（电线短路、电流过载等）"},
                {value: "fireType", label: "其他"}
            ]
        },
        fireLevel: {
            type: "select",
            name: "火灾等级",
            value: "",
            content: [
                {value: "fireLevel", label: "一级火灾（燃烧不超过10m²，且火势高度不超过3m）"},
                {value: "fireLevel", label: "二级火灾（燃烧不超过30m²，且火势高度不超过6m）"},
                {value: "fireLevel", label: "三级火灾（燃烧不超过200m²，且火势高度不超过20m）"},
                {value: "fireLevel", label: "四级火灾（燃烧超过200m²，或火势高度超过20m）"}
            ]
        },
        casualties: {
            type: "select",
            name: "人员伤亡",
            value: "",
            content: [
                {value: "casualties", label: "无"},
                {value: "casualties", label: "有"}
            ]
        },
        responseTeam: {
            type: "text",
            name: "处置队伍",
            value: ""
        },
        responseMeasures: {
            type: "text",
            name: "处置措施",
            value: ""
        },
        initialResponsePhase: {
            type: "select",
            name: "先期处置阶段",
            value: "",
            content: [
                {value: "initialResponsePhase", label: "暂未处置"},
                {value: "initialResponsePhase", label: "正在处置"},
                {value: "initialResponsePhase", label: "完成处置"}
            ]
        },
        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        }
    },
    toxicSubstanceLeak: {
        name: "有毒物质泄露",
        toxicSubstanceType: {
            type: "select",
            name: "有毒物质类型",
            value: "",
            content: [
                {value: "toxicSubstanceType", label: "有毒气体（如氨气、氯气、二氧化氮、二氧化硫、一氧化碳、硫化氢等）"},
                {value: "toxicSubstanceType", label: "有毒液体（如液氨、强酸、强碱等）"},
                {value: "toxicSubstanceType", label: "有毒固体（氰化物、重金属等）"}
            ]
        },
        disposalTeam: {
            type: "text",
            name: "处置队伍",
            value: ""
        },
        disposalMeasure: {
            type: "text",
            name: "处置措施",
            value: ""
        },
        initialDisposalStage: {
            type: "select",
            name: "先期处置阶段",
            value: "",
            content: [
                {value: "initialDisposalStage", label: "暂未处置"},
                {value: "initialDisposalStage", label: "正在处置"},
                {value: "initialDisposalStage", label: "完成处置"}
            ]
        },
        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        }
    },
    nuclearPollution: {
        name: "核污染",
        disposalTeam: {
            type: "text",
            name: "处置队伍",
            value: ""
        },
        disposalMeasure: {
            type: "text",
            name: "处置措施",
            value: ""
        },
        initialDisposalStage: {
            type: "select",
            name: "先期处置阶段",
            value: "",
            content: [
                {value: "initialDisposalStage", label: "暂未处置"},
                {value: "initialDisposalStage", label: "正在处置"},
                {value: "initialDisposalStage", label: "完成处置"}
            ]
        },
        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        }
    },

    OutDoorShelter: {
        name: "室外型避难场所",
        shelterName: {
            type: "text",
            name: "场所名称",
            value: ""
        },
        shelterLevel: {
            type: "select",
            name: "场所级别",
            value: "",
            content: [
                {
                    value: "shelterLevel",
                    label: "省级"
                },
                {
                    value: "shelterLevel",
                    label: "市级"
                },
                {
                    value: "shelterLevel",
                    label: "县级"
                },
                {
                    value: "shelterLevel",
                    label: "乡镇（街道）级"
                },
                {
                    value: "shelterLevel",
                    label: "村（社区）级"
                }
            ]
        },
        shelterFunction: {
            type: "select",
            name: "场所功能",
            value: "",
            content: [
                {
                    value: "shelterFunction",
                    label: "单一性"
                },
                {
                    value: "shelterFunction",
                    label: "综合性"
                },
                {
                    value: "shelterFunction",
                    label: "特定避难场所"
                }
            ]
        },
        shelterType: {
            type: "select",
            name: "场所类型",
            value: "",
            content: [
                {
                    value: "shelterType",
                    label: "紧急型（1天以内）"
                },
                {
                    value: "shelterType",
                    label: "短期型（2-14天）"
                },
                {
                    value: "shelterType",
                    label: "长期型（15-180天）"
                }
            ]
        },
        shelterCapacity: {
            type: "select",
            name: "避难人员数量",
            value: "",
            content: [
                {
                    value: "shelterCapacity",
                    label: "50人以下"
                },
                {
                    value: "shelterCapacity",
                    label: "50-100人"
                },
                {
                    value: "shelterCapacity",
                    label: "100-200人"
                },
                {
                    value: "shelterCapacity",
                    label: "200-500人"
                },
                {
                    value: "shelterCapacity",
                    label: "500人以上"
                }
            ]
        },
        managementUnit: {
            type: "text",
            name: "管护单位",
            value: ""
        },
        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        }
    },
    inDoorShelter: {
        name: "室内型避难场所",
        shelterName: {
            type: "text",
            name: "场所名称",
            value: ""
        },
        shelterLevel: {
            type: "select",
            name: "场所级别",
            value: "",
            content: [
                {
                    value: "shelterLevel",
                    label: "省级"
                },
                {
                    value: "shelterLevel",
                    label: "市级"
                },
                {
                    value: "shelterLevel",
                    label: "县级"
                },
                {
                    value: "shelterLevel",
                    label: "乡镇（街道）级"
                },
                {
                    value: "shelterLevel",
                    label: "村（社区）级"
                }
            ]
        },
        shelterFunction: {
            type: "select",
            name: "场所功能",
            value: "",
            content: [
                {
                    value: "shelterFunction",
                    label: "单一性"
                },
                {
                    value: "shelterFunction",
                    label: "综合性"
                },
                {
                    value: "shelterFunction",
                    label: "特定避难场所"
                }
            ]
        },
        shelterType: {
            type: "select",
            name: "场所类型",
            value: "",
            content: [
                {
                    value: "shelterType",
                    label: "紧急型（1天以内）"
                },
                {
                    value: "shelterType",
                    label: "短期型（2-14天）"
                },
                {
                    value: "shelterType",
                    label: "长期型（15-180天）"
                }
            ]
        },
        shelterCapacity: {
            type: "select",
            name: "避难人员数量",
            value: "",
            content: [
                {
                    value: "shelterCapacity",
                    label: "50人以下"
                },
                {
                    value: "shelterCapacity",
                    label: "50-100人"
                },
                {
                    value: "shelterCapacity",
                    label: "100-200人"
                },
                {
                    value: "shelterCapacity",
                    label: "200-500人"
                },
                {
                    value: "shelterCapacity",
                    label: "500人以上"
                }
            ]
        },
        managementUnit: {
            type: "text",
            name: "管护单位",
            value: ""
        },
        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        }
    },
    permanentShelter: {
        name: "常备避险安置点",
        shelterName: {
            type: "text",
            name: "安置点名称",
            value: ""
        },
        shelterType: {
            type: "select",
            name: "安置点类型",
            value: "",
            content: [
                {
                    value: "shelterType",
                    label: "村活动室"
                },
                {
                    value: "shelterType",
                    label: "学校"
                },
                {
                    value: "shelterType",
                    label: "卫生院"
                },
                {
                    value: "shelterType",
                    label: "企业厂房"
                },
                {
                    value: "shelterType",
                    label: "其他"
                }
            ]
        },
        functionArea: {
            type: "select",
            name: "功能区",
            value: "",
            content: [
                {
                    value: "functionArea",
                    label: "住宿区"
                },
                {
                    value: "functionArea",
                    label: "餐饮区"
                },
                {
                    value: "functionArea",
                    label: "清洗盥洗区"
                },
                {
                    value: "functionArea",
                    label: "物资储备室"
                },
                {
                    value: "functionArea",
                    label: "学习区"
                },
                {
                    value: "functionArea",
                    label: "母婴室"
                },
                {
                    value: "functionArea",
                    label: "文体活动区"
                },
                {
                    value: "functionArea",
                    label: "其他"
                }
            ]
        },
        basicFacilities: {
            type: "select",
            name: "基础保障",
            value: "",
            content: [
                {
                    value: "basicFacilities",
                    label: "通路"
                },
                {
                    value: "basicFacilities",
                    label: "通电"
                },
                {
                    value: "basicFacilities",
                    label: "通水"
                },
                {
                    value: "basicFacilities",
                    label: "通网"
                }
            ]
        },
        capacity: {
            type: "select",
            name: "容纳人数",
            value: "",
            content: [
                {
                    value: "capacity",
                    label: "50人以下"
                },
                {
                    value: "capacity",
                    label: "50-100人"
                },
                {
                    value: "capacity",
                    label: "100-200人"
                },
                {
                    value: "capacity",
                    label: "200人以上"
                }
            ]
        },
        managementUnit: {
            type: "text",
            name: "管护单位",
            value: ""
        },
        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        }
    },
    temporaryShelter: {
        name: "临时避险安置点",
        shelterName: {
            type: "text",
            name: "安置点名称",
            value: ""
        },
        shelterType: {
            type: "select",
            name: "安置点类型",
            value: "",
            content: [
                {
                    value: "shelterType",
                    label: "帐篷"
                },
                {
                    value: "shelterType",
                    label: "板房"
                },
                {
                    value: "shelterType",
                    label: "其他"
                }
            ]
        },
        basicFacilities: {
            type: "select",
            name: "基础保障",
            value: "",
            content: [
                {
                    value: "basicFacilities",
                    label: "通路"
                },
                {
                    value: "basicFacilities",
                    label: "通电"
                },
                {
                    value: "basicFacilities",
                    label: "通水"
                },
                {
                    value: "internet",
                    label: "通网"
                }
            ]
        },
        capacity: {
            type: "select",
            name: "容纳人数",
            value: "",
            content: [
                {
                    value: "capacity",
                    label: "20人以下"
                },
                {
                    value: "capacity",
                    label: "20-50人"
                },
                {
                    value: "capacity",
                    label: "50-100人"
                },
                {
                    value: "capacity",
                    label: "100人以上"
                }
            ]
        },
        managementUnit: {
            type: "text",
            name: "管理单位",
            value: ""
        },
        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        }
    },
    disasterReliefSuppliesWarehouse: {
        name: "救灾物资储备库",
        depotName: {
            type: "text",
            name: "储备库名称",
            value: ""
        },
        depotLocation: {
            type: "text",
            name: "储备库位置",
            value: ""
        },
        depotLevel: {
            type: "select",
            name: "储备库级别",
            value: "",
            content: [
                {
                    value: "depotLevel",
                    label: "中央级(区域性)"
                },
                {
                    value: "depotLevel",
                    label: "省级"
                },
                {
                    value: "depotLevel",
                    label: "市级"
                },
                {
                    value: "depotLevel",
                    label: "县级"
                },
                {
                    value: "depotLevel",
                    label: "乡级"
                }
            ]
        },
        materialType: {
            type: "select",
            name: "物资类型",
            value: "",
            content: [
                {
                    value: "materialType",
                    label: "抢险救援保障物资"
                },
                {
                    value: "materialType",
                    label: "应急救援力量保障物资"
                },
                {
                    value: "materialType",
                    label: "基本生活保障物资"
                }
            ]
        },
        managementUnit: {
            type: "text",
            name: "管护单位",
            value: ""
        },
        contactPerson: {
            type: "text",
            name: "联系人员",
            value: ""
        },
        contactPhone: {
            type: "text",
            name: "联系电话",
            value: ""
        }
    }
}
export {plotType}

