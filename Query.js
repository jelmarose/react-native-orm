import SQLite from 'react-native-sqlite-storage';

import { unserialize } from './utils/serializer';
import { formatTimestamp } from './utils/timestamp';
import { Subquery } from './Subquery';

// SQLite configuration
SQLite.DEBUG(false);
SQLite.enablePromise(true);

let _databaseInstance   = null;

let _tableName          = new WeakMap();
let _tableFields        = new WeakMap();
let _whereClause        = new WeakMap();
let _whereClauseValues  = new WeakMap();    
let _limitNum           = new WeakMap();
let _keyValue           = new WeakMap();
let _subqueryInstance   = new WeakMap();
let _orderByClause      = new WeakMap();
let _distinctClause     = new WeakMap();

export class Query {
    constructor(props = {}) {
        _tableName.set(this, '');
        _tableFields.set(this, {});
        _whereClause.set(this, '');
        _whereClauseValues.set(this, []);    
        _limitNum.set(this, 0);
        _keyValue.set(this, {});
        _subqueryInstance.set(this, new Subquery());
        _orderByClause.set(this, '');
        _distinctClause.set(this, '');

        this.setDatabaseInstance = this.setDatabaseInstance.bind(this);
        this.setKeyValue = this.setKeyValue.bind(this);
        this.getKeyValue = this.getKeyValue.bind(this);
        this.tableName = this.tableName.bind(this);
        this.tableFields = this.tableFields.bind(this);
        this.where = this.where.bind(this);
        this.whereNull = this.whereNull.bind(this);
        this.whereNotNull = this.whereNotNull.bind(this);
        this.limit = this.limit.bind(this);
        this.get = this.get.bind(this);
        this.insert = this.insert.bind(this);
        this.update = this.update.bind(this);
        this.delete = this.delete.bind(this);
        this.count = this.count.bind(this);
        this.distinct = this.distinct.bind(this);
    }

    /**
     * Sets database instance
     * 
     * @param {Object} dbInstance
     */
    setDatabaseInstance(dbInstance) {
        if (!_databaseInstance) {
            _databaseInstance = dbInstance;
        }
    }

    /**
     * Sets key-value pair
     * 
     * @param {string} key
     * @param {string} value
     */
    setKeyValue(key, value) {
        let newKeyVal = _keyValue.get(this);

        newKeyVal[key] = value;

        _keyValue.set(this, newKeyVal);
    }

    /**
     * Gets key-value pair
     * 
     */
    getKeyValue() {
        return _keyValue.get(this);
    }

    /**
     * Set Table Name
     * 
     * @param {string} tableName
     */
    tableName(tableName) {
        _tableName.set(this, tableName);

        return this;
    }

    /**
     * Set Table Fields
     * 
     * @param {Array} fields
     */
    tableFields(fields) {
        _tableFields.set(this, {
            ...fields,
            created_at: 'string',
            updated_at: 'string',
            deleted_at: 'string'
        });

        return this;
    }

    /**
     * Where clause
     * 
     * @param {string|Function} column
     * @param {string} operator
     * @param {*} value
     */
    where(column, operator, value) {
        if (column instanceof Function) {
            const subquery = column(_subqueryInstance.get(this));

            _whereClause.set(this, `${ _whereClause.get(this) } ${ subquery.getWhereClause() }`);

            _whereClauseValues.set(
                this,
                [
                    ...(_whereClauseValues.get(this)),
                    ...(subquery.getWhereClauseValues())
                ]
            );

            return this;
        }

        if (_whereClause.get(this)) {
            _whereClause.set(this, `${ _whereClause.get(this) } AND ${ column } ${ operator } ?`);
        } else {
            _whereClause.set(this, `WHERE ${ column } ${ operator } ?`);
        }

        _whereClauseValues.set(
            this,
            [
                ...(_whereClauseValues.get(this)),
                value
            ]
        );

        return this;
    }

    /**
     * Where clause (AND)
     * 
     * @param {string} column
     * @param {string} operator
     * @param {*} value
     */
    andWhere(column, operator, value) {
        _whereClause.set(this, `${ _whereClause.get(this) } AND ${ column } ${ operator } ?`);
        _whereClauseValues.set(
            this,
            [
                ...(_whereClauseValues.get(this)),
                value
            ]
        );

        return this;
    }

