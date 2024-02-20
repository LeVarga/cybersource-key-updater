'use strict';

function paymentApiConfig(newID, newSecret, newMerchantID) {
    return {
        'authenticationType': 'http_signature',
        'runEnvironment': 'apitest.cybersource.com',

        'merchantID': newMerchantID,
        'merchantKeyId': newID,
        'merchantsecretKey': newSecret,

        'logConfiguration': {
            'enableLog': false,
            'logFileName': 'cybs',
            'logDirectory': 'log',
            'logFileMaxSize': '5242880',
            'loggingLevel': 'debug',
            'enableMasking': true
        }
    };
}

module.exports = paymentApiConfig;