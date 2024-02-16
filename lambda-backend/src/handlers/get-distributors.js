'use strict';
const db = require("../db")
const jsonResponse = require("../jsonResponse")

exports.getDistributorsHandler = async (event)  => {
    if (event.httpMethod !== 'GET') {
        throw new Error(`This function only accepts GET requests.`);
    }
    console.log('received:', JSON.stringify(event));
    const dataAcctID = event.queryStringParameters?.dataAcctID;
    if (!dataAcctID) return jsonResponse(null, null, "Error: did not receive a valid account ID.");

    const dbQuery = {
        TableName: db.tableName,
        KeyConditionExpression: `dataAccountId = :dataAccountId`,
        ExpressionAttributeValues: {
            ":dataAccountId": dataAcctID,
        },
    };
    try {
        const dbResponse = await db.client.query(dbQuery).promise();
        let results = []
        dbResponse.Items.forEach((entry) => {
            entry?.matches.forEach((match) => {
                results.push(match.distributorId);
            });
        });
        return jsonResponse(null, results, !results ? "Could not find any distributors using that client ID.": "");
    } catch (err) {
        console.log(err.message);
        return jsonResponse(err, null, "Database query failed.");
    }
}
