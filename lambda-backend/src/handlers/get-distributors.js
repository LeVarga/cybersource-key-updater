'use strict';
const db = require("../db")
const jsonResponse = require("../jsonResponse")

exports.getDistributorsHandler = async (event)  => {
    if (event.httpMethod !== 'GET') {
        return jsonResponse(Error(), null, "Error: this function only accepts GET requests.")
    }
    console.log('received:', JSON.stringify(event));
    const dataAcctID = event.queryStringParameters?.dataAcctID;
    if (!dataAcctID) {
          return jsonResponse(Error(), null, "Error: did not receive a valid account ID.");
    }

    const dbQuery = {
        TableName: db.tableName,
        KeyConditionExpression: `dataAccountId = :dataAccountId`,
        ExpressionAttributeValues: {
            ":dataAccountId": dataAcctID,
        },
    };
    try {
        const dbResponse = await db.client.query(dbQuery).promise();
        let results = [];
        // TODO: group by sk (or merchant id?)
        dbResponse.Items.forEach((entry) => {
            entry?.matches.forEach((match) => {
                results.push({
                    distID: match.distributorId,
                    merchantID: entry.processorData.externalAccount,
                    lastUpdated: entry?.lastUpdated,
                    sk: entry.sk,
                    active: entry.active});
            });
        });
        if (results.length) return jsonResponse(null, results);
        return jsonResponse(Error(), null, "Could not find any distributors using that client ID.");
    } catch (err) {
        return jsonResponse(err, null, "Error: database query failed.");
    }
}
