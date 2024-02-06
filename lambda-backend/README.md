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
$ curl -d '{"id":"f886c285-4c36-499f-b853-5f5f9625df91", "secret":"HyUmdQn8onEvN2yv/QG1+d+EA2d6JLAv+PkXfkpykwM="}' \
-H 'Content-Type: application/json' https://yf6zmmg1j0.execute-api.us-west-1.amazonaws.com/Prod
```
Until updating in db is implemented, this should return "REVERSED" when a valid key id and secret key pair is provided, indicating that a test transaction was successfully made and was subsequently reversed.
       
## Build and test locally

For local development, use an IDE with the AWS Toolkit plugin (WebStorm recommended.)

aws-cli, aws-sam-cli, and docker-desktop need to be installed for it to work.

To run from the IDE add a local AWS Lambda - Local build configuration, within that select "From template" then select the template.yml in root. For input pick the corresponding event for the function from the events folder.


It's also possible to serve the API on localhost using aws-sam-cli like this:
```bash
cybersource-key-updater$ sam local start-api
```
Then test API calls using curl like above, just replace the URL with http://localhost:3000


## Deploy
To deploy simply commit and push to the master branch. AWS will automatically pull and build the latest commit within a few minutes.

Just don't do that before testing your code locally.