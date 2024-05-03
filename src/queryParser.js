
function parseQuery(query) {
    query = query.trim();

    
    const orderByRegex = /\sORDER BY\s(.+)/i;
    const orderByMatch = query.match(orderByRegex);
    let orderByFields = null;
    if (orderByMatch) {
        orderByFields = orderByMatch[1].split(',').map(field => {
            const [fieldName, order] = field.trim().split(/\s+/);
            return { fieldName, order: order ? order.toUpperCase() : 'ASC' };
        });
    }
    query=query.replace(orderByRegex,'');
    
    const groupBySplit = query.split(/\sGROUP BY\s/i);
    const queryWithoutGroupBy = groupBySplit[0];
    let groupByFields = groupBySplit.length > 1 ? groupBySplit[1].trim().split(',').map(field => field.trim()) : null;


    const whereSplit = queryWithoutGroupBy.split(/\sWHERE\s/i);
    const queryWithoutWhere = whereSplit[0];
    const whereClause = whereSplit.length > 1 ? whereSplit[1].trim() : null;

    const joinSplit = queryWithoutWhere.split(/\s(INNER|LEFT|RIGHT) JOIN\s/i);
    const selectPart = joinSplit[0].trim();

    const selectRegex = /^SELECT\s(.+?)\sFROM\s(.+)/i;
    const selectMatch = selectPart.match(selectRegex);
    if (!selectMatch) {
        throw new Error('Invalid SELECT format');
    }

    const [, fields, table] = selectMatch;

    const joinInfo = parseJoinClause(queryWithoutWhere);
    const { joinType, joinTable, joinCondition } = joinInfo;

    let whereClauses = [];
    if (whereClause) {
        whereClauses = parseWhereClause(whereClause);
    }

    const aggregateFunctionRegex = /(\bCOUNT\b|\bAVG\b|\bSUM\b|\bMIN\b|\bMAX\b)\s*\(\s*(\*|\w+)\s*\)/i;
    const hasAggregateWithoutGroupBy = aggregateFunctionRegex.test(query) && !groupByFields;
    console.log(orderByFields);
    return {
        fields: fields.split(',').map(field => field.trim()),
        table: table.trim(),
        whereClauses,
        joinType,
        joinTable,
        joinCondition,
        groupByFields,
        orderByFields, 
        hasAggregateWithoutGroupBy
    };
}



function parseWhereClause(whereString) {
    const conditionRegex = /(.*?)(=|!=|>|<|>=|<=)(.*)/;
    return whereString.split(/ AND | OR /i).map(conditionString => {
        const match = conditionString.match(conditionRegex);
        if (match) {
            const [, field, operator, value] = match;
            return { field: field.trim(), operator, value: value.trim() };
        }
        throw new Error('Invalid WHERE clause format');
    });
}
function parseJoinClause(query) {
    const joinRegex = /\s(INNER|LEFT|RIGHT) JOIN\s(.+?)\sON\s([\w.]+)\s*=\s*([\w.]+)/i;
    const joinMatch = query.match(joinRegex);

    if (joinMatch) {
        return {
            joinType: joinMatch[1].trim(),
            joinTable: joinMatch[2].trim(),
            joinCondition: {
                left: joinMatch[3].trim(),
                right: joinMatch[4].trim()
            }
        };
    }

    return {
        joinType: null,
        joinTable: null,
        joinCondition: null
    };
}

// module.exports = parseQuery;
module.exports = { parseQuery, parseJoinClause };