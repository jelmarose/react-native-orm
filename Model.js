import { Query } from "./Query";

import { serialize } from "./utils/serializer";

let _assignableFields   = new WeakMap();
let _selectedField      = new WeakMap();
let _isEdit             = new WeakMap();
let _keyValue           = new WeakMap();

export class Model extends Query {
    constructor() {
        super();

        this.modelName = '';
        this.fields = {};

        _assignableFields.set(this, [
            'created_at',
            'updated_at',
            'deleted_at'
        ]);
        _selectedField.set(this, '');
        _isEdit.set(this, false);
        _keyValue.set(this, {});

        this.setAssignableFields = this.setAssignableFields.bind(this);
        this.getField = this.getField.bind(this);
        this.setFieldValue = this.setFieldValue.bind(this);
        this.all = this.all.bind(this);
        this.find = this.find.bind(this);
        this.first = this.first.bind(this);
        this.save = this.save.bind(this);
        this.remove = this.remove.bind(this);
        this.create = this.create.bind(this);
    }

    /**
     * Sets assignable fields
     * 
     * @param {Array} fields
     */
    setAssignableFields(fields) {
        _assignableFields.set(
            this,
            [
                ...(_assignableFields.get(this)),
                ...fields
            ]
        );
    }

    /**
     * Gets assignable field
     * 
     * @param {String} field
     */
    getField(field) {
        const existingField = (_assignableFields.get(this)).findIndex(value => value === field);

        if (existingField === -1) {
            throw new Error(`Field named "${ field }" does not exist or is not assignable.`);
        }

        _selectedField.set(this, field);

        return this;
    }

    /**
     * Sets assignable field's value
     * 
     * @param {*} value
     */
    setFieldValue(value) {
        let newKeyValue = {};

        // TODO:
        // Will refactor later...
        Object.keys(_keyValue.get(this)).forEach(key => {
            newKeyValue = {
                ...newKeyValue,
                [key]: key === _selectedField.get(this)
                    ? value
                    : (_keyValue.get(this))[key]
            };
        });

        _keyValue.set(this, newKeyValue);
    }

    /**
     * Get all data of the specified Model
     * Same as Query.get()
     */
    all() {
        return new Promise(async (resolve, reject) => {
            return resolve(await this.whereNull('deleted_at').get());
        });
    }

    /**
     * Finds specific model details by id
     * Same as Query.get() but with
     * Query.where() clause
     * 
     * @param {*} value
     * @param {string} column
     */
    find(value, column = 'uuid') {
        return new Promise(async (resolve, reject) => {
            const queryRes = await this.where(column, '=', value).get();

            // TODO
            // Refactor Later...
            if (
                Array.isArray(queryRes.data)
                && queryRes.data.length > 0
            ) {
                let newKeyValue = {};

                // Map retrieved data
                Object.keys(queryRes.data[0]).forEach(key => {
                    // Set key-value (Model)
                    newKeyValue = {
                        ...newKeyValue,
                        [key]: queryRes.data[0][key]
                    };

                    // Set key-value (Parent, Query)
                    this.setKeyValue(key, queryRes.data[0][key]);

                    _isEdit.set(this, true);
                });

                _keyValue.set(this, newKeyValue);

                // Reset value
                newKeyValue = {};
            }

            return resolve({
                statusCode: queryRes.statusCode,
                message: queryRes.message,
                data: queryRes.data[0] || {}
            });
        });
    }

    /**
     * Retrieves first query result
     * Same as Query.get() but with
     * Query.limit() clause
     */
    first() {
        return new Promise(async (resolve, reject) => {
            const queryRes = await this.limit(1).get();

            // TODO
            // Refactor Later...
            if (
                Array.isArray(queryRes.data)
                && queryRes.data.length > 0
            ) {
                let newKeyValue = {};

                // Map retrieved data
                Object.keys(queryRes.data[0]).forEach(key => {
                    // Set key-value (Model)
                    newKeyValue = {
                        ...newKeyValue,
                        [key]: queryRes.data[0][key]
                    };

                    // Set key-value (Parent, Query)
                    this.setKeyValue(key, queryRes.data[0][key]);

                    _isEdit.set(this, true);
                });

                _keyValue.set(this, newKeyValue);

                // Reset value
                newKeyValue = {};
            }

            return resolve({
                statusCode: queryRes.statusCode,
                message: queryRes.message,
                data: queryRes.data[0] || {}
            });
        });
    }

    /**
     * Saves data of the specified Model
     * Same as Query.insert() and Query.update() but single data only
     * 
     */
    save() {
        return new Promise(async (resolve, reject) => {
            const isEdit = _isEdit.get(this);

            // Reset value
            _isEdit.set(this, false);

            return resolve(
                !isEdit
                    ? (
                        await this.insert([
                            _keyValue.get(this)
                        ])
                    ) : (
                        await this.update(serialize([ _keyValue.get(this) ])[0])
                    )
            );
        });
    }

    /**
     * Removes data of the specified Model
     * Same as Query.delete()
     * 
     */
    remove() {
        return new Promise(async (resolve, reject) => {
            // Reset values
            _isEdit.set(this, false);

            return resolve(await this.delete());
        });
    }

    /**
     * Creates new record(s) (batch insert)
     * Same as Query.insert()
     * 
     * @param {Array} values
     */
    create(values = []) {
        return new Promise(async (resolve, reject) => {
            return resolve(await this.insert(serialize(values)));
        });
    }
}