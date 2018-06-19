import SQLite from 'react-native-sqlite-storage';

import { toSqlField } from './utils/fields';

let _databaseName       = new WeakMap();
let _version            = new WeakMap();
let _description        = new WeakMap();
let _size               = new WeakMap();
let _databaseInstance   = new WeakMap();

export class Schema {
    constructor(props = {}) {
        // SQLite configuration
        SQLite.DEBUG(props.debug || false);
        SQLite.enablePromise(true);

        if (!props.databaseName) {
            throw new Error('Database name is required.');
        }

        // Database configuration
        _databaseName.set(this, props.databaseName);
        _version.set(this, props.version || '1.0');
        _description.set(this, props.description || `${ _databaseName.get(this) }; Version: ${ _version.get(this) }`);
        _size.set(this, props.size || -1);
        _databaseInstance.set(this, null);

        this.open = this.open.bind(this);
        this.createTable = this.createTable.bind(this);
    }

    /**
     * Opens (if already exist) or creates (if does not exist) database
     */
    async open() {
        try {
            const openDbRes = await SQLite.openDatabase(
                _databaseName.get(this),
                _version.get(this),
                _description.get(this),
                _size.get(this)
            );

            _databaseInstance.set(this, openDbRes);

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
                await (_databaseInstance.get(this)).transaction(async (tx) => {
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