
const {parseQuery} = require('./queryParser');
const readCSV = require('./csvReader');

async function executeSELECTQuery(query) {
    const { fields, table, whereClauses, joinType, joinTable, joinCondition } = parseQuery(query);
    let data = await readCSV(`${table}.csv`);

    if (joinTable && joinCondition) {
        const joinData = await readCSV(`${joinTable}.csv`);
        switch (joinType.toUpperCase()) {
            case 'INNER':
                data = performInnerJoin(data, joinData, joinCondition, fields, table);
                break;
            case 'LEFT':
                data = performLeftJoin(data, joinData, joinCondition, fields, table);
                break;
            case 'RIGHT':
                data = performRightJoin(data, joinData, joinCondition, fields, table);
                break;
            // Handle default case or unsupported JOIN types
        }
    }

    // Apply WHERE clause filtering
    const filteredData = whereClauses.length > 0
        ? data.filter(row => whereClauses.every(clause => {
            // You can expand this to handle different operators
            return evaluateCondition(row,clause);
        }))
        : data;

    // Select the specified fields
    return filteredData.map(row => {
        const selectedRow = {};
        fields.forEach(field => {
            selectedRow[field] = row[field];
        });
        return selectedRow;
    });
}
function evaluateCondition(row, clause) {
    const { field, operator, value } = clause;
    switch (operator) {
        case '=': return row[field] === value;
        case '!=': return row[field] !== value;
        case '>': return row[field] > value;
        case '<': return row[field] < value;
        case '>=': return row[field] >= value;
        case '<=': return row[field] <= value;
        default: throw new Error(`Unsupported operator: ${operator}`);
    }
}


// Helper functions for different JOIN types
function performInnerJoin(data,joinData, joinCondition, fields, table) {
    data = data.flatMap(mainRow => {
        return joinData
            .filter(joinRow => {
                const mainValue = mainRow[joinCondition.left.split('.')[1]];
                const joinValue = joinRow[joinCondition.right.split('.')[1]];
                return mainValue === joinValue;
            })
            .map(joinRow => {
                return fields.reduce((acc, field) => {
                    const [tableName, fieldName] = field.split('.');
                    acc[field] = tableName === table ? mainRow[fieldName] : joinRow[fieldName];
                    return acc;
                }, {});
            });
    });
    return data;
}

function performLeftJoin(data, joinData, joinCondition, fields, table) {
    return data.map(mainRow => {
        const joinRows = joinData.filter(joinRow => {
            const mainValue = mainRow[joinCondition.left.split('.')[1]];
            const joinValue = joinRow[joinCondition.right.split('.')[1]];
            return mainValue === joinValue;
        });

        if (joinRows.length === 0) {
            return fields.reduce((acc, field) => {
                const [tableName, fieldName] = field.split('.');
                acc[field] = tableName === table ? mainRow[fieldName] : null;
                return acc;
            }, {});
        }

        return joinRows.map(joinRow => {
            return fields.reduce((acc, field) => {
                const [tableName, fieldName] = field.split('.');
                acc[field] = tableName === table ? mainRow[fieldName] : joinRow[fieldName];
                return acc;
            }, {});
        });
    }).flat();
}
function performRightJoin(/* parameters */) {
    // Logic for RIGHT JOIN
    // ...
}
module.exports = executeSELECTQuery;