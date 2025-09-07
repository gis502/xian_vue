import * as Cesium from 'cesium'
// import cesiumPlot from "@/cesium/plot/cesiumPlot.js";
import plotCompute from "@/cesium/plotCompute.js";
import {xp} from "@/cesium/ArrowalGorithm.js";
import {getPlotInfos} from "@/api/system/plot.js";
import img from "@/assets/icons/TimeLine/黄点点.png";
import {geomToCoordinates} from "./geomTransfer.js";

let timeLine = {
    //
    // addCenterPoint(item) {
    //     // console.log(item,"addCenterPoint item")
    //     //点的属性 震中点统用一一个方法
    //     let img = centerstar
    //     let labeltext = item.disasterName
    //     let entity=null
    //     if (window.viewer && window.viewer.entities) {
    //         entity=window.viewer.entities.add({
    //             position: Cesium.Cartesian3.fromDegrees(
    //                 parseFloat(item.longitude),
    //                 parseFloat(item.latitude),
    //                 parseFloat( 0)
    //             ),
    //             billboard: {
    //                 image: img,
    //                 width: 40,
    //                 height: 40,
    //                 eyeOffset: new Cesium.Cartesian3(0, 0, 0),
    //                 scale: 0.8,
    //                 heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
    //                 depthTest: false,
    //                 disableDepthTestDistance: Number.POSITIVE_INFINITY,
    //                 color: Cesium.Color.WHITE.withAlpha(1),//颜色
    //                 clampToGround: true,
    //             },
    //             // label: {
    //             //     text: labeltext,
    //             //     show: true,
    //             //     font: '14px sans-serif',
    //             //     fillColor: Cesium.Color.RED,        //字体颜色
    //             //     style: Cesium.LabelStyle.FILL_AND_OUTLINE,
    //             //     outlineWidth: 2,
    //             //     heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
    //             //     disableDepthTestDistance: Number.POSITIVE_INFINITY,
    //             //     verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
    //             //     pixelOffset: new Cesium.Cartesian2(0, -16),
    //             // },
    //             id: item.id,
    //             plottype: item.trigger+"中心",
    //             name: item.trigger+"中心",
    //             properties: {...item}
    //         })
    //     }
    //     return entity;
    // },


    addDataSourceLayer(datasourcename) {
        if (datasourcename === "pointData") {
            let pointDataSource = null
            if (window.pointDataSource) {
                return window.pointDataSource;
            } else {
                if (window.viewer && window.viewer.dataSources) {
                    pointDataSource = new Cesium.CustomDataSource("pointData");
                    let dataSourcePromise = window.viewer.dataSources.add(pointDataSource)
                    dataSourcePromise.then(function (pointDataSource) {
                        let pixelRange = 10;
                        let minimumClusterSize = 5;
                        let enabled = true;
                        pointDataSource.clustering.enabled = enabled; //是否聚合
                        pointDataSource.clustering.pixelRange = pixelRange;
                        pointDataSource.clustering.minimumClusterSize = minimumClusterSize;
                        let pinBuilder = new Cesium.PinBuilder();
                        let pin1000 = pinBuilder
                            .fromText("1000+", Cesium.Color.RED, 48)
                            .toDataURL();
                        let pin500 = pinBuilder
                            .fromText("100+", Cesium.Color.RED, 48)
                            .toDataURL();
                        let pin100 = pinBuilder
                            .fromText("100+", Cesium.Color.RED, 48)
                            .toDataURL();
                        let pin50 = pinBuilder
                            .fromText("50+", Cesium.Color.RED, 48)
                            .toDataURL();
                        let pin40 = pinBuilder
                            .fromText("40+", Cesium.Color.ORANGE, 48)
                            .toDataURL();
                        let pin30 = pinBuilder
                            .fromText("30+", Cesium.Color.YELLOW, 48)
                            .toDataURL();
                        let pin20 = pinBuilder
                            .fromText("20+", Cesium.Color.GREEN, 48)
                            .toDataURL();
                        let pin10 = pinBuilder
                            .fromText("10+", Cesium.Color.BLUE, 48)
                            .toDataURL();
                        // let singleDigitPins = new Array(8);
                        let singleDigitPins = new Array(20);
                        for (let i = 0; i < singleDigitPins.length; ++i) {
                            singleDigitPins[i] = pinBuilder
                                .fromText(`${Math.floor(i)}`, Cesium.Color.VIOLET, 48)
                                .toDataURL();
                        }
                        let removeListener

                        function customStyle() {
                            if (Cesium.defined(removeListener)) {
                                removeListener && removeListener();
                                removeListener = undefined;
                            } else {
                                removeListener = pointDataSource.clustering.clusterEvent.addEventListener(
                                    function (clusteredEntities, cluster) {

                                        cluster.label.show = false;
                                        cluster.billboard.show = true;
                                        cluster.billboard.id = cluster.label.id;
                                        cluster.billboard.verticalOrigin =
                                            Cesium.VerticalOrigin.BOTTOM;

                                        // 设置 Billboard 高度引用地形
                                        cluster.billboard.heightReference = Cesium.HeightReference.CLAMP_TO_GROUND;

                                        // 禁用深度测试，使 Billboard 不会被地形遮挡
                                        cluster.billboard.disableDepthTestDistance = Number.POSITIVE_INFINITY;

                                        if (clusteredEntities.length >= 2000) {
                                            cluster.billboard.image = pin1000;
                                        } else if (clusteredEntities.length >= 1000) {
                                            cluster.billboard.image = pin500;
                                        } else if (clusteredEntities.length >= 200) {
                                            cluster.billboard.image = pin100;
                                        } else if (clusteredEntities.length >= 100) {
                                            cluster.billboard.image = pin50;
                                        } else if (clusteredEntities.length >= 80) {
                                            cluster.billboard.image = pin40;
                                        } else if (clusteredEntities.length >= 60) {
                                            cluster.billboard.image = pin30;
                                        } else if (clusteredEntities.length >= 40) {
                                            cluster.billboard.image = pin20;
                                        } else if (clusteredEntities.length >= 20) {
                                            cluster.billboard.image = pin10;
                                        } else {
                                            cluster.billboard.image =
                                                singleDigitPins[clusteredEntities.length];
                                        }
                                    }
                                    // }
                                );
                            }

                            let pixelRange = pointDataSource.clustering.pixelRange;
                            pointDataSource.clustering.pixelRange = 0;
                            pointDataSource.clustering.pixelRange = pixelRange;
                        }

                        customStyle();
                    })
                    window.pointDataSource = pointDataSource;
                }
            }
            return pointDataSource
        } else if (datasourcename === "label") {
            let labeldataSource = null
            if (window.labeldataSource) {
                return window.labeldataSource;
            } else {
                if (window.viewer && window.viewer.dataSources) {
                    labeldataSource = new Cesium.CustomDataSource("label");
                    let dataSourcePromise = window.viewer.dataSources.add(labeldataSource)
                    dataSourcePromise.then(function (labeldataSource) {
                        labeldataSource.clustering.enabled = true; // 开启聚合
                        labeldataSource.clustering.pixelRange = 100; // 聚合像素范围
                        labeldataSource.clustering.minimumClusterSize = 1; // 最小聚合大小


                        let removeListener

                        function customStyle() {
                            if (Cesium.defined(removeListener)) {
                                removeListener && removeListener();
                                let removeListener = undefined;
                            } else {
                                let removeListener = labeldataSource.clustering.clusterEvent.addEventListener(
                                    function (clusteredEntities, cluster) {
                                        cluster.label.show = false;
                                        // 创建 Canvas 标签
                                        const canvas = document.createElement('canvas');
                                        const context = canvas.getContext('2d');

                                        // 设置字体和布局
                                        const titleFontSize = 19; // 标题字体大小
                                        const contentFontSize = 19; // 内容字体大小
                                        const rowHeight = 30; // 每行高度调整为 30
                                        const padding = 40; // 内边距
                                        const margin = 10; // 外边距
                                        const headerHeight = 50; // 表格标题高度调整为 50
                                        const extraHeight = 50; // 额外增加的背景高度

                                        // 动态计算标题宽度（确保标题适配背景）
                                        const title = '出队情况，伤亡人员统计（标绘）';
                                        context.font = `bold ${titleFontSize}px Arial`;
                                        const titleWidth = context.measureText(title).width + 2 * padding; // 标题宽度

                                        // 红色标绘的文字和操场椭圆
                                        const markText = '应急';
                                        const markFontSize = 22; // 红色文字字体大小
                                        context.font = `bold ${markFontSize}px Arial`;
                                        const markTextWidth = context.measureText(markText).width; // 标绘文字宽度
                                        const markPadding = 10; // 跑道椭圆文字左右的间距
                                        const trackHeight = markFontSize + 14; // 跑道椭圆高度
                                        const trackWidth = markTextWidth + markPadding * 2.5; // 跑道椭圆宽度

                                        // 动态计算 Canvas 的宽度和高度
                                        const canvasWidth = Math.max(titleWidth + 130, 460); // 保证最小宽度为 400
                                        const canvasHeight =
                                            headerHeight + rowHeight * clusteredEntities.length + padding * 2 + extraHeight; // 计算总高度

                                        canvas.width = canvasWidth; // 设置 Canvas 宽度
                                        canvas.height = canvasHeight; // 设置 Canvas 高度

                                        // 加载背景图片
                                        const backgroundImage = new Image();
                                        backgroundImage.src = '/images/背景边框.png'; // 确保路径正确
                                        backgroundImage.onload = function () {
                                            // 背景图片放大比例（例如 1.2 表示放大 20%）
                                            const scaleFactor = 1.6;

                                            // 计算背景图片缩放比例
                                            const imageAspectRatio = backgroundImage.width / backgroundImage.height;
                                            const canvasAspectRatio = canvasWidth / canvasHeight;
                                            let drawWidth, drawHeight, offsetX, offsetY;

                                            if (imageAspectRatio < canvasAspectRatio) {
                                                // 图片更高，以 Canvas 高度为准缩放，并放大
                                                drawHeight = canvasHeight * scaleFactor;
                                                drawWidth = drawHeight * imageAspectRatio;
                                                offsetX = (canvasWidth - drawWidth) / 2; // 水平居中
                                                offsetY = (canvasHeight - drawHeight) / 2; // 垂直居中
                                            } else {
                                                // 图片更宽，以 Canvas 宽度为准缩放，并放大
                                                drawWidth = canvasWidth * scaleFactor;
                                                drawHeight = drawWidth / imageAspectRatio;
                                                offsetX = (canvasWidth - drawWidth) / 2; // 水平居中
                                                offsetY = (canvasHeight - drawHeight) / 2; // 垂直居中
                                            }

                                            // 绘制背景图片（完全显示并放大）
                                            context.drawImage(backgroundImage, offsetX, offsetY, drawWidth, drawHeight);

                                            // 绘制操场跑道样式的红色椭圆
                                            const trackX = padding - 7; // 椭圆起点 X
                                            const trackY = headerHeight / 2 + padding / 2; // 椭圆起点 Y
                                            const radius = trackHeight / 2; // 椭圆两端的圆弧半径
                                            const straightWidth = trackWidth - 2 * radius; // 椭圆中间的直线长度

                                            context.strokeStyle = '#D77786'; // 红色边框
                                            context.lineWidth = 3; // 加粗椭圆边框
                                            context.beginPath();
                                            // 左侧圆弧
                                            context.arc(trackX + radius, trackY, radius, Math.PI / 2, -Math.PI / 2, false);
                                            // 上方直线
                                            context.lineTo(trackX + radius + straightWidth, trackY - radius);
                                            // 右侧圆弧
                                            context.arc(
                                                trackX + radius + straightWidth,
                                                trackY,
                                                radius,
                                                -Math.PI / 2,
                                                Math.PI / 2,
                                                false
                                            );
                                            // 下方直线
                                            context.lineTo(trackX + radius, trackY + radius);
                                            context.closePath();
                                            context.stroke();

                                            // 绘制红色标绘文字
                                            context.font = `bold ${markFontSize}px Arial`;
                                            context.fillStyle = '#D77786'; // 红色字体
                                            context.textAlign = 'center';
                                            context.textBaseline = 'middle';
                                            context.fillText(markText, trackX + trackWidth / 2, trackY);

                                            // 绘制表格标题文字
                                            context.font = `bold ${titleFontSize}px Arial`; // 标题字体
                                            context.fillStyle = '#ffffff'; // 白色文字
                                            context.textAlign = 'center';
                                            context.textBaseline = 'middle';
                                            context.fillText(
                                                title,
                                                canvasWidth / 2,
                                                headerHeight / 2 + padding / 2
                                            ); // 居中绘制标题

                                            let currentY = headerHeight + padding;
                                            clusteredEntities.forEach((entity, index) => {
                                                const text = entity.labeltext || '无信息';
                                                if (text.length > 10) {
                                                    const words = text.split('');
                                                    let line = '';
                                                    for (let i = 0; i < words.length; i++) {
                                                        if (context.measureText(line + words[i]).width > canvasWidth - 2 * padding) {
                                                            context.font = `${contentFontSize}px Arial`; // 内容字体
                                                            context.fillStyle = '#ffffff'; // 白色字体
                                                            context.textAlign = 'left';
                                                            context.fillText(line, padding, currentY + rowHeight / 2);
                                                            line = words[i];
                                                            currentY += rowHeight;
                                                        } else {
                                                            line += words[i];
                                                        }
                                                    }
                                                    context.font = `${contentFontSize}px Arial`; // 内容字体
                                                    context.fillStyle = '#ffffff'; // 白色字体
                                                    context.textAlign = 'left';
                                                    context.fillText(line, padding, currentY + rowHeight / 2);
                                                } else {
                                                    context.font = `${contentFontSize}px Arial`; // 内容字体
                                                    context.fillStyle = '#ffffff'; // 白色字体
                                                    context.textAlign = 'left';
                                                    context.fillText(text, padding, currentY + rowHeight / 2);
                                                }
                                                currentY += rowHeight;
                                            });

                                            // 将 Canvas 转换为 Billboard 图像
                                            const canvasImage = canvas.toDataURL('image/png');

                                            try {
                                                // 检查 Billboard 是否已初始化
                                                if (cluster.billboard) {
                                                    cluster.billboard.show = true;
                                                    cluster.billboard.image = canvasImage;

                                                    // 调整宽高比例
                                                    cluster.billboard.width = canvasWidth * 0.7;
                                                    cluster.billboard.height = canvasHeight * 0.7;
                                                    cluster.billboard.verticalOrigin =
                                                        Cesium.VerticalOrigin.BOTTOM;

                                                    // 设置 Billboard 高度引用地形
                                                    cluster.billboard.heightReference = Cesium.HeightReference.CLAMP_TO_GROUND;

                                                    // 禁用深度测试，使 Billboard 不会被地形遮挡
                                                    cluster.billboard.disableDepthTestDistance = Number.POSITIVE_INFINITY;
                                                    // 设置 Billboard 位置：背景图片右下角对齐标绘图标正上方
                                                    cluster.billboard.verticalOrigin = Cesium.VerticalOrigin.BOTTOM;
                                                    cluster.billboard.pixelOffset = new Cesium.Cartesian2(
                                                        -(canvasWidth * 0.28), // 调整为右下角更贴近图标
                                                        -(canvasHeight * 0) // 上移贴近图标
                                                    );

                                                    // 隐藏 Cesium 默认的标签
                                                    cluster.label.show = false;
                                                } else {
                                                    cluster.label.show = false;
                                                }
                                            } catch (error) {
                                                // 捕获 Cesium 的内部报错，避免控制台输出
                                                if (error.message && error.message.includes('_textureAtlas')) {
                                                } else {
                                                }
                                            }
                                        };

                                        // 捕获图片加载错误
                                        backgroundImage.onerror = function () {
                                        };
                                    }
                                );
                            }
                        }

                        customStyle();
                    })
                    window.labeldataSource = labeldataSource;
                }
            }
            return labeldataSource
        }
    },

    addMakerPoint(item, type) {
        // console.log(item.startTime,item.endTime,new Date(item.startTime),new Date(item.endTime),"timeTime")
        // console.log(item, "addMakerPoint timeline")
        //点的属性 震中点统用一一个方法
        // let labeltext = null
        item.longitude = Number(geomToCoordinates(item.geom)[0][0])
        item.latitude = Number(geomToCoordinates(item.geom)[0][1])
        let img = '/images/PlotsPic/' + item.plotType + '.png'
        let pointDataSource = this.addDataSourceLayer("pointData")
        let labeldataSource = this.addDataSourceLayer("label")
        if (pointDataSource) {
            if (window.pointDataSource.entities.getById(item.plotId)) {
                window.pointDataSource.entities.removeById(item.plotId);  // 删除已存在的多边形实体
            }
            pointDataSource.entities.add({
                availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
                    start: Cesium.JulianDate.fromDate(new Date(item.startTime)),
                    stop: Cesium.JulianDate.fromDate(new Date(item.endTime))
                })]),
                position: Cesium.Cartesian3.fromDegrees(
                    parseFloat(item.longitude),
                    parseFloat(item.latitude),
                    parseFloat(item.elevation || 0)
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
                id: item.plotId,
                plottype: item.plotType,
                name: type,
                properties: {...item}
            })
            // console.log(item.plotId, item.plotType, "item.plotId, item.plotType")
            let plotId = item.plotId
            let plotType = item.plotType


            if (item.plotType === "失踪人员" || item.plotType === "轻伤人员" || item.plotType === "重伤人员" || item.plotType === "危重伤人员" || item.plotType === "死亡人员" || item.plotType === "被困人员" || item.plotType === "已出发队伍" || item.plotType === "正在参与队伍" || item.plotType === "待命队伍") {
                getPlotInfos({plotId, plotType}).then(res => {
                    console.log(item, res, "item")
                    let labeltext = this.labeltext(plotType, res)
                    // console.log(labeltext,"labeltext")
                    this.addPointLabel(item, labeltext)
                })
            }
        }
    },
    // 选择当前线的material
    getMaterial(type, img) {
        if (type === "量算") {
            let NORMALLINE = new Cesium.PolylineDashMaterialProperty({
                color: Cesium.Color.CYAN,
                dashPattern: parseInt("110000001111", 1),
            })
            return NORMALLINE
        }
        if (type === "地裂缝" || type === "可用供水管网" || type === "不可用供水管网") {
            let PICTURELINE = new Cesium.ImageMaterialProperty({
                image: img,
                repeat: new Cesium.Cartesian2(3, 1),
            })
            return PICTURELINE
        }
        if (type === "可通行公路" || type === "限制通行公路" || type === "不可通行公路") {
            let color = null
            if (type === "可通行公路") {
                color = Cesium.Color.fromBytes(158, 202, 181)
            } else if (type === "限制通行公路") {
                color = Cesium.Color.fromBytes(206, 184, 157)
            } else {
                color = Cesium.Color.fromBytes(199, 151, 149)
            }
            let NORMALLINE = new Cesium.PolylineDashMaterialProperty({
                color: color,
                dashPattern: parseInt("110000001111", 1),
            })
            return NORMALLINE
        }
        if (type === "可通行铁路" || type === "不可通行铁路") {
            let gapColor
            if (type === "可通行铁路") {
                gapColor = Cesium.Color.BLACK
            } else {
                gapColor = Cesium.Color.RED
            }
            let DASHLINE = new Cesium.PolylineDashMaterialProperty({
                color: Cesium.Color.WHITE,
                gapColor: gapColor,
                dashLength: 100
            })
            return DASHLINE
        }
        if (type === "可用输电线路" || type === "不可用输电线路") {
            let NORMALLINE = new Cesium.PolylineDashMaterialProperty({
                color: Cesium.Color.CYAN,
                dashPattern: parseInt("110000001111", 1),
            })
            return NORMALLINE
        }
        if (type === "可用输气管线" || type === "不可用输气管线") {
            let NORMALLINE = new Cesium.PolylineDashMaterialProperty({
                color: Cesium.Color.CYAN,
                dashPattern: parseInt("110000001111", 1),
            })
            return NORMALLINE
        }
    },
    addPolyline(item, type) {
        console.log(item, "addPolyline timeline")
        if (window.viewer && window.viewer.entities) {

            let material = this.getMaterial(item.plotType, '/images/PlotsPic/' + item.plotType + '.png')

            let positionsArr = []
            let coordinates = geomToCoordinates(item.geom)
            coordinates.forEach(e => {
                positionsArr.push(Cesium.Cartesian3.fromDegrees(parseFloat(e[0]), parseFloat(e[1]), parseFloat(0)))
            })
            if (window.viewer.entities.getById(item.plotId)) {
                window.viewer.entities.removeById(item.plotId);  // 删除已存在的多边形实体
            }
            window.viewer.entities.add({
                availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
                    start: Cesium.JulianDate.fromDate(new Date(item.startTime)),
                    stop: Cesium.JulianDate.fromDate(new Date(item.endTime))
                })]),
                id: item.plotId,
                plottype: item.plotType,
                name: type,
                polyline: {
                    positions: positionsArr,
                    width: 5,
                    material: material,
                    // material: Cesium.Color.YELLOW,
                    // depthFailMaterial: Cesium.Color.YELLOW,
                    clampToGround: true,
                },
                properties: {
                    ...item,
                }
            })
        }
    },
    addPolygon(item, type) {
        let img = '/images/PlotsPic/' + item.plotType + '.png'
        // console.log(item, "item")
        if (window.viewer && window.viewer.entities) {
            if (item.plotType === "泥石流" || item.plotType === "滑坡" || item.plotType === "地面沉降" || item.plotType === "崩塌" || item.plotType === "地面塌陷") {
                let polygonPoints = []
                let coordinates = geomToCoordinates(item.geom)
                console.log(coordinates, "coordinates")
                coordinates.forEach(e => {
                    polygonPoints.push(Cesium.Ellipsoid.WGS84.cartographicToCartesian(Cesium.Cartographic.fromDegrees(parseFloat(e[0]), parseFloat(e[1]), parseFloat(0))));
                })
                // 让坐标逆时针，避免背面剔除
                // polygonPoints.reverse();
                if (window.viewer.entities.getById(item.plotId)) {
                    // console.log(window.viewer.entities.getById(item.plotId), "window.viewer.entities.getById(item.plotId)")
                    window.viewer.entities.removeById(item.plotId);  // 删除已存在的多边形实体
                }
                window.viewer.entities.add({
                    availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
                        start: Cesium.JulianDate.fromDate(new Date(item.startTime)),
                        stop: Cesium.JulianDate.fromDate(new Date(item.endTime))
                    })]),
                    id: item.plotId,
                    name: type,
                    polygon: {
                        hierarchy: new Cesium.PolygonHierarchy(polygonPoints),
                        material: new Cesium.ImageMaterialProperty({
                            color: Cesium.Color.WHITE.withAlpha(0.4),
                        }),
                        clampToGround: true,
                        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,// 绑定到地形高度,让billboard贴地
                        depthTest: false,//禁止深度测试但是没有下面那句有用
                        disableDepthTestDistance: Number.POSITIVE_INFINITY//不再进行深度测试（真神）
                    },
                    properties: {
                        // pointPosition: this.positions,
                        // linePoint: this.polygonPointEntity,
                        ...item //弹出框
                    }
                });

                const width = 9000;  // 矩形宽度
                const height = 9000; // 矩形高度
                // 获取大多边形的中心点
                const center = plotCompute.getPolygonCenter(polygonPoints);
                // 生成小矩形的四个角点
                const smallRectanglePositions = plotCompute.createContainedRectangle(center, width, height, item.angle, polygonPoints);
                const diameter = Cesium.Cartesian3.distance(smallRectanglePositions[0], smallRectanglePositions[2]);

                if (window.viewer.entities.getById(item.plotId + "_polygon")) {
                    window.viewer.entities.removeById(item.plotId + "_polygon"); // 先删除现有实体
                }
                // 使用对角线作为直径绘制圆形
                window.viewer.entities.add({
                    availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
                        start: Cesium.JulianDate.fromDate(new Date(item.startTime)),
                        stop: Cesium.JulianDate.fromDate(new Date(item.endTime))
                    })]),
                    id: item.plotId + "_polygon",
                    position: center, // 圆心为大多边形的中心点
                    name: '中心图标',
                    ellipse: {
                        semiMajorAxis: diameter / 2, // 对角线的一半作为半径
                        semiMinorAxis: diameter / 2, // 保证是一个正圆
                        material: new Cesium.ImageMaterialProperty({
                            image: img,
                            repeat: new Cesium.Cartesian2(1.02, 1.0684), // 控制图片的缩放
                            color: Cesium.Color.WHITE.withAlpha(1.0),
                            scale: 0.5 // 调整图片缩放比例
                        }),
                        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,// 绑定到地形高度,让billboard贴地
                        depthTest: false,//禁止深度测试但是没有下面那句有用
                        disableDepthTestDistance: Number.POSITIVE_INFINITY,//不再进行深度测试（真神）
                        stRotation: Cesium.Math.toRadians(item.angle), // 图片旋转
                        clampToGround: true
                    },
                    properties: {
                        // pointPosition: this.positions,
                        // linePoint: this.polygonPointEntity,
                        ...item //弹出框
                    }
                });

                // 黑色光圈的直径要比内圆大一圈，这里简单放大 1.2 倍，你可以按需调整
                const outlineDiameter = diameter * 2;

