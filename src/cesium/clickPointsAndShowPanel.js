let clickPointsAndShowPanel = {

    extractDataForPanel(entity, matchedHiddenHighlightEntities) {
        console.log(matchedHiddenHighlightEntities,"matchedHiddenHighlightEntities extractDataForPanel")
        let properties = {};
        if (entity._name === "滑坡隐患点"|| entity._name === "泥石流隐患点"|| entity._name === "风险区域"|| entity._name === "内涝隐患点"|| entity._name === "山洪隐患点") {
            // console.log("1111111")
            let predictData = {
                level: [],
                probability: [],
                // disaster:[],
                disasterType:''
            };
            if (matchedHiddenHighlightEntities) {
                let matchedEntity = null;
                matchedEntity = matchedHiddenHighlightEntities.find((item, index) => {
                    // console.log(item.geologicalDisasterHideDTO.id,entity.properties._data._value.geologicalDisasterHideDTO.id,"item.geologicalDisasterHideDTO.id")
                    // return item.hide_id === entity.properties._data._value.geologicalDisasterHideDTO.id;
                    return item.geologicalDisasterHideDTO.id === entity.properties._data._value.geologicalDisasterHideDTO.id;
                });
                console.log(matchedEntity,"matchedEntity")

                if (matchedEntity) {
                    predictData.probability =matchedEntity.probability;
                    predictData.level = matchedEntity.level;
                    // predictData.disaster = matchedEntity.disaster;
                    predictData.disasterType = matchedEntity.disasterType;
                }
                else {
                    predictData = {
                        level: [],
                        probability: [],
                        // disaster:[],
                        disasterType:  ''
                    };
                }
                console.log(predictData,"predictData")
                properties = {
                    ...entity.properties.data._value,
                    predict: predictData
                };
            }
            else{
                properties = {
                    ...entity.properties.data._value,
                    predict: predictData
                };

            }

        }
        else {
            // console.log("222222222222")
            entity.properties.propertyNames.forEach(name => {
                properties[name] = entity.properties[name].getValue();
            });
        }
        console.log(properties,"properties")
        return properties;
    },
    extractDataForPanelWithOutGeo(entity, matchedHiddenHighlightEntities) {
        console.log(matchedHiddenHighlightEntities,"matchedHiddenHighlightEntities extractDataForPanel")
        let properties = {};
        if (entity._name === "滑坡隐患点"|| entity._name === "泥石流隐患点"|| entity._name === "风险区域"|| entity._name === "内涝隐患点"|| entity._name === "山洪隐患点") {
            // console.log("1111111")
            let predictData = {
                level: [],
                probability: [],
                // disaster:[],
                disasterType:''
            };
            if (matchedHiddenHighlightEntities) {
                let matchedEntity = null;
                matchedEntity = matchedHiddenHighlightEntities.find((item, index) => {
                    // console.log(item.geologicalDisasterHideDTO.id,entity.properties._data._value.geologicalDisasterHideDTO.id,"item.geologicalDisasterHideDTO.id")
                    return item.hide_id === entity.properties._data._value.geologicalDisasterHideDTO.id;
                });
                console.log(matchedEntity,"matchedEntity")

                if (matchedEntity) {
                    predictData.probability =[matchedEntity.disaster_probability];
                    predictData.level = matchedEntity.level[1];
                    // predictData.disaster = matchedEntity.disaster_name;
                    predictData.disasterType = matchedEntity.disaster_type;
                }
                else {
                    predictData = {
                        level: [],
                        probability: [],
                        // disaster:[],
                        disasterType:  ''
                    };
                }
                console.log(predictData,"predictData")
                properties = {
                    ...entity.properties.data._value,
                    predict: predictData
                };
            }
            else{
                properties = {
                    ...entity.properties.data._value,
                    predict: predictData
                };

            }

        }
        else {
            // console.log("222222222222")
            entity.properties.propertyNames.forEach(name => {
                properties[name] = entity.properties[name].getValue();
            });
        }
        console.log(properties,"properties")
        return properties;
    },

}
export default clickPointsAndShowPanel
