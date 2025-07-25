import * as Cesium from 'cesium'
import centerstar from "@/assets/icons/TimeLine/黄点点.png";
import lineData from "@/assets/西安断层数据.json";
let basicLayers={
    addCenterPoint(item) {
        // console.log(item,"addCenterPoint item")
        //点的属性 震中点统用一一个方法
        let img = centerstar
        let labeltext = item.disasterName
        let entity=null
        if (window.viewer && window.viewer.entities) {
            entity=window.viewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(
                    parseFloat(item.longitude),
                    parseFloat(item.latitude),
                    parseFloat( 0)
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
                plottype: item.trigger+"中心",
                name: item.trigger+"中心",
                properties: {...item}
            })
        }
        return entity;
    },
    addFaultZone(){
        let line_data = []
        lineData.features.forEach(line => {
            // console.log(line.geometry)
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
                name:"断裂带",
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
    removeFaultZone(){
        let toRemove = window.viewer.entities.values.filter(
            e => e.name === '断裂带'
        );
        if(toRemove){
            // 2. 逐个删除
            toRemove.forEach(entity => {
                window.viewer.entities.remove(entity);
            });
        }
    }

}
export default basicLayers;