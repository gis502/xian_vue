import {getEqOutputMaps} from "./damageassessment.js";
import {getEqOutputRainMaps} from "./damageassessment.js";
import * as http from "node:http";
import request from "@/utils/request.js";

/**
 * 灾损接口：获取专题图件getMap与灾情报告getReport
 * @param eqid
 * @param eqqueueId
 * @param eqFullName
 * @param type
 */
export function handleOutputData(eventId, eventQueueId, eventFullName, eventTypeof, type) {
    const batch = eventQueueId.slice(-1);
    // 初始化返回数据
    let returnData = {
        // 标题
        themeName: "",
        // 对应数据
        themeData: []
    };
    return new Promise((resolve, reject) => {
        if (type === "thematicMap") {
            if (eventTypeof === "地震") {
                const DTO = {
                    eqId: eventId,
                    eqqueueId: eventQueueId,
                };
                getEqOutputMaps(DTO).then((res) => {
                    const data = res.data;
                    const themeName = eventFullName + "-" + "专题图";
                    let thematicMapData = [];
                    console.log("专题图",data)
                    for (let i = 0; i < data.length; i++) {
                        if (data[i].fileType === "图片") {
                            const paths = data[i].sourceFile.split("/");
                            // 后端请求迁移文件
                            request(
                                {
                                    url: '/file/remove',
                                    method: 'post',
                                    params: {
                                        url: encodeURIComponent(data[i].sourceFile)
                                    },
                                }
                            )
                            data[i].sourceFile = `/imgs/${paths[paths.length - 1]}`

                            const thematicMapObject = {
                                // imgUrl: data[i].sourceFile,
                                // imgUrl: data[i].sourceFile,
                                imgUrl: 'http://10.7.71.1'+data[i].localSourceFile,
                                theme: data[i].fileName,
                            };
                            console.log("专题图", thematicMapObject)
                            thematicMapData.push(thematicMapObject);
                        }
                    }
                    returnData.themeName = themeName;
                    returnData.themeData = thematicMapData;
                    console.log("返回专题图数据：", returnData)

                    resolve(returnData); // 返回更新后的数据
                }).catch(err => {
                    //
                    //reject(err); // 如果请求失败，返回错误
                    reject("正在生成专题图中,请稍后...");

                });
            }
            else if(eventTypeof === "暴雨") {
                const rainDto = {
                    rainId: eventId,
                    rainQueueId: eventQueueId,
                };
                getEqOutputRainMaps(rainDto).then((res) => {
                    const data = res.data;
                    const themeName = eventFullName + "-" + "专题图";
                    let thematicMapData = [];
                    console.log("专题图baoyu",data,)
                    for (let i = 0; i < data.length; i++) {
                        if (data[i].fileType === "图片") {
                            const paths = data[i].sourceFile.split("/");
                            // 后端请求迁移文件
                            request(
                                {
                                    url: '/file/remove',
                                    method: 'post',
                                    params: {
                                        url: encodeURIComponent(data[i].sourceFile),
                                    },
                                }
                            )
                            data[i].sourceFile = `/imgs/${paths[paths.length - 1]}`

                            const thematicMapObject = {
                                // imgUrl: data[i].sourceFile,
                                imgUrl: 'http://10.7.71.1'+data[i].localSourceFile,
                                theme: data[i].fileName,
                            };
                            console.log("专题图", thematicMapObject)
                            thematicMapData.push(thematicMapObject);
                        }
                    }
                    returnData.themeName = themeName;
                    returnData.themeData = thematicMapData;
                    console.log("返回专题图数据：", returnData)

                    resolve(returnData); // 返回更新后的数据
                }).catch(err => {
                    //
                    //reject(err); // 如果请求失败，返回错误
                    reject("正在生成专题图中,请稍后...");

                });
            }
        } else if (type === "report") {
            // getDownloadReport(DTO).then((res) => {
            //     console.log("灾情报告数据：", res);
            //     const data = res.data;
            //     const themeName = eqFullName + "-" + "灾情报告";
            //     let reportData = [];
            //     console.log("报告")
            //     for (let i = 0; i < res.data.length; i++) {
            //         const reportObject = {
            //             docxUrl: `${zaisunimageipLocal}${data[i].sourceFile}`,
            //             theme: data[i].fileName,
            //         };
            //         console.log(reportObject)
            //         reportData.push(reportObject);
            //     }
            //
            //     returnData.themeName = themeName;
            //     returnData.themeData = reportData;
            //     console.log("返回报告数据：", returnData)
            //     resolve(returnData); // 这里也是异步，所以也需要 resolve
            // }).catch(err => {
            //     reject(err);
            // });
        }
    })
}
