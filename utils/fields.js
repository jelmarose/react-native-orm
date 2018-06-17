/**
 * Formats Model field values to SQL field
 * 
 * @param {string} field 
 */
export const toSqlField = (field) => {
    const fieldSplit = field.split('|');

    let fieldFormat = '';

    fieldSplit.forEach((val, index) => {
        switch (val) {
            case 'primary': {
                fieldFormat += 'PRIMARY KEY' + (index == fieldSplit.length - 1 ? '' : ' ');

                break;
            }

            case 'string': {
                fieldFormat += 'VARCHAR(255)' + (index == fieldSplit.length - 1 ? '' : ' ');

                break;
            }

            case 'text': {
                fieldFormat += 'TEXT' + (index == fieldSplit.length - 1 ? '' : ' ');

                break;
            }

            case 'boolean': { /* No break */ }
                
            case 'int': {
                fieldFormat += 'INTEGER' + (index == fieldSplit.length - 1 ? '' : ' ');                

                break;
            }

            default: {}
        }
    });

    return fieldFormat;
}