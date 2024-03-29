'use strict';

function corsHeaders(contentType) {
    return {'Content-Type': `${contentType}`,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'}
}

function jsonResponse(error, data=null, message="") {
    if (error) console.error(message, error.message)
    return {
        statusCode: error ? 400 : 200,
        headers: corsHeaders('application/json'),
        body: JSON.stringify({error: error, data: data, message: message})
    }
}

module.exports = jsonResponse;