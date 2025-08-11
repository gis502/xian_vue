import {useSimulationPointStore} from "@/store/earthquake/simulation_points.js";

let clickPointsAndShowPanel = {
    extractDataForPanel(entity, matchedHiddenHighlightEntities) {
        console.log(matchedHiddenHighlightEntities, "matchedHiddenHighlightEntities extractDataForPanel")
        let properties = {};
        if (entity._name === "地震中心" || entity._name === "暴雨中心") {
            entity.properties.propertyNames.forEach(name => {
                properties[name] = entity.properties[name].getValue();
            });
        } else if (entity._name === "滑坡隐患点" || entity._name === "泥石流隐患点" || entity._name === "风险区域") {
            let predictData = {level: '', probability: 0};
            if (matchedHiddenHighlightEntities) {
                let matchedEntity = null;
                matchedEntity = matchedHiddenHighlightEntities.find((item, index) => {
                    console.log(item.geologicalDisasterHideDTO.id, entity.properties._data._value.geologicalDisasterHideDTO.id, "item.geologicalDisasterHideDTO.id")
                    return item.geologicalDisasterHideDTO.id === entity.properties._data._value.geologicalDisasterHideDTO.id;
                });
                console.log(matchedEntity, "matchedEntity")

                if (matchedEntity) {
                    predictData = matchedEntity.predict;
                } else {
                    predictData = {level: '', probability: 0};
                }
            }
            else {
            }
            console.log(predictData, "predictData")

            let geologicalDisasterHideDTO = null
            let factorVoList = null

            useSimulationPointStore().simulationPoints.forEach((item) => {
                let entityIdMerge = ''
                if (entity._name == "风险区域") {
                    entityIdMerge = entity._name + item.geologicalDisasterHideDTO.unitCode
                } else {
                    entityIdMerge = entity._name + item.geologicalDisasterHideDTO.id
                }
                if (entityIdMerge === entity._id) {
                    geologicalDisasterHideDTO = item.geologicalDisasterHideDTO
                    factorVoList = item.factorVoList
                }
            });
            properties = {
                factorVoList: factorVoList,
                geologicalDisasterHideDTO: geologicalDisasterHideDTO,
                predict: predictData
            };
        }
        console.log(properties, "properties")
        return properties;
    },

}
export default clickPointsAndShowPanel