    /**
     * Where clause (OR)
     * 
     * @param {string|Function} column
     * @param {string} operator
     * @param {*} value
     */
    orWhere(column, operator, value) {
        if (column instanceof Function) {
            const subquery = column(_subqueryInstance.get(this));

            _whereClause.set(this, `${ _whereClause.get(this) } ${ subquery.getWhereClause('OR') }`);

            _whereClauseValues.set(
                this,
                [
                    ...(_whereClauseValues.get(this)),
                    ...(subquery.getWhereClauseValues())
                ]
            );

            return this;
        }

        _whereClause.set(this, `${ _whereClause.get(this) } OR ${ column } ${ operator } ?`);
        _whereClauseValues.set(
            this,
            [
                ...(_whereClauseValues.get(this)),
                value
            ]
        );

        return this;
    }

    /**
     * Where clause value is null
     * 
     * @param {string} column
     */
    whereNull(column) {
        _whereClause.set(this, `WHERE ${ column } IS NULL`);

        return this;
    }

    /**
     * Where clause value is null (AND)
     * 
     * @param {string} column
     */
    andWhereNull(column) {
        _whereClause.set(this, `${ _whereClause.get(this) } AND ${ column } IS NULL`);

        return this;
    }

    /**
     * Where clause value is null (OR)
     * 
     * @param {string} column
     */
    orWhereNull(column) {
        _whereClause.set(this, `${ _whereClause.get(this) } OR ${ column } IS NULL`);

        return this;
    }

    /**
     * Where clause value is not null
     * 
     * @param {string} column
     */
    whereNotNull(column) {
        _whereClause.set(this, `WHERE ${ column } IS NOT NULL`);

        return this;
    }

    /**
     * Where clause value is not null (AND)
     * 
     * @param {string} column
     */
    andWhereNotNull(column) {
        _whereClause.set(this, `${ _whereClause.get(this) } AND ${ column } IS NOT NULL`);

        return this;
    }

    /**
     * Where clause value is not null
     * 
     * @param {string} column
     */
    orWhereNotNull(column) {
        _whereClause.set(this, `${ _whereClause.get(this) } OR ${ column } IS NOT NULL`);

        return this;
    }

    /**
     * Limits # of query result
     * 
     * @param {Number} limitNum
     */
    limit(limitNum = 1) {
        _limitNum.set(this, limitNum);
        
        return this;
    }

    /**
     * Execute query (Get)
     * 
     */
    get() {
        return new Promise(async (resolve, reject) => {
            const fields = Object.keys(_tableFields.get(this)).join(', ');
            const limitQueryFormat = _limitNum.get(this) > 0
                ? `LIMIT ${ _limitNum.get(this) }`
                : '';

            const sqlQuery = await _databaseInstance.executeSql('SELECT '
                + (_distinctClause.get(this) ? `${ _distinctClause.get(this) } ` : '')
                + (_distinctClause.get(this) ? 'FROM ' : fields + ' FROM ') 
                + _tableName.get(this) + ' '
                + _whereClause.get(this) + ' '
                + (_orderByClause.get(this) ? `${ _orderByClause.get(this) } ` : '')
                + limitQueryFormat + ';', _whereClauseValues.get(this));

            // Reset values
            _whereClause.set(this, '');
            _whereClauseValues.set(this, []);

            // Empty result
            if (sqlQuery[0].rows.length === 0) {
                return resolve({
                    statusCode: 200,
                    message: 'Successful query',
                    data: []
                });
            }

            let rowsLength =  sqlQuery[0].rows.length;
            let data = [];

            for (let i = 0; i < rowsLength; i++) {
                data.push(sqlQuery[0].rows.item(i));
            }

            return resolve({
                statusCode: 200,
                message: 'Successful query',
                data: unserialize(data, _tableFields.get(this))
            });
        });
    }

