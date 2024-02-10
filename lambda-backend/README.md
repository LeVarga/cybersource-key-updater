# Cybersource Key Updater

## Repo contents:
- src/handlers - Lambda API functions code.
- events - Event definitions to invoke functions (use these to run functions in an IDE.)
- \_\_tests__ - Unit tests.
- template.yml - AWS resource definitions.
- buildspec.yml -  AWS CodeBuild specification .
- paymentApiConfig.js  -  Constructor for a Cybersource API Config object with default values and key id + secret parameters.
- paymentRequest.js - Constructor for a Cybersource Payment Request object with default values.

## API Endpoint

The production endpoint is https://yf6zmmg1j0.execute-api.us-west-1.amazonaws.com/Prod

The updateSecret function is mapped to root for POST requests. This is an example call using curl:
```bash
$ curl -d '{"key":"f886c285-4c36-499f-b853-5f5f9625df91", "secret":"HyUmdQn8onEvN2yv/QG1+d+EA2d6JLAv+PkXfkpykwM=", "dataAcctID":"129", "distID":"LFTX"}' \
-H 'Content-Type: application/json' https://yf6zmmg1j0.execute-api.us-west-1.amazonaws.com/Prod
```
This should return "Successfully updated keys." when a valid key and secret pair is provided for the configured merchant ID, indicating that a test transaction was successfully made, reversed, and a DB entry was added.
       
## Build and test locally

For local development, use an IDE with the AWS Toolkit plugin (WebStorm recommended.)

aws-cli, aws-sam-cli, and docker-desktop need to be installed for it to work.
After installing them run 

```bash
$ aws configure
```
and enter None for access key, None for secret key, us-west-1 for region, and json for output format.

For DB methods to work, you must also start a local DynamoDB instance and create a table like this:

```bash
$ docker run -d --name "dynamodb" -p 8000:8000 amazon/dynamodb-local -jar DynamoDBLocal.jar -sharedDb -inMemory
$ aws dynamodb create-table --table-name PaymentAccount \ 
--attribute-definitions AttributeName=dataAccountId,AttributeType=S AttributeName=sk,AttributeType=S \
--key-schema AttributeName=dataAccountId,KeyType=HASH AttributeName=sk,KeyType=RANGE \
--provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1 --endpoint-url http://localhost:8000
```


To run from the IDE add a local AWS Lambda - Local build configuration, within that select "From template" then select the template.yml in the project. For input pick the corresponding event for the function from the events folder.


It's also possible to serve the API on localhost using aws-sam-cli like this:
```bash
$ sam local start-api # run this while inside the lambda-backend directory
```
Then test API calls using curl like above, just replace the URL with http://localhost:3000


## Deploy
To deploy simply commit and push to the master branch. AWS will automatically pull and build the latest commit within a few minutes.

Just don't do that before testing your code locally.