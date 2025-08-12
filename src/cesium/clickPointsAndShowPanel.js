let clickPointsAndShowPanel = {

    extractDataForPanel(entity, matchedHiddenHighlightEntities) {
        // console.log(matchedHiddenHighlightEntities,"matchedHiddenHighlightEntities extractDataForPanel")
        let properties = {};
        if (entity._name === "滑坡隐患点" || entity._name === "泥石流隐患点" || entity._name === "风险区域") {
            // console.log("1111111")
            let predictData = {level: '', probability: 0};
            if (matchedHiddenHighlightEntities) {
                let matchedEntity = null;
                matchedEntity = matchedHiddenHighlightEntities.find((item, index) => {
                    console.log(item.geologicalDisasterHideDTO.id,entity.properties._data._value.geologicalDisasterHideDTO.id,"item.geologicalDisasterHideDTO.id")
                    return item.geologicalDisasterHideDTO.id === entity.properties._data._value.geologicalDisasterHideDTO.id;
                });
                // console.log(matchedEntity,"matchedEntity")

                if (matchedEntity) {
                    predictData = matchedEntity.predict;
                }
                else {
                    predictData = {level: '', probability: 0};
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
            entity.properties.propertyNames.forEach(name => {
                properties[name] = entity.properties[name].getValue();
            });
        }
        console.log(properties,"properties")
        return properties;
    },

}
export default clickPointsAndShowPanel