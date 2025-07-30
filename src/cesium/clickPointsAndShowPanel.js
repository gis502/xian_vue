let clickPointsAndShowPanel = {

    extractDataForPanel(entity, matchedHiddenHighlightEntities) {
        let properties = {};
        if (entity.name === "滑坡隐患点" || entity.name === "泥石流隐患点" || entity.name === "风险区域") {
            let predictData = {level: '', probability: 0};
            if (this.matchedHiddenHighlightEntities) {
                let matchedEntity = null;
                matchedEntity = this.matchedHiddenHighlightEntities.find((item, index) => {
                    return item.geologicalDisasterHideDTO.id === entity.properties._data._value.geologicalDisasterHideDTO.id;
                });
                if (matchedEntity) {
                    predictData = matchedEntity.predict;
                }
            }
            properties = {
                ...entity.properties.data._value,
                predict: predictData
            };

        } else {
            entity.properties.propertyNames.forEach(name => {
                properties[name] = entity.properties[name].getValue();
            });
        }
        return properties;
    },

}
export default clickPointsAndShowPanel