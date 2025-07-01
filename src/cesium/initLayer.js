import * as Cesium from "cesium";
const CesiumIonDefaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI1ZDBjZjAxOS0wMDhhLTRmZjEtYjNmOC1iNmM2ZmY2ZmQ1N2IiLCJpZCI6MjAxMDI1LCJpYXQiOjE3MTAxNTgxNjJ9.mdbJYEzXQkBnHNqpozz7MvZjJ_X9a3JZRGPA-ytGhLI'
const tdtToken = "31f4628fd3dd7fa4d98dd14042665db1"

export function initCesium(container) {
    // 使用Cesium官方示例中的Token
    Cesium.Ion.defaultAccessToken = CesiumIonDefaultAccessToken || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2YmRiNjM4MC1kMDZkLTQ2NDQtYjQ3My0xZDI4MDU0MGJhZDciLCJpZCI6MzIxMzAsInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJpYXQiOjE1OTY1MjM4NzZ9.A3FBZ6HjKkTsOGnjwWWeO9L10HQ9c-wcF4c3dtTc4gQ'
    if (container === undefined) {
        container = 'cesiumContainer'
    }
    let viewer = new Cesium.Viewer(container, {
        shouldAnimate: true,
        animation: false, // 是否创建动画小器件，左下角仪表
        fullscreenButton: false, // 是否显示全屏按钮
        homeButton: false, // 是否显示Home按钮
        infoBox: false, // 是否显示信息框
        selectionIndicator: true, // 是否显示选取指示器组件
        timeline: false, // 是否显示时间轴
        navigationHelpButton: false, // 是否显示右上角的帮助按钮
        scene3DOnly: false, // 如果设置为true，则所有几何图形以3D模式绘制以节约GPU资源
        imageryProvider: false,
        sceneModePicker: false,
        geocoder: false,
        vrButton: false,
        baseLayerPicker: false,
        //截图和渲染相关的一些配置
        contextOptions: {
            webgl: {
                alpha: true,
                depth: false,
                stencil: true,
                antialias: true,
                premultipliedAlpha: true,
                //cesium状态下允许canvas转图片convertToImage
                preserveDrawingBuffer: true,
                failIfMajorPerformanceCaveat: true
            },
            allowTextureFilterAnisotropic: true
        }
    })
    viewer.scene.globe.enableLighting = false//全局光照
    viewer.shadows = false

    let providers = imageryProvider(0)
    providers.forEach(provider=>{
        viewer.imageryLayers.addImageryProvider(provider);
    })

    return viewer
}

function imageryProvider(type){
    const option = {
        tileMatrixSetID: "w",
        format: "tiles",
        style: "default",
        minimumLevel: 0,
        maximumLevel: 18,
        credit: "Tianditu",
        subdomains: ["t0", "t1", "t2", "t3", "t4", "t5", "t6", "t7"]
    };
    if (type === 0) {
        const imageryProvider = new Cesium.WebMapTileServiceImageryProvider({
            url: `https://{s}.tianditu.gov.cn/img_w/wmts?tk=${tdtToken}`,
            layer: "img",
            ...option
        });

        const annotationProvider = new Cesium.WebMapTileServiceImageryProvider({
            url: `https://{s}.tianditu.gov.cn/cia_w/wmts?tk=${tdtToken}`,
            layer: "cia",
            ...option
        });

        return [imageryProvider,annotationProvider]
    } else if(type === 1){
        const imageryProvider =  new Cesium.UrlTemplateImageryProvider({
            url: 'https://10.22.245.226:8889/kgis/rest/services/GETileMercatorNew/MapServer/tile/{z}/{y}/{x}',
            fileExtension: 'png',
        })
        return [imageryProvider]
    } else {
        const vectorProvider = new Cesium.WebMapTileServiceImageryProvider({
            url: `https://{s}.tianditu.gov.cn/vec_w/wmts?tk=cc`,
            layer: "vec",
            ...option
        });
        return [vectorProvider]
    }
}


