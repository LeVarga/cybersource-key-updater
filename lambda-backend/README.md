# Cybersource Key Updater

## Directory contents:
- src/ - All backend source code
  - handlers/ - Lambda function handlers
    - update-secret.js - The main function for updating key/secret pairs.
    - get-distributors.js - Returns the list of distributors using a given client ID.
    - testing.js - Functions for testing including db table initialization and retrieval.
  - paymentApiConfig.js  -  Constructor for a Cybersource API Config object with key+secret and "processorData" from the db as the parameters.
  - paymentRequest.js - Constructor for a Cybersource Payment Request object with default values.
  - db.js - DynamoDB client shared parameters.
  - jsonResponse.js - Constructor for objects to return from function handlers (always use this when returning.)
- events/ - Event definitions to invoke functions (these can be used for testing functions locally, although not required)
- \_\_tests__/ - Unit tests.
- template.yml - AWS resource definitions.
- buildspec.yml -  AWS CodeBuild specification.


## Using the API

### Endpoint

The production endpoint is https://yf6zmmg1j0.execute-api.us-west-1.amazonaws.com/Prod \
/Stage works the same except it has API gateway debug logging to AWS CloudWatch enabled.

### Return Values
All public functions return the following HTTP body in JSON format when invoked:

```json
{
  "error": "dictionary or null",
  "data": "any object",
  "message": "string"
}
```
- error  can be NULL, an empty dictionary, or an Error object (represented as a dictionary). \
When it is NOT NULL (even if empty), that means there was an error. In that case, refer to message for a brief description. \
The error value may or may not contain additional info about the error. Only present it in the UI if specifically requested (such as after clicking a more info button).

- data contains the data returned (if any, and assuming error is NULL). If there was an error, it's set to NULL. If it's empty, that means no data was returned, but the function was successful.

- message will generally contain a string that can be presented to the user in the UI, or in some cases an empty string. \
But it should never be NULL.


### Steps to update keys

#### 1. Determine which client to update
To see the configured account IDs, call /testing?action=scandb (GET)

You can make the API call using in your CLI using curl and parse it with jq (install it using a package manager)
```bash
$ ENDPOINT="https://yf6zmmg1j0.execute-api.us-west-1.amazonaws.com/Prod"
$ curl -s "$ENDPOINT/testing?action=scandb" | jq
```
(You can also do it without jq, but the output will be difficult to read unless you parse the JSON some other way.)

This function is for testing only, do not call it from the main front-end.

#### 2. Call getDistributors
Once you know which client to update, call /getDistributors (GET) with the account ID as the query string parameter "dataAcctID".

Example using curl & jq:
```bash
$ DATAID="130"  #change the value in quotes
$ curl -s "$ENDPOINT/getDistributors?dataAcctID=$DATAID" | jq
```

#### 3. Call updateSecret
 - Pick one of sk (sort key), distributor ID, and client ID combinations from the previous step. 
 - Generate a new payment API key on the CyberSource website.
 - Call /updateSecret (POST)
 - It takes the following parameters in JSON format
   - key (the new one you got from CyberSource)
   - secret (the new one you got from CyberSource)
   - sk (sort key received from getDistributors)
   - distID (distributor ID received from getDistributors)
   - dataAcctID (the client account id you chose to update)

Example using curl & jq (assumes $DATAID and $ENDPOINT set in previous steps):
```bash
$ KEY="efb3de12-e6f8-423a-9b13-8f598643bcfa"              #change the value in quotes
$ SECRET="HyUmdQn8onEvN2yv/mG1+d+EA2d6xLAv+PkXfkpykwM="   #change the value in quotes
$ SORTKEY="3a33e5a0-333b-4651-8a9f-d8d9632714ec"          #change the value in quotes
$ DISTID="LFTX"                                           #change the value in quotes

$ JSON="{\"key\":\"$KEY\", \"secret\":\"$SECRET\", \
\"dataAcctID\":\"$DATAID\", \"distID\":\"$DISTID\", \"sk\":\"$SORTKEY\"}"
# just copy/paste the above two lines together

$ curl -s -d "$JSON" -H 'Content-Type: application/json' $ENDPOINT/updateSecret | jq
```

This should return the message "Successfully updated keys." when correct values were provided, indicating that a test transaction was successfully made, reversed, and the database was updated.
       
## Build and test locally

### General Configuration
For running locally, aws-cli, aws-sam-cli, and docker packages need to be installed.
After installing them run 

```bash
$ aws configure
```
and enter None for access key, None for secret key, us-west-1 for region, and json for output format.

For DB methods to work, you must also start a local DynamoDB instance and create a local table like this:

```bash
$ docker run -d --name "dynamodb" -p 8000:8000 amazon/dynamodb-local -jar DynamoDBLocal.jar -sharedDb -inMemory
$ aws dynamodb create-table --table-name PaymentAccount \ 
--attribute-definitions AttributeName=dataAccountId,AttributeType=S AttributeName=sk,AttributeType=S \
--key-schema AttributeName=dataAccountId,KeyType=HASH AttributeName=sk,KeyType=RANGE \
--provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1 --endpoint-url http://localhost:8000
```

The DB client is configured to automatically connect to the Docker container when running locally.

Once you are running the local API or have your IDE configured, invoke /testing?action=initDB \
to generate some entries for your local database.

### IDE Setup
If you want to invoke functions from an IDE (WebStorm recommended), you need the AWS Toolkit plugin. 

To set up the plugin (after installing), add "AWS Lambda - Local" in build configurations, within that select "From template" then select the template.yml in the project. \
Now you should be able to select a function to invoke.
For input pick the corresponding event for the function from the events directory, editing it where necessary.


### Local API
It's also possible to serve the API on localhost using aws-sam-cli like this:
```bash
$ sam local start-api # run this while inside the lambda-backend directory
```
Then test API calls using curl like above, just change $ENDPOINT to http://localhost:3000


## Deploy
To deploy simply commit and push to the master branch. AWS will automatically pull and start build

Just don't do that before testing your code locally.