// 如果之前已经画过，先删掉
                if (window.viewer.entities.getById(item.plotId + "_outline")) {
                    window.viewer.entities.removeById(item.plotId + "_outline");
                }

// 添加黑色描边（光圈）
                window.viewer.entities.add({
                    availability: new Cesium.TimeIntervalCollection([
                        new Cesium.TimeInterval({
                            start: Cesium.JulianDate.fromDate(new Date(item.startTime)),
                            stop: Cesium.JulianDate.fromDate(new Date(item.endTime))
                        })
                    ]),
                    id: item.plotId + "_outline",
                    position: center,               // 与中心圆同心
                    name: '黑色光圈',
                    ellipse: {
                        semiMajorAxis: outlineDiameter / 2,
                        semiMinorAxis: outlineDiameter / 2,
                        material: Cesium.Color.BLACK.withAlpha(0.6), // 纯黑 + 透明度
                        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                        depthTest: false,
                        disableDepthTestDistance: Number.POSITIVE_INFINITY,
                        clampToGround: true,
                        // 如果想做“空心环”，再加一个内环即可
                        // innerSemiMajorAxis: diameter / 2,
                        // innerSemiMinorAxis: diameter / 2
                    }
                });

            } else {
                // 1-1 经纬度
                let polygonPoints = []
                let coordinates = geomToCoordinates(item.geom)
                coordinates.forEach(e => {
                    polygonPoints.push(Cesium.Ellipsoid.WGS84.cartographicToCartesian(Cesium.Cartographic.fromDegrees(parseFloat(e[0]), parseFloat(e[1]), parseFloat(0))));
                })
                if (window.viewer.entities.getById(item.plotId)) {
                    // console.log(window.viewer.entities.getById(item.plotId), "window.viewer.entities.getById(item.plotId)")
                    window.viewer.entities.removeById(item.plotId);  // 删除已存在的多边形实体
                }
                window.viewer.entities.add({
                    availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
                        start: Cesium.JulianDate.fromDate(new Date(item.startTime)),
                        stop: Cesium.JulianDate.fromDate(new Date(item.endTime))
                    })]),
                    id: item.plotId,
                    name: type,
                    polygon: {
                        hierarchy: new Cesium.CallbackProperty(() => new Cesium.PolygonHierarchy(polygonPoints), false),
                        material: img,
                        // stRotation: Cesium.Math.toRadians(polygon[0].angle),
                        clampToGround: true,
                    },
                    properties: {
                        // pointPosition: this.positions,
                        // linePoint: this.polygonPointEntity,
                        ...item //弹出框
                    }
                });
            }
        }
    },
    addArrow(item, type) {
        console.log(item, type, "addArrow timeline")
        if (item.drawtype === 'straight') {
            this.addStraightArrow(item, type)
        } else if (item.drawtype === 'attack') {
            this.addAttackArrow(item, type)
        } else {
            this.addPincerArrow(item, type)
        }
    },
    // //---被引用的子方法-箭头---
    addStraightArrow(item, type) {
        if (window.viewer && window.viewer.entities) {
            let arrowPoints = []
            let coordinates = geomToCoordinates(item.geom)
            coordinates.forEach(e => {
                arrowPoints.push(Cesium.Cartesian3.fromDegrees(parseFloat(e[0]), parseFloat(e[1]), parseFloat(0)))
            })
            var update = function () {
                if (arrowPoints.length < 2) {
                    return null;
                }
                var p1 = arrowPoints[1];
                var p2 = arrowPoints[2];
                var firstPoint = plotCompute.cartesianToLatlng(p1);
                var endPoints = plotCompute.cartesianToLatlng(p2);
                var arrow = [];
                var res = xp.algorithm.fineArrow([firstPoint[0], firstPoint[1]], [endPoints[0], endPoints[1]]);
                var index = JSON.stringify(res).indexOf("null");
                if (index != -1) return [];
                for (var i = 0; i < res.length; i++) {
                    var c3 = new Cesium.Cartesian3(res[i].x, res[i].y, res[i].z);
                    arrow.push(c3);
                }
                return new Cesium.PolygonHierarchy(arrow);
            }
            if (!window.viewer.entities.getById(item.plotId)) {
                window.viewer.entities.add({
                    availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
                        start: Cesium.JulianDate.fromDate(new Date(item.startTime)),
                        stop: Cesium.JulianDate.fromDate(new Date(item.endTime))
                    })]),
                    drawtype: item.drawtype,
                    id: item.plotId,
                    polygon: new Cesium.PolygonGraphics({
                        hierarchy: new Cesium.CallbackProperty(update, false),
                        show: true,
                        fill: true,
                        material: Cesium.Color.BLUE  // 蓝色，透明度0.5
                    }),
                    name: type,
                    properties: {
                        ...item
                    }
                })
            }

        }
    },
    addAttackArrow(item, type) {
        if (window.viewer && window.viewer.entities) {
            let arrowPoints = []
            let coordinates = geomToCoordinates(item.geom)
            coordinates.forEach(e => {
                arrowPoints.push(Cesium.Cartesian3.fromDegrees(parseFloat(e[0]), parseFloat(e[1]), parseFloat(0)))
            })
            var update = function () {
                //计算面
                if (arrowPoints.length < 3) {
                    return null;
                }
                var lnglatArr = [];
                for (var i = 0; i < arrowPoints.length; i++) {
                    var lnglat = plotCompute.cartesianToLatlng(arrowPoints[i]);
                    lnglatArr.push(lnglat)
                }
                var res = xp.algorithm.tailedAttackArrow(lnglatArr);
                var index = JSON.stringify(res.polygonalPoint).indexOf("null");
                var returnData = [];
                if (index == -1) returnData = res.polygonalPoint;
                return new Cesium.PolygonHierarchy(returnData);
            }
            if (window.viewer.entities.getById(item.plotId)) {
                window.viewer.entities.removeById(item.plotId);  // 删除已存在的多边形实体
            }
            window.viewer.entities.add({
                availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
                    start: Cesium.JulianDate.fromDate(new Date(item.startTime)),
                    stop: Cesium.JulianDate.fromDate(new Date(item.endTime))
                })]),
                id: item.plotId,
                polygon: new Cesium.PolygonGraphics({
                    hierarchy: new Cesium.CallbackProperty(update, false),
                    show: true,
                    fill: true,
                    material: Cesium.Color.RED
                }),
                name: type,
                properties: {
                    ...item
                }
            })
        }
    },
    addPincerArrow(item, type) {
        if (window.viewer && window.viewer.entities) {
            let arrowPoints = []
            let coordinates = geomToCoordinates(item.geom)
            coordinates.forEach(e => {
                arrowPoints.push(Cesium.Cartesian3.fromDegrees(parseFloat(e[0]), parseFloat(e[1]), parseFloat(0)))
            })
            var update = function () {
                //计算面
                if (arrowPoints.length < 3) {
                    return null;
                }
                var lnglatArr = [];
                for (var i = 0; i < arrowPoints.length; i++) {
                    var lnglat = plotCompute.cartesianToLatlng(arrowPoints[i]);
                    lnglatArr.push(lnglat)
                }
                var res = xp.algorithm.doubleArrow(lnglatArr);
                var returnData = [];
                var index = JSON.stringify(res.polygonalPoint).indexOf("null");
                if (index == -1) returnData = res.polygonalPoint;
                return new Cesium.PolygonHierarchy(returnData);
            }
            if (window.viewer.entities.getById(item.plotId)) {
                window.viewer.entities.removeById(item.plotId);  // 删除已存在的多边形实体
            }
            window.viewer.entities.add({
                availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
                    start: Cesium.JulianDate.fromDate(new Date(item.startTime)),
                    stop: Cesium.JulianDate.fromDate(new Date(item.endTime))
                })]),
                id: item.plotId,
                polygon: new Cesium.PolygonGraphics({
                    hierarchy: new Cesium.CallbackProperty(update, false),
                    show: true,
                    fill: true,
                    material: Cesium.Color.YELLOW
                }),
                name: type,
                properties: {
                    ...item
                }
            })
        }
    },
    // //标签（点线面）
    labeltext(plotType, res) {
        console.log("标签", plotType, res)
        let labeltext = res.plotInfo.belongCounty + res.plotInfo.belongTown + "新增" + plotType
        //人员伤亡类文字：xxx人员xx人
        if (plotType === "轻伤人员" || plotType === "重伤人员" || plotType === "危重伤人员" || plotType === "死亡人员" || plotType === "被困人员") {
            if (res.plotTypeInfo && res.plotTypeInfo.newCount) {
                labeltext = labeltext + res.plotTypeInfo.newCount + "人"
            }
        }
        //救援队伍 单位,人数人
        if (plotType === "已出发队伍" || plotType === "正在参与队伍" || plotType === "待命队伍") {
            if (res.plotTypeInfo && res.plotTypeInfo.teamName) {
                labeltext = labeltext + ":" + res.plotTypeInfo.teamName
            }
            if (res.plotTypeInfo && res.plotTypeInfo.personnelCount) {
                labeltext = labeltext + res.plotTypeInfo.personnelCount + "人"
            }
            if (res.plotTypeInfo && res.plotTypeInfo.teamName && res.plotTypeInfo.teamName == null && res.plotTypeInfo.personnelCount && res.plotTypeInfo.personnelCount == 0) {
                labeltext = labeltext + "1队"
            }
        }
        // 是否出现人员伤亡，是否处置（次生灾害）
        if (res.plotTypeInfo && res.plotTypeInfo.casualties) {
            labeltext = labeltext + res.plotTypeInfo.casualties + "人员伤亡"
        }
        if (res.plotTypeInfo && res.plotTypeInfo.initialDisposalPhase) {
            labeltext = labeltext + "," + res.plotTypeInfo.initialDisposalPhase
        }
        return labeltext
    },
    addPointLabel(data, labeltext) {

        console.log(data, "data addPointLabel")
        let img = '/images/PlotsPic/' + data.plotType + '.png'
        let log = Number(geomToCoordinates(data.geom)[0][0])
        let lat = Number(geomToCoordinates(data.geom)[0][1])

        let labeldataSource = this.addDataSourceLayer("label")
        if (labeldataSource) {
            let id = data.plotId + '_label'
            // if()
            if (labeldataSource.entities.getById(id)) {
                labeldataSource.entities.removeById(id);  // 删除已存在的多边形实体
            }
            labeldataSource.entities.add({
                availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
                    start: Cesium.JulianDate.fromDate(new Date(data.startTime)),
                    stop: Cesium.JulianDate.fromDate(new Date(data.endTime))
                })]),
                id: data.plotId + '_label',
                plottype: data.plotType,
                name: "标绘点标签",
                // layers: "聚合标绘点",
                position: Cesium.Cartesian3.fromDegrees(log, lat, 0),
                labeltext: labeltext,
                billboard: {
                    // image: import.meta.env.VITE_APP_BASE_API + '/uploads/PlotsPic/' + data.icon + '.png?t=' + new Date().getTime(),
                    image: img,
                    width: 50, // 图片宽度,单位px
                    height: 50, // 图片高度，单位px
                    eyeOffset: new Cesium.Cartesian3(0, 0, 0), // 与坐标位置的偏移距离
                    color: Cesium.Color.WHITE.withAlpha(1),//颜色
                    scaleByDistance: new Cesium.NearFarScalar(500, 1, 5e5, 0.1), // 近大远小
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 绑定到地形高度
                    depthTest: false, // 禁止深度测试
                    disableDepthTestDistance: Number.POSITIVE_INFINITY // 不再进行深度测试
                },
                properties: {
                    data
                }
            })
            // labeldataSource.entities.add({
            //   id: data.plotId + '_base',
            //   position: Cesium.Cartesian3.fromDegrees(Number(data.longitude), Number(data.latitude), Number(data.elevation || 0)),
            //   billboard: {
            //     image: '/images/图标外框.png', // 圆形底座图片
            //     width: 110, // 底座宽度
            //     height: 110, // 底座高度
            //     eyeOffset: new Cesium.Cartesian3(0, 0, 0), // 与坐标位置的偏移距离
            //     scaleByDistance: new Cesium.NearFarScalar(500, 1, 5e5, 0.1), // 近大远小
            //     heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 绑定到地形高度
            //     depthTest: false, // 禁止深度测试
            //     disableDepthTestDistance: Number.POSITIVE_INFINITY // 不再进行深度测试
            //   },
            // });
        }
    },

    // //--------删除-------------
    // deletePointById(plotId, drawType) {
    //     if (drawType === "point") {
    //         let entity = window.pointDataSource.entities.getById(plotId)
    //         console.log(entity, "delete entity window.pointDataSource")
    //         if (entity) {
    //             window.pointDataSource.entities.remove(entity)
    //         }
    //     } else {
    //         console.log(window.viewer.entities,"window.viewer.entities delete timleline")
    //         let entity = window.viewer.entities.getById(plotId)
    //         console.log(entity, "delete entity window.viewer")
    //         if (entity) {
    //             window.viewer.entities.remove(entity)
    //         }
    //         console.log(drawType, entity.properties, entity.properties.plotType._value, "entity.properties.plotType")
    //         if (drawType === "polygon" && (entity.properties.plotType._value === "泥石流" || entity.properties.plotType._value === "滑坡" || entity.properties.plotType._value === "地面沉降" || entity.properties.plotType._value === "崩塌" || entity.properties.plotType._value === "地面塌陷")) {
    //             let polygoncenter = window.viewer.entities.getById(plotId + "_polygon")
    //             // console.log(polygoncenter, window.viewer.entities, "polygonbottom")
    //             if (polygoncenter) {
    //                 window.viewer.entities.remove(polygoncenter)
    //             }
    //         }
    //     }
    //     this.deleteMakerLabel(plotId)
    // },
    //
    //
    // //--------交互-------
    // //标绘点线面显示隐藏
    // markerLayerShow(plots){
    //     this.showAllMakerPoint(plots)
    //     this.makerLabelsShowPersonAndResouce(plots)
    // },
    // markerLayerHidden(plots) {
    //     console.log("markerLayerHidden")
    //     plots.forEach(item => {
    //         // console.log(item)
    //         if (item.drawtype === "point") {
    //             let entity = window.pointDataSource.entities.getById(item.plotId)
    //             if (entity) {
    //                 entity.show = false
    //             }
    //         } else {
    //             let entity = window.viewer.entities.getById(item.plotId)
    //             if (entity) {
    //                 entity.show = false
    //             }
    //         }
    //         let entitylabel=window.labeldataSource.entities.getById(item.plotId+'_label')
    //         if (entitylabel) {
    //             entitylabel.show = false
    //         }
    //     })
    // },
    // showAllMakerPoint(plots) {
    //     plots.forEach(item => {
    //         if (item.drawtype === "point") {
    //             let entity = window.pointDataSource.entities.getById(item.plotId)
    //             if (entity) {
    //                 entity.show = true
    //             }
    //         } else {
    //             let entity = window.viewer.entities.getById(item.plotId)
    //             if (entity) {
    //                 entity.show = true
    //             }
    //         }
    //
    //     })
    // },
    // //标签显示隐藏
    // //隐藏所有标签
    HiddenLabels() {
        if (window.labeldataSource) {
            let toRemove = window.labeldataSource.entities.values.filter(
                e => e.name === '标绘点标签'
            );
            if (toRemove) {
                // 2. 逐个删除
                toRemove.forEach(entity => {
                    entity.show = false
                });
            }
        }
    },
    markerLabelsHidden(plots) {
        if (window.labeldataSource) {
            console.log(window.labeldataSource, "window.labeldataSource")
            plots.forEach(item => {
                let entity = window.labeldataSource.entities.getById(item.plotId + '_label')
                if (entity) {
                    entity.show = false
                }
            })
        }
    },
    // //只显示人员伤亡和救援队伍
    makerLabelsShowPersonAndResouce(plots) {
        console.log(plots, "makerLabelsShowPersonAndResouce")
        if (plots) {
            plots.forEach(item => {
                if (item.plotType === "失踪人员" || item.plotType === "轻伤人员" || item.plotType === "重伤人员" || item.plotType === "危重伤人员" || item.plotType === "死亡人员" || item.plotType === "被困人员" || item.plotType === "已出发队伍" || item.plotType === "正在参与队伍" || item.plotType === "待命队伍") {
                    let entity = window.labeldataSource.entities.getById(item.plotId + '_label')
                    // console.log(entity, "entity show")
                    if (entity) {
                        entity.show = true
                    }
                } else {
                    let entity = window.labeldataSource.entities.getById(item.plotId + '_label')
                    // console.log(item.plotId, entity, "entity not show")
                    if (entity) {
                        entity.show = false
                    }
                }
            })
        }
    },
    // //删除标签
    // deleteMakerLabel(plotId) {
    //     let entity = window.labeldataSource.entities.getById(plotId + '_label')
    //     if (entity) {
    //         window.labeldataSource.entities.remove(entity)
    //     }
    // },
    //
    // //闪烁
    blinkMarker(plot) {
        return new Promise((resolve) => {
            let entity = null
            console.log(plot, "blink")
            // 1) 打印 pointDataSource 里的实体
            // if (window.pointDataSource) {
            //     console.table(
            //         window.pointDataSource.entities.values.map(e => ({
            //             id: e.id,
            //             show: e.show,
            //             layer: e.layer,
            //             plottype: e.plottype
            //         }))
            //     );
            // }
            if (plot.drawtype === 'point') {
                // console.log()
                entity = window.pointDataSource.entities.getById(plot.plotId);
            } else {
                entity = window.viewer.entities.getById(plot.plotId); // 假设每个点都有一个唯一的id
            }
            if (!entity) {
                console.error("Entity not found:", plot);
                resolve();
                return;
            }
            console.log(entity, "blinkMarker entity")
            const interval = 200; // 每次闪烁的时间间隔
            let count = 0;
            const blinkInterval = setInterval(() => {
                entity.show = !entity.show
                count++;
                if (count >= 5) {
                    clearInterval(blinkInterval);
                    entity.show = true;
                    resolve(); // 完成闪烁，继续后续操作
                }
            }, interval);
        });
    },
    fly(lng, lat, height, time) {
        return new Promise((resolve, reject) => {
            window.viewer.scene.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(
                    parseFloat(lng),
                    parseFloat(lat),
                    height),
                orientation: {
                    // 指向
                    heading: 6.283185307179581,
                    // 视角
                    pitch: -1.5688168484696687,
                    roll: 0.0
                },
                duration: time, // 飞行动画持续时间（秒）
                complete: resolve
            });
        });
    },
}
export default timeLine;
