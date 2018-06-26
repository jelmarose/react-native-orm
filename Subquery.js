let _whereClause        = new WeakMap();
let _whereClauseValues  = new WeakMap();

export class Subquery {
    constructor(props = {}) {
        _whereClause.set(this, []);
        _whereClauseValues.set(this, []);

        this.where = this.where.bind(this);
        this.orWhere = this.orWhere.bind(this);
        this.getWhereClause = this.getWhereClause.bind(this);
    }

    /**
     * Get where() clause
     * 
     * @param {string} clause 
     */
    getWhereClause(clause = 'AND') {
        let finalQuery = '';

        (_whereClause.get(this)).forEach((value, index) => {
            if (index === 0) {
                finalQuery += `${ clause } (${ value }`;
            } else if (index === (_whereClause.get(this).length - 1)) {
                finalQuery += ` ${ value })`;
            } else {
                finalQuery += ` ${ value }`;
            }
        });

        // Reset value
        _whereClause.set(this, []);

        return finalQuery;
    }

    /**
     * Get where() values
     * 
     */
    getWhereClauseValues() {
        const values = _whereClauseValues.get(this);

        // Reset value
        _whereClauseValues.set(this, []);

        return values;
    }

    /**
     * Where clause
     * 
     * @param {string} column
     * @param {string} operator
     * @param {*} value
     */
    where(column, operator, value) {
        if ((_whereClause.get(this)).length > 0) {
            _whereClause.set(
                this,
                [
                    ...(_whereClause.get(this)),
                    `AND ${ column } ${ operator } ?`
                ]
            );
        } else {
            _whereClause.set(
                this,
                [
                    ...(_whereClause.get(this)),
                    `${ column } ${ operator } ?`
                ]
            );
        }

        _whereClauseValues.set(
            this,
            [
                ...(_whereClauseValues.get(this)),
                value
            ]
        )

        return this;
    }

    /**
     * Where clause (OR)
     * 
     * @param {string} column
     * @param {string} operator
     * @param {*} value
     */
    orWhere(column, operator, value) {
        _whereClause.set(
            this,
            [
                ...(_whereClause.get(this)),
                `OR ${ column } ${ operator } ?`
            ]
        );

        _whereClauseValues.set(
            this,
            [
                ...(_whereClauseValues.get(this)),
                value
            ]
        );

        return this;
    }
}