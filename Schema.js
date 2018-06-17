import SQLite from 'react-native-sqlite-storage';

import { toSqlField } from './utils/fields';

export const Schema = (() => {
    let _databaseName = '';
    let _version = '';
    let _description = '';
    let _size = -1;
    let _databaseInstance = null;

    return class Schema {
        constructor(props = {}) {
            // SQLite configuration
            SQLite.DEBUG(props.debug || false);
            SQLite.enablePromise(true);
    
            if (!props.databaseName) {
                throw new Error('Database name is required.');
            }
    
            // Database configuration
            _databaseName = props.databaseName;
            _version = props.version || '1.0';
            _description = props.description || `${ _databaseName }; Version: ${ _version }`;
            _size = props.size || -1;
            _databaseInstance = null;

            this.open = this.open.bind(this);
            this.createTable = this.createTable.bind(this);
        }
    
        /**
         * Opens (if already exist) or creates (if does not exist) database
         */
        async open() {
            try {
                const openDbRes = await SQLite.openDatabase(
                    _databaseName,
                    _version,
                    _description,
                    _size
                );
    
                _databaseInstance = openDbRes;
    
                return Promise.resolve({
                    statusCode: 200,
                    message: 'Database opened successfully.',
                    data: openDbRes
                });
            } catch (err) {
                console.log('createDatabase error:', err);
    
                return Promise.reject({
                    statusCode: 500,
                    message: 'Unable to open database.'
                })
            }
        }
    
        /**
         * Creates new table via model
         * 
         * @param {Model} model
         */
        createTable(model) {
            return new Promise(async (resolve, reject) => {
                // Add default timestamps
                const fields = {
                    ...model.getModelFields(),
                    created_at: 'string',
                    updated_at: 'string',
                    deleted_at: 'string'
                };
    
                let sqlFieldFormat = '';
    
                // Format to SQL field
                Object.keys(fields).forEach((fieldVal, fieldIndex) => {
                    sqlFieldFormat += `${ fieldVal } ${toSqlField(fields[fieldVal])}`
                        + ( 
                            fieldIndex === Object.keys(fields).length - 1
                                ? ''
                                : ', '
                        );
                });
    
                try {
                    await _databaseInstance.transaction(async (tx) => {
                        try {
                            // Create table
                            await tx.executeSql('CREATE TABLE IF NOT EXISTS '
                                + model.getModelName()
                                + '(' + sqlFieldFormat + ');'
                            );
                        } catch (err) {
                            console.log('Table creation error:', err);
    
                            return reject({
                                statusCode: 500,
                                message: 'Table creation error.'
                            });
                        }
                    });
                } catch (err) {
                    console.log('Database transaction error (createTable):', err);
    
                    return reject({
                        statusCode: 500,
                        message: 'An error occurred.'
                    });
                }
    
                return resolve({
                    statusCode: 200,
                    message: 'Table successfully created',
                    data: {
                        modelName: model.getModelName(),
                        fields
                    }
                });
            });
        }
    }
})();