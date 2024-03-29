'use strict';

const jsonResponse = require('../jsonResponse')
const db = require('../db')


exports.retrieveAccountHandler = async (event)  => {

    // input handling
    if (event.httpMethod !== 'GET') {
        return jsonResponse(Error(), null, "Error: this function only accepts GET requests.")
    }
    console.log('received:', JSON.stringify(event));
    const dataAcctID = event.queryStringParameters?.dataAcctID;
    const sk = event.queryStringParameters?.sk;
    if (!(dataAcctID && sk)) {
        console.error("Error: did not receive primary key (dataAcctID & sk.)");
        return jsonResponse(Error(), null, "Error: did not receive primary key (dataAcctID & sk.)");
    }

    // processing
    try {
        let entry = await db.getItemByKey(db, {dataAccountId: dataAcctID, sk: sk,});
        if (entry.processorData.secret) {
            entry.processorData.secret = ""
        }
        return jsonResponse(null, entry, "Successfully retrieved. Note: secret redacted.")
    } catch (err) {
        console.error("DB lookup failed:", err.message);
        return jsonResponse(err, null, "Error retrieving item: " + err.message);
    }
}