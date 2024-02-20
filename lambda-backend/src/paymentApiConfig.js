'use strict';

function paymentApiConfig(newKey, newSecret, pd) {
    return {
        'authenticationType': pd.authenticationType,
        'runEnvironment': pd.runEnvironment,

        'merchantID': pd.externalAccount,
        'merchantKeyId': newKey,
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