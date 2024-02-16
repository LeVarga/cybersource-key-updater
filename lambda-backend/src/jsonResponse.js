'use strict';

function corsHeaders(contentType) {
    return {'Content-Type': `${contentType}`,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'}
}

function jsonResponse(error, data=null, message="") {
    return {
        statusCode: error ? 400 : 200,
        headers: corsHeaders('application/json'),
        body: {error: error, data: data, message: message }
    }
}

module.exports = jsonResponse;