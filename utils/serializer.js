/**
 * Serializes data
 * 
 * @param {Array} data 
 */
export const serialize = (data) => {
    return data.map(dataVal => {
        let newValueFormat = dataVal;

        Object.keys(dataVal).forEach(key => {
            let keyValue = '';

            if (typeof(dataVal[key]) === 'object' && dataVal[key] !== null) {
                keyValue = JSON.stringify(dataVal[key]);
            } else if (typeof(dataVal[key]) === 'boolean') {
                keyValue = dataVal[key] ? 1 : 0;
            } else { // String
                keyValue = dataVal[key];
            }

            newValueFormat = {
                ...newValueFormat,
                [key]: keyValue
            };
        });

        return newValueFormat;
    });
}

/**
 * Unserializes data
 * 
 * @param {Object} data 
 * @param {Object} tableFieldsMetadata 
 */
export const unserialize = (data, tableFieldsMetadata) => {
    return data.map(dataVal => {
        let newFormat = dataVal;                
        
        Object.keys(dataVal).forEach(dataValKey => {
            const field = tableFieldsMetadata[dataValKey];
            
            try {
                const dataType = field.split('|')[0];

                // Special checking: boolean
                newFormat = {
                    ...newFormat,
                    [dataValKey]: dataType === 'boolean'
                        ? (
                            dataVal[dataValKey] > 0
                                ? true
                                : false
                        ) : JSON.parse(dataVal[dataValKey])
                };
            } catch (err) {
                // dataValKey not parseable
                // Retain to original format
            }     
        });
        
        return newFormat;
    });
}