'use strict';

function paymentRequest() {
    const cybersourceRestApi = require("cybersource-rest-client");
    var requestObj = new cybersourceRestApi.CreatePaymentRequest();

    var clientReferenceInformation = new cybersourceRestApi.Ptsv2paymentsClientReferenceInformation();
    clientReferenceInformation.code = 'TC50171_3';
    requestObj.clientReferenceInformation = clientReferenceInformation;

    var processingInformation = new cybersourceRestApi.Ptsv2paymentsProcessingInformation();
    processingInformation.capture = false;

    requestObj.processingInformation = processingInformation;

    var paymentInformation = new cybersourceRestApi.Ptsv2paymentsPaymentInformation();
    var paymentInformationCard = new cybersourceRestApi.Ptsv2paymentsPaymentInformationCard();
    paymentInformationCard.number = '4111111111111111';
    paymentInformationCard.expirationMonth = '12';
    paymentInformationCard.expirationYear = '2031';
    paymentInformation.card = paymentInformationCard;

    requestObj.paymentInformation = paymentInformation;

    var orderInformation = new cybersourceRestApi.Ptsv2paymentsOrderInformation();
    var orderInformationAmountDetails = new cybersourceRestApi.Ptsv2paymentsOrderInformationAmountDetails();
    orderInformationAmountDetails.totalAmount = '50.00';
    orderInformationAmountDetails.currency = 'USD';
    orderInformation.amountDetails = orderInformationAmountDetails;

    var orderInformationBillTo = new cybersourceRestApi.Ptsv2paymentsOrderInformationBillTo();
    orderInformationBillTo.firstName = 'John';
    orderInformationBillTo.lastName = 'Doe';
    orderInformationBillTo.address1 = '1 Market St';
    orderInformationBillTo.locality = 'san francisco';
    orderInformationBillTo.administrativeArea = 'CA';
    orderInformationBillTo.postalCode = '94105';
    orderInformationBillTo.country = 'US';
    orderInformationBillTo.email = 'test@cybs.com';
    orderInformationBillTo.phoneNumber = '4158880000';
    orderInformation.billTo = orderInformationBillTo;

    requestObj.orderInformation = orderInformation;

    return requestObj;
}

module.exports = paymentRequest;