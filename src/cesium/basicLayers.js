import * as Cesium from 'cesium'
// 引入西安行政区划数据
import BaQiaoArea from '@/assets/static/area/BaQiao.json';
import BeiLin from '@/assets/static/area/BeiLin.json';
import ChangAn from '@/assets/static/area/ChangAn.json';
import GaoLing from '@/assets/static/area/GaoLing.json';
import HuYi from '@/assets/static/area/HuYi.json';
import LanTIan from '@/assets/static/area/LanTIan.json';
import LianHu from '@/assets/static/area/LianHu.json';
import LinTong from '@/assets/static/area/LinTong.json';
import WeiYang from '@/assets/static/area/WeiYang.json';
import XinCheng from '@/assets/static/area/XinCheng.json';
import YanLiang from '@/assets/static/area/YanLiang.json';
import YanTa from '@/assets/static/area/YanTa.json';
import ZhouZhi from '@/assets/static/area/ZhouZhi.json';

import centerstar from "@/assets/icons/TimeLine/黄点点.png";
import lineData from "@/assets/西安断层数据（新）.json";

import landslideIcon from "@/assets/images/landslide.png";
import riskArea from "@/assets/images/riskArea.png";
import debrisFlowIcon from "@/assets/images/DebrisFlow.png";
import flashIcon from "@/assets/images/flashflood.png"
import waterIcon from "@/assets/images/water.png"
import dangerSourceIcon from "@/assets/images/gasstation.png"
import hospitalIcon from "@/assets/images/hospital.png"
import fireFighterIcon from "@/assets/images/firefighter.png"
import storePointsIcon from "@/assets/images/storePoints.jpg"
import shelterIcon from "@/assets/images/emergencyShelter.png"
import schoolIcon from "@/assets/images/school.png"
import eqMark from "@/assets/images/eqMark.png"
import bridgeIcon from "@/assets/images/bridge.png"
import reservoirIcon from "@/assets/images/reservoir.png"
import subwayIcon from "@/assets/images/subway.png"

//新的行政区划数据
import XIANXZQH from "@/assets/static/area/xian_xzjx.json"

import {dataOnHiddenDangerPointsOfDebrisFlow, landslideHazardPointData, riskVillageData,} from "@/api/earthquake/datas";
import {
    getDangerous,
    getFire,
    getHospital,
    getShelter,
    getStore,
    getSchool,
    getWater, //内涝
    getFlashFlood, //山洪
    getFlow, //泥石流
    getSlide, //滑坡
    getRisk,
    getFlood,
    getWaterDetail, getBridge, getReservoir, getSubway
} from "@/api/system/aroundanalysis.js";
import {useSimulationPointStore} from "@/store/earthquake/simulation_points.js";
import {getAllEarthquakeList} from "@/api/system/disasterEvents.js";