    insert(data = []) {
        return new Promise(async (resolve, reject) => {
            try {
                await _databaseInstance.transaction(async (tx) => {
                    let length = data.length;
                    let value = {};

                    while (length--) {
                        // Create/update default timestamps (created_at and updated_at only)
                        const timestamp = new Date();

                        value = {
                            ...(data[length]),
                            created_at: formatTimestamp(timestamp),
                            updated_at: formatTimestamp(timestamp)
                        };

                        let columnFormat = '(' + Object.keys(value).join(', ') + ')';
                        let values = Object.keys(value).map(key => {
                            return value[key];
                        });

                        const insertQueryFormat = 'INSERT INTO '
                            + _tableName.get(this) + ' '
                            + columnFormat
                            + ' VALUES '
                            + '(' + (Array(values.length).fill('?')).join(', ') + ')';

                        try {
                            tx.executeSql(insertQueryFormat, values);
                        } catch (err) {
                            console.log('Data insertion error:', err);
    
                            return reject({
                                statusCode: 500,
                                message: 'Data insertion error.'
                            });
                        }
                    }

                    return resolve({
                        statusCode: 200,
                        message: 'Data successfully inserted.',
                        data: {}
                    });
                });
            } catch (err) {
                console.log('Query.insert() error:', err);

                return reject({
                    statusCode: 500,
                    message: 'An error occurred.'
                });
            }
        });
    }

    /**
     * Updates data of the specified Model
     * 
     * @param {Object} value
     */
    update(value) {
        return new Promise(async (resolve, reject) => {
            try {
                await _databaseInstance.transaction(async (tx) => {
                    let tableFieldUpdates = [];
                    let dataValues = [];

                    Object.keys(_tableFields.get(this)).forEach(key => {
                        tableFieldUpdates.push(`${ key } = ?`);
                        
                        // Create/update default timestamp (updated_at only)
                        dataValues.push(key === 'updated_at' ? formatTimestamp(new Date()) : value[key]);   
                    });

                    const updateQueryFormat = 'UPDATE ' + _tableName.get(this)
                        + ' SET '
                        + tableFieldUpdates.join(', ')
                        + ' WHERE uuid = ?;';

                    await tx.executeSql(updateQueryFormat, dataValues.concat([ (_keyValue.get(this)).uuid ]));

                    return resolve({
                        statusCode: 200,
                        message: 'Data successfully updated.',
                        data: {}
                    });
                });
            } catch (err) {
                console.log('Query.update() error:', err);

                return reject({
                    statusCode: 500,
                    message:    'An error occurred.'
                });
            }
        });
    }

    /**
     * Removes data of the specified Model
     * 
     * TODO:
     * Soft delete record by default
     */
    delete() {
        return new Promise(async (resolve, reject) => {
            try {
                await _databaseInstance.transaction(async (tx) => {
                    const deleteQueryFormat = 'DELETE FROM ' + _tableName.get(this)
                        + ' WHERE uuid = ?';

                    await tx.executeSql(deleteQueryFormat, [ (_keyValue.get(this)).uuid ]);

                    return resolve({
                        statusCode: 200,
                        message: 'Data successfully deleted.',
                        data: {}
                    });
                });
            } catch (err) {
                console.log('Query.delete() error:', err);

                return reject({
                    statusCode: 500,
                    message: 'An error occurred.'
                });
            }
        });
    }
    
    /**
     * Counts number of records in a table
     * 
     */
    count() {
        return new Promise(async (resolve, reject) => {
            try {
                const selectCountQuery = `SELECT COUNT(*) AS count FROM ${ _tableName.get(this) }`;
                const queryResult = await _databaseInstance.executeSql(selectCountQuery);
                
                return resolve({
                    statusCode: 200,
                    message: 'Query executed successfully.',
                    data: queryResult[0].rows.item(0)
                });
            } catch (err) {
                console.log('Query.count() error:', err);

                return reject({
                    statusCode: 500,
                    message: 'An error occurred.'
                });
            }
        });
    }

    /**
     * Sorts query result by a given column.
     * 
     * @param {String} column 
     * @param {String} sort 
     */
    orderBy(column, sort = 'asc') {
        _orderByClause.set(this, `ORDER BY ${ column } ${ sort.toUpperCase() }`);

        return this;
    }

    /**
     * Removes duplicate rows in a record
     * 
     * @param {String|Array} column 
     */
    distinct(column = []) {
        _distinctClause.set(this, `DISTINCT ${ Array.isArray(column) ? column.join(', ') : column }`);

        return this;
    }
}