let basicLayers = {
    // 修改geoUrl以正确配合代理配置
    // 原配置: geoUrl: '/geoserver/xian/wms'
    geoUrl: '/geo', // 代理会处理路径重写，只需保留基础路径
    peopleLayerName: 'xian:xian_people', // 格式：工作空间名:图层名
    cropsLayerName: 'xian:xian_crops',
    waterPipeLayerName: 'xian:xian_water_pipe',
    roadLayerName: 'xian:xian_road',
    bridgeLayerName: 'xian:xian_bridge_points',
    highwayLayerName: 'xian:xian_highway',
    nationalRoadLayerName: 'xian:xian_national_road',
    reservoirLayerName: 'xian:xian_reservoir_list',
    subwayLayerName: 'xian:xian_subway',
    disasterEntities: [],//灾害点实体
    hospitalEntities: [],//医院实体
    dangerEntities: [],//危险源
    storePointsEntities: [],//储备点
    fireFighterEntities: [],//消防站
    schoolEntities: [],
    shelterEntities: [],//避难所
    landslidePoints: [],//滑坡点
    nishiliuPoints: [],//泥石流点
    dangerPoints: [],//危险区点
    subwayEntities: [],
    reservoirEntities: [],
    bridgeEntities: [],
    flashFloodPoints: [],//山洪点
    waterPoints: [],
    hospitalPoints: [],//医院点
    fireFighterPoints: [],//消防站点
    shelterPoints: [],//避难所点
    storePoints: [],//储备站点
    dangerSourcePoints: [],//危险源点
    schoolPoints: [],
    bridgePoints: [],
    subwayPoints: [],
    reservoirPoints: [],
    landSlideData: null, //滑坡数据
    debrisFlowData: null, //泥石流数据
    waterData: null, //内涝数据
    floodData: null, //山洪数据
    hospitalData: null,
    shelterData: null,
    storeData: null,
    fireFighterData: null,
    dangerSourceData: null,
    schoolData: null,
    bridgeData: null,
    subwayData: null,
    reservoirData: null,
    historicalEarthquakeData: null,//历史数据
    peopleLayer: null, //人口网格
    cropsLayer: null,   //农田网格
    waterPipeLayer: null,//管网
    roadLayer: null,//公路
    highwayLayer: null,//高速
    nationalRoadLayer: null,//国道
    addCenterPoint(item) {
        // console.log(item,"addCenterPoint item")
        //点的属性 震中点统用一一个方法
        let img = centerstar
        let labeltext = item.disasterName
        let entity = null
        if (window.viewer && window.viewer.entities) {
            entity = window.viewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(
                    parseFloat(item.longitude),
                    parseFloat(item.latitude),
                    parseFloat(0)
                ),
                billboard: {
                    image: img,
                    width: 40,
                    height: 40,
                    eyeOffset: new Cesium.Cartesian3(0, 0, 0),
                    scale: 0.8,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                    depthTest: false,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                    color: Cesium.Color.WHITE.withAlpha(1),//颜色
                    clampToGround: true,
                },
                label: {
                    text: labeltext,
                    show: true,
                    font: '14px sans-serif',
                    fillColor: Cesium.Color.RED,        //字体颜色
                    backgroundColor: Cesium.Color.WHITE.withAlpha(0.7),
                    showBackground: true,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    outlineWidth: 2,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    pixelOffset: new Cesium.Cartesian2(0, -16),
                },
                id: item.id,
                plottype: item.trigger + "中心",
                name: item.trigger + "中心",
                properties: {...item}
            })
        }
        return entity;
    },
    removeCenterPoint(id) {
        const entity = window.viewer.entities.getById(id);
        if (entity) {
            window.viewer.entities.remove(entity)
        }
    },
    addFaultZone() {
        let line_data = []
        lineData.features.forEach(line => {

            line_data.push(line.geometry)
        })

        line_data.forEach(Lon_Lat => {
            let FaultZone = []
            Lon_Lat.coordinates.forEach(LonLat => {
                LonLat.forEach(point => {
                    FaultZone.push(Number(point))
                })
            })
            window.viewer.entities.add({
                name: "断裂带",
                polyline: {
                    positions: Cesium.Cartesian3.fromDegreesArray(FaultZone),
                    // 宽度
                    width: 2,
                    // 线的颜色
                    material: Cesium.Color.RED,
                    // 线的顺序,仅当`clampToGround`为true并且支持地形上的折线时才有效。
                    zIndex: 10,
                    // 显示在距相机的距离处的属性，多少区间内是可以显示的
                    distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0),
                    // 是否显示
                    show: true,
                },
                // label
            });
        })
    },
    removeFaultZone() {
        let toRemove = window.viewer.entities.values.filter(
            e => e.name === '断裂带'
        );
        if (toRemove) {
            // 2. 逐个删除
            toRemove.forEach(entity => {
                window.viewer.entities.remove(entity);
            });
        }
    },

    loadAdminData() {
        let administrationData = [BaQiaoArea, BeiLin, ChangAn, GaoLing, HuYi, LanTIan, LianHu, LinTong, WeiYang, XinCheng, YanLiang, YanTa, ZhouZhi]

        const colors = [
            new Cesium.Color(255 / 255, 153 / 255, 0 / 255, 0.3),
            new Cesium.Color(255 / 255, 51 / 255, 102 / 255, 0.3),
            new Cesium.Color(0 / 255, 178 / 255, 255 / 255, 0.3),
            new Cesium.Color(102 / 255, 255 / 255, 102 / 255, 0.3),
            new Cesium.Color(204 / 255, 102 / 255, 255 / 255, 0.3),
            new Cesium.Color(255 / 255, 204 / 255, 0 / 255, 0.3),
            new Cesium.Color(0 / 255, 204 / 255, 153 / 255, 0.3),
            new Cesium.Color(255 / 255, 102 / 255, 102 / 255, 0.3),
            new Cesium.Color(102 / 255, 153 / 255, 255 / 255, 0.3),
            new Cesium.Color(255 / 255, 178 / 255, 102 / 255, 0.3),
            new Cesium.Color(153 / 255, 255 / 255, 204 / 255, 0.3),
            new Cesium.Color(255 / 255, 153 / 255, 204 / 255, 0.3),
            new Cesium.Color(190 / 255, 255 / 255, 232 / 255, 0.3)
        ]
        const pickColor = i => colors[i % colors.length]

        /** 2. 为单个 DataSource 设置样式（自动兼容 MultiPolygon -> Polygon） */
            //多个面只在最大的一个面上加标签
            // 放在 loadAdminData 外层，或者 configureAdminStyles 外层
        const labelPrinted = new Map();   // 记录已打印过标签的区县

        function configureAdminStyles(dataSource, color) {
            if (!dataSource) return;
            dataSource.entities.values.forEach(entity => {
                // entity.allowPicking = false;   // Cesium ≥ 1.97 有效
                if (!entity.polygon) return;
                const name = entity.properties.name._value || dataSource.name;
                entity.polygon = {
                    hierarchy: entity.polygon.hierarchy,
                    material: color,
                    outline: true,
                    outlineColor: Cesium.Color.BLUE,
                    outlineWidth: 1,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                    show: true, // 使用统一的显示控制
                    fill: true,
                    shadow: true,
                    depthFailMaterial: color.withAlpha(0.2)
                };


                // 只在第一次出现的 name 上加 label
                if (!labelPrinted.has(name)) {
                    labelPrinted.set(name, true);

                    if (name !== "新城区") {
                        // 计算多边形的中心点作为标签的位置
                        const positions = entity.polygon.hierarchy.getValue(Cesium.JulianDate.now()).positions; // 输入一组坐标
                        const boundingSphere = Cesium.BoundingSphere.fromPoints(positions); // 自动计算中心位置和半径
                        entity.position = boundingSphere.center;
                        // console.log(boundingSphere.center,name)
                    } else {
                        let point1 = entity.polygon.hierarchy.getValue(Cesium.JulianDate.now()).positions[0];
                        let point2 = entity.polygon.hierarchy.getValue(Cesium.JulianDate.now()).positions[parseInt(entity.polygon.hierarchy.getValue(Cesium.JulianDate.now()).positions.length / 6)];
                        let point3 = entity.polygon.hierarchy.getValue(Cesium.JulianDate.now()).positions[parseInt(entity.polygon.hierarchy.getValue(Cesium.JulianDate.now()).positions.length / 3)];
                        entity.position = Cesium.BoundingSphere.fromPoints([point1, point2, point3]).center;
                    }
                    entity.label = {
                        text: name,
                        font: '40px',
                        fillColor: Cesium.Color.BLACK,
                        backgroundColor: color.withAlpha(0.7),
                        padding: new Cesium.Cartesian2(5, 5),
                        showBackground: true,
                        verticalOrigin: Cesium.VerticalOrigin.CENTER, // 将垂直原点设置为中心
                        pixelOffset: new Cesium.Cartesian2(0, 0), // 像素偏移量设置为0
                        // heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 移除此行，因为position已经确定了高度
                        show: true // 使用统一的显示控制
                    };
                }
            });
        }

        // 3. 统一异步加载
        const tasks = administrationData.map((geojson, idx) =>
            Cesium.GeoJsonDataSource.load(geojson, {
                enableFeatureStyles: false,
                clampToGround: true,
                suppresuppressPointLabels: true
            }).then(ds => {
                ds.name = `区县-${geojson.features?.[0]?.properties?.name || idx}`
                const color = pickColor(idx)
                configureAdminStyles(ds, color)
                window.viewer.dataSources.add(ds)
                return ds
            }).catch(err =>
                console.error(`加载 ${geojson.features?.[0]?.properties?.name || idx} 失败:`, err)
            )
        )
        // Promise.all(tasks).then(() => {
        //     // 0 层：区县面
        //     viewer.dataSources.lowerToBottom(viewer.dataSources.getByName('区县-*')[0]);
        //     console.log('所有区县加载完成')
        //     // 1 层：其他业务图层（默认 zIndex=1）
        // });
        Promise.all(tasks).then(() => console.log('所有区县加载完成'))
    },

    // 加载新的行政区划
    loadNewAdminData(administrationData) {

    },

    removeAdminData() {
        // 遍历当前所有数据源
        const toRemove = window.viewer.dataSources._dataSources.filter(
            ds => ds.name && ds.name.startsWith('区县-')
        )
        toRemove.forEach(ds => window.viewer.dataSources.remove(ds, true))
    },
    hideAdminData() {
        // 遍历当前所有数据源
        const toHide = window.viewer.dataSources._dataSources.filter(
            ds => ds.name && ds.name.startsWith('区县-')
        );
        toHide.forEach(ds => {
            ds.show = false; // 隐藏数据源
        });
    },
    showAdminData() {
        // 遍历当前所有数据源
        const toShow = window.viewer.dataSources._dataSources.filter(
            ds => ds.name && ds.name.startsWith('区县-')
        );
        toShow.forEach(ds => {
            ds.show = true; // 显示数据源
        });
    },

    async Addmudslide(){
        dataOnHiddenDangerPointsOfDebrisFlow().then((res) => {
            this.nishiliuPoints = this.addHiddenDangerPoints('泥石流隐患点', res.data, debrisFlowIcon);
        });
    },
    async loadLandSlide(){
        landslideHazardPointData().then((res) => {
            this.landslidePoints = this.addHiddenDangerPoints("滑坡隐患点", res.data, landslideIcon);
        });
    },
    async AddDangerAreaDataSource(){
        riskVillageData().then((res) => {
            // 修改数据结构，待后续接口同意后更改
            const datas = [];

            res.data.features.forEach((item) => {
                datas.push({
                    factorVoList: null,
                    geologicalDisasterHideDTO: item.properties,
                });
            });
            this.dangerPoints = this.addHiddenDangerPoints("风险区域",datas, riskArea);
        });
    },
    async loadFlashFlood(){
        getFlashFlood().then((res) => {
            this.flashFloodPoints = this.addHiddenDangerPoints('山洪隐患点' ,res.data, flashIcon);
        })
    },
    async loadWater(){
        getWater().then((res) => {
            this.waterPoints = this.addHiddenDangerPoints('内涝隐患点', res.data, waterIcon);
        })
    },
    async loadHospital(){
        getHospital().then((res) => {
            this.hospitalData = res.data;
            this.hospitalPoints = this.loadEntities('医院', res.data, hospitalIcon);
        })
    },
    async loadEmergencyShelter(){
        getShelter().then((res) => {
            this.shelterData = res.data;
            this.shelterPoints = this.loadEntities('避难所', res.data, shelterIcon);
        })
    },
    async loadFireFighter(){
        getFire().then((res) => {
            this.fireFighterData = res.data;
            this.fireFighterPoints = this.loadEntities('消防站', res.data, fireFighterIcon);
        })
    },
    async loadStorePoint(){
        getStore().then((res) => {
            this.storeData = res.data;
            this.storePoints = this.loadEntities('储备点', res.data, storePointsIcon);
        })
    },
    async loadDangerSource(){
        getDangerous().then((res) => {
            this.dangerSourceData = res.data;
            this.dangerSourcePoints = this.loadEntities('风险源', res.data, dangerSourceIcon);
        })
    },
    async loadLand(){
        getSlide().then((res) => {
            this.landSlideData = res.data;
            this.landslidePoints = this.loadEntities('滑坡', res.data, landslideIcon);
        })
    },
    async loadFlow(){
        getFlow().then((res) => {
            this.debrisFlowData = res.data;
            this.nishiliuPoints = this.loadEntities('泥石流', res.data, debrisFlowIcon);
        })
    },
    async loadWater1(){
        getWaterDetail().then((res) => {
            this.waterData = res.data;
            this.waterPoints = this.loadEntities('内涝', res.data, waterIcon);
        })
    },
    async loadFlood(){
        getFlood().then((res) => {
            this.floodData = res.data;
            this.flashFloodPoints = this.loadEntities('山洪', res.data, flashIcon);
        })
    },
    async loadRisk(){
        getRisk().then((res) => {
            this.loadEntities('风险区', res.data, riskArea);
        })
    },
    async loadHistoricalEarthquake(){
        getAllEarthquakeList().then((res) => {
            this.historicalEarthquakeData = res.data;
            this.historicalEarthquakeData.forEach((item) => {
                if (item.eqType === 'Z'){
                    const longitude = item.longitude;
                    const latitude = item.latitude;
                    const entity = window.viewer.entities.add({
                        position: Cesium.Cartesian3.fromDegrees(longitude, latitude, 5),
                        // 点
                        billboard: {
                            // 图像地址，URI或Canvas的属性   @/assets/images/landslide.png
                            image: eqMark,
                            width: 40, // 图片宽度,单位px
                            height: 40, // 图片高度，单位px
                            eyeOffset: new Cesium.Cartesian3(0, 0, 0), // 与坐标位置的偏移距离
                            color: Cesium.Color.WHITE.withAlpha(1), // 固定颜色
                            scale: 0.8, // 缩放比例
                            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 绑定到地形高度
                            scaleByDistance: new Cesium.NearFarScalar(500, 1, 5e5, 0.1),
                            depthTest: false, // 禁止深度测试
                            disableDepthTestDistance: Number.POSITIVE_INFINITY, // 不进行深度测试
                            show: true
                        },
                        // originalColor: Cesium.Color.RED,
                        // originalPixelSize: 15,
                        name:"历史地震灾害",
                        // 标记灾害类型
                        disasterType: 'historicalEathquake',
                        disasterData: item
                    });
                }
            })
            console.log("historicalEarthquakeData",this.historicalEarthquakeData)
        })
    },
    async loadSchool(){
        getSchool().then((res) => {
            this.schoolData = res.data;
            this.schoolPoints = this.loadEntities('学校', res.data, schoolIcon);
        })
    },
    async loadBridge(){
        getBridge().then((res) => {
            console.log(113, res.data);
            this.bridgeData = res.data;
            this.bridgePoints = this.loadEntities('桥梁', res.data, bridgeIcon);
        })
    },
    async loadReservoir(){
        getReservoir().then((res) => {
            console.log(113, res.data);
            this.reservoirData = res.data;
            this.reservoirPoints = this.loadEntities('水库', res.data, reservoirIcon);
        })
    },
    async loadSubway(){
        getSubway().then((res) => {
            console.log(113, res.data);
            this.subwayData = res.data;
            this.subwayPoints = this.loadEntities('地铁站', res.data, subwayIcon);
        })
    },
    async addHiddenDangerPoints(type, hiddenDangerPoints, imageEntity) {
        let disasterPoints = [];
        hiddenDangerPoints.forEach((hiddenDangerPoint) => {
            let lon = hiddenDangerPoint.geologicalDisasterHideDTO.lon;
            let lat = hiddenDangerPoint.geologicalDisasterHideDTO.lat;
            disasterPoints.push([lon, lat]);
            let entityId = '';
            if (type == "风险区域") {
                entityId = type + hiddenDangerPoint.geologicalDisasterHideDTO.unitCode
            } else {
                entityId = type + hiddenDangerPoint.geologicalDisasterHideDTO.id
            }
            const entity = window.viewer.entities.add({
                name: type,
                id: entityId,
                position: Cesium.Cartesian3.fromDegrees(lon, lat),
                billboard: {
                    // 图像地址，URI或Canvas的属性   @/assets/images/landslide.png
                    image: imageEntity,
                    width: 40, // 图片宽度,单位px
                    height: 40, // 图片高度，单位px
                    eyeOffset: new Cesium.Cartesian3(0, 0, 0), // 与坐标位置的偏移距离
                    color: Cesium.Color.WHITE.withAlpha(1), // 固定颜色
                    scale: 0.8, // 缩放比例
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 绑定到地形高度
                    scaleByDistance: new Cesium.NearFarScalar(500, 1, 5e5, 0.1),
                    depthTest: false, // 禁止深度测试
                    disableDepthTestDistance: Number.POSITIVE_INFINITY, // 不进行深度测试
                    show: true,
                },
                disasterData: hiddenDangerPoint,
                properties: {
                    data: hiddenDangerPoint,
                    longitude: lon,
                    latitude: lat,
                },
                geometry: {
                    lon: lon,
                    lat: lat,
                },
            });
            this.disasterEntities.push(entity);
            useSimulationPointStore().simulationPoints.push(hiddenDangerPoint);
        });
        return disasterPoints;
    },
    //加载点
    loadEntities(type, data, icon){
        let points = [];
        try{
            //添加储备站点
            data.features.forEach(point => {
                const longitude = point.geometry.coordinates[0];
                const latitude = point.geometry.coordinates[1];
                points.push([longitude, latitude]);
                // 创建实体
                const entity = window.viewer.entities.add({
                    position: Cesium.Cartesian3.fromDegrees(longitude, latitude, 5),
                    id: point.properties.id,
                    // 点
                    billboard: {
                        // 图像地址，URI或Canvas的属性   @/assets/images/landslide.png
                        image: icon,
                        width: 40, // 图片宽度,单位px
                        height: 40, // 图片高度，单位px
                        eyeOffset: new Cesium.Cartesian3(0, 0, 0), // 与坐标位置的偏移距离
                        color: Cesium.Color.WHITE.withAlpha(1), // 固定颜色
                        scale: 0.8, // 缩放比例
                        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 绑定到地形高度
                        scaleByDistance: new Cesium.NearFarScalar(500, 1, 5e5, 0.1),
                        depthTest: false, // 禁止深度测试
                        disableDepthTestDistance: Number.POSITIVE_INFINITY, // 不进行深度测试
                        show: true
                    },
                    originalColor: Cesium.Color.RED,
                    originalPixelSize: 15,
                    name:type,
                    // 标记灾害类型
                    disasterData: point
                });
                if(type == '医院'){
                    this.hospitalEntities.push(entity);
                }
                else if(type == '消防站'){
                    this.fireFighterEntities.push(entity);
                }
                else if(type == '避难所'){
                    this.shelterEntities.push(entity);
                }
                else if(type == '储备点'){
                    this.storePointsEntities.push(entity);
                }
                else if(type == '风险源'){
                    this.dangerEntities.push(entity);
                }
                else if(type == '学校'){
                    this.schoolEntities.push(entity);
                }
                else if(type == '风险区'){
                }
                else if(type == '桥梁'){
                    this.bridgeEntities.push(entity);
                }
                else if(type == '水库'){
                    this.reservoirEntities.push(entity);
                }
                else if(type == '地铁站'){
                    this.subwayEntities.push(entity);
                }
                else{
                    this.disasterEntities.push(entity);
                }
            })
            return points;
        }catch(error){
            console.error("处理点数据失败.", error);
        }
    },

    //加载单独点
    loadPoint(type, data, icon){
        const entity = window.viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(data.geometry.coordinates[0], data.geometry.coordinates[1]),
            // 点
            billboard: {
                // 图像地址，URI或Canvas的属性   @/assets/images/landslide.png
                image: icon,
                width: 40, // 图片宽度,单位px
                height: 40, // 图片高度，单位px
                eyeOffset: new Cesium.Cartesian3(0, 0, 0), // 与坐标位置的偏移距离
                color: Cesium.Color.WHITE.withAlpha(1), // 固定颜色
                scale: 0.8, // 缩放比例
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 绑定到地形高度
                scaleByDistance: new Cesium.NearFarScalar(500, 1, 5e5, 0.1),
                depthTest: false, // 禁止深度测试
                disableDepthTestDistance: Number.POSITIVE_INFINITY, // 不进行深度测试
                show: true,
                zIndex: 10
            },
            originalColor: Cesium.Color.RED,
            originalPixelSize: 15,
            name:type,
            // 标记灾害类型
            disasterData: data
        });
    },
    //绘制图片的公共方法
    DrawIcon(type, item ,Icon){
         window.viewer.entities.add({
            name: type,
            position: Cesium.Cartesian3.fromDegrees(item.lon, item.lat),
            billboard: {
                // 图像地址，URI或Canvas的属性   @/assets/images/landslide.png
                image: Icon,
                width: 60, // 图片宽度,单位px
                height: 60, // 图片高度，单位px
                eyeOffset: new Cesium.Cartesian3(0, 0, 0), // 与坐标位置的偏移距离
                color: Cesium.Color.WHITE.withAlpha(1), // 固定颜色
                scale: 0.8, // 缩放比例
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 绑定到地形高度
                scaleByDistance: new Cesium.NearFarScalar(500, 1, 5e5, 0.1),
                depthTest: false, // 禁止深度测试
                disableDepthTestDistance: Number.POSITIVE_INFINITY, // 不进行深度测试
                show: true,
            },
            disasterData: item,
            properties: {
                data: item,
                longitude: item.lon,
                latitude: item.lat,
            },
            geometry: {
                lon: item.lon,
                lat: item.lat,
            },
        });
    },
    addPeopleLayer(){
        // TODO 过滤掉人口为 0 的数据，做按人口分类显示（5档）
        console.log("人口数据：" + this.peopleLayerName)
        this.peopleLayer = this.addLayers(this.peopleLayerName);
    },
    addCropsLayer(){
        this.cropsLayer = this.addLayers(this.cropsLayerName);
    },
    addWaterPipeLayer(){
        this.waterPipeLayer = this.addLayers(this.waterPipeLayerName);
    },
    addRoadLayer(){
        this.roadLayer = this.addLayers(this.roadLayerName);
    },
    addHighwayLayer(){
        this.highwayLayer = this.addLayers(this.highwayLayerName);
    },
    addNationalRoad(){
        this.nationalRoadLayer = this.addLayers(this.nationalRoadLayerName);
    },
    //添加图层
    addLayers(name) {
        // 根据用户提供的有效GeoServer WMS服务URL配置
        return window.viewer.imageryLayers.addImageryProvider(
            new Cesium.WebMapServiceImageryProvider({
                url: `${this.geoUrl}/geoserver/xian/wms`,
                layers: name,
                parameters: {
                    tiled: true,
                    transparent: true,
                    format: 'image/png',
                    srs: 'EPSG:4490',
                    version: '1.1.0', // 与用户提供的有效URL版本一致
                },
                flyTo: true,
                show: true,
            })
        );
    },
    showHiddenEntity(type) {
        let toRemove = window.viewer.entities.values.filter(
            e => e.name === type
        );
        if (toRemove) {
            // 2. 逐个删除
            toRemove.forEach(entity => {
                entity.show = true
            });
        }
    },
    hideHiddenEntity(type) {
        let toRemove = window.viewer.entities.values.filter(
            e => e.name === type
        );
        // console.log(toRemove,type,"hideHiddenEntity")
        if (toRemove) {
            // 2. 逐个删除
            toRemove.forEach(entity => {
                entity.show = false
            });
        }
    },
    removeHiddenEntity() {
        window.viewer.entities.removeAll();
    },

}
export default basicLayers;
