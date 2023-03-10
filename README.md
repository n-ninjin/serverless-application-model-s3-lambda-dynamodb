## AWS Serverless Application Model: Architecure: S3 -> AWS Lambda -> Amazon DynamoDB
<img width="655" alt="image" src="https://user-images.githubusercontent.com/108375365/223279860-2fdc4485-c59c-4432-98a0-e4029b1d49cd.png">
The Lambda function is triggered by S3 when files are saved. 
The function then reads the S3 object and converts the content, whether it is Text or JSON, into a suitable format for the DynamoDB table. 
Afterwards, the data is uploaded to the DynamoDB table in batches.

## 1. Created Amazon API Gateway : file-upload-api(PUT) | PostMan

### 1.1 API Gateway(file-upload-api)
<img width="862" alt="image" src="https://user-images.githubusercontent.com/108375365/223218052-3c4472a7-6729-4d3d-a40d-42d1b3ad399f.png">

###  1.2 Created PUT(file-upload-api) request on Postman
<img width="1352" alt="image" src="https://user-images.githubusercontent.com/108375365/223301251-c8b1cc8b-ddaa-409b-85bd-18ba16584e4e.png">

##  2. Created AWS Lambda
### 2.1 Lambda (sam-lambda-dynamo-ninjin-v3-HelloWorldFunction)
<img width="878" alt="image" src="https://user-images.githubusercontent.com/108375365/223301618-cc171898-6a6b-4ee4-9857-e3a11010e8b2.png">
<img width="966" alt="image" src="https://user-images.githubusercontent.com/108375365/223301909-32e76a27-adc3-46b2-8bd5-9ef414302bd7.png">



### 3. Running: SAM: Architecure: S3 -> AWS Lambda -> Amazon DynamoDB

#### 3.1 Amazon S3 Bucket

#### 3.1.1input file: txt and json
<img width="1263" alt="image" src="https://user-images.githubusercontent.com/108375365/223301064-388daefc-49dd-4b2f-81ec-65d497012cf1.png">

#### 3.1.2 run fileUpload api from POSTMAN

##### json file
<img width="1192" alt="image" src="https://user-images.githubusercontent.com/108375365/223264802-fe7207a5-21dc-467b-8a26-6b7ef5ab121a.png">

##### txt file
<img width="1176" alt="image" src="https://user-images.githubusercontent.com/108375365/223265417-d8cff848-4148-48fc-91e3-51aa6d0d0493.png">

#### 3.1.3 txt and json file uploaded
**Amazon S3 Bucktets:** sam-s3-file-dynamodb-v3
<img width="1374" alt="image" src="https://user-images.githubusercontent.com/108375365/223282037-966dca44-5893-405d-aed0-40da31ef1a26.png">


#### 3.2 S3 invokes the Lambda (sam-lambda-dynamo-ninjin-v3-HelloWorldFunction) function
1. The Lambda function is triggered by S3 when files are saved. 

2. The function then reads the S3 object and converts the content, whether it is TXT or JSON, into a suitable format for the DynamoDB table. 
  (**txt-file-20230306_200.txt**) | (**json-file-20230306_300.json**)
   
3. Afterwards, the data is uploaded to the table in batches.

#### 3.3 DynamoDB
**DynamoDB table**: sam-lambda-dynamo-ninjin-v3-DDBtable
<img width="1261" alt="image" src="https://user-images.githubusercontent.com/108375365/223280508-f994e3d8-2281-4613-9f93-8b1fc7b28979.png">
<img width="1230" alt="image" src="https://user-images.githubusercontent.com/108375365/223281640-0a42553e-dd3b-45c2-98f4-ba7cbd94a7be.png">


## Project Environment Set-up
This project contains source code and supporting files for a serverless application that you can deploy with the SAM CLI. It includes the following files and folders.

- hello-world - Code for the application's Lambda function and Project Dockerfile.
- events - Invocation events that you can use to invoke the function.
- hello-world/tests - Unit tests for the application code.
- template.yaml - A template that defines the application's AWS resources.

The application uses several AWS resources, including Lambda functions and an API Gateway API. These resources are defined in the `template.yaml` file in this project. You can update the template to add AWS resources through the same deployment process that updates your application code.

## Deploy the sample application

The Serverless Application Model Command Line Interface (SAM CLI) is an extension of the AWS CLI that adds functionality for building and testing Lambda applications. It uses Docker to run your functions in an Amazon Linux environment that matches Lambda. It can also emulate your application's build environment and API.

To use the SAM CLI, you need the following tools.

* Docker - [Install Docker community edition](https://hub.docker.com/search/?type=edition&offering=community)
* SAM CLI - [Install the SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)

You may need the following for local testing.

* Node.js - [Install Node.js 12](https://nodejs.org/en/), including the NPM package management tool.

To build and deploy your application for the first time, run the following in your shell:

```bash
sam build
sam deploy --guided
```

The first command will build a docker image from a Dockerfile and then the source of your application inside the Docker image. The second command will package and deploy your application to AWS, with a series of prompts:

* **Stack Name**: The name of the stack to deploy to CloudFormation. This should be unique to your account and region, and a good starting point would be something matching your project name.
* **AWS Region**: The AWS region you want to deploy your app to.
* **Confirm changes before deploy**: If set to yes, any change sets will be shown to you before execution for manual review. If set to no, the AWS SAM CLI will automatically deploy application changes.
* **Allow SAM CLI IAM role creation**: Many AWS SAM templates, including this example, create AWS IAM roles required for the AWS Lambda function(s) included to access AWS services. By default, these are scoped down to minimum required permissions. To deploy an AWS CloudFormation stack which creates or modifies IAM roles, the `CAPABILITY_IAM` value for `capabilities` must be provided. If permission isn't provided through this prompt, to deploy this example you must explicitly pass `--capabilities CAPABILITY_IAM` to the `sam deploy` command.
* **Save arguments to samconfig.toml**: If set to yes, your choices will be saved to a configuration file inside the project, so that in the future you can just re-run `sam deploy` without parameters to deploy changes to your application.

You can find your API Gateway Endpoint URL in the output values displayed after deployment.

## Use the SAM CLI to build and test locally

Build your application with the `sam build` command.

```bash
sam-ninjin-2023$ sam build
```
<img width="861" alt="image" src="https://user-images.githubusercontent.com/108375365/223218854-12b03083-e6d8-4648-92f5-b1b3c359c6b9.png">

The SAM CLI builds a docker image from a Dockerfile and then installs dependencies defined in `hello-world/package.json` inside the docker image. The processed template file is saved in the `.aws-sam/build` folder.
* **Note**: The Dockerfile included in this sample application uses `npm install` by default. If you are building your code for production, you can modify it to use `npm ci` instead.

Test a single function by invoking it directly with a test event. An event is a JSON document that represents the input that the function receives from the event source. Test events are included in the `events` folder in this project.

Run functions locally and invoke them with the `sam local invoke` command.

```bash
sam-ninjin-2023$ sam local invoke HelloWorldFunction --event events/event.json
```

The SAM CLI can also emulate your application's API. Use the `sam local start-api` to run the API locally on port 3000.

```bash
sam-ninjin-2023$ sam local start-api
sam-ninjin-2023$ curl http://localhost:3000/
```

The SAM CLI reads the application template to determine the API's routes and the functions that they invoke. The `Events` property on each function's definition includes the route and method for each path.

```yaml
      Events:
        HelloWorld:
          Type: Api
          Properties:
            Path: /hello
            Method: get
```

## Add a resource to your application
The application template uses AWS Serverless Application Model (AWS SAM) to define application resources. AWS SAM is an extension of AWS CloudFormation with a simpler syntax for configuring common serverless application resources such as functions, triggers, and APIs. For resources not included in [the SAM specification](https://github.com/awslabs/serverless-application-model/blob/master/versions/2016-10-31.md), you can use standard [AWS CloudFormation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-template-resource-type-ref.html) resource types.

## Fetch, tail, and filter Lambda function logs

To simplify troubleshooting, SAM CLI has a command called `sam logs`. `sam logs` lets you fetch logs generated by your deployed Lambda function from the command line. In addition to printing the logs on the terminal, this command has several nifty features to help you quickly find the bug.

`NOTE`: This command works for all AWS Lambda functions; not just the ones you deploy using SAM.

```bash
sam-ninjin-2023$ sam logs -n HelloWorldFunction --stack-name sam-ninjin-2023 --tail
```

You can find more information and examples about filtering Lambda function logs in the [SAM CLI Documentation](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-logging.html).

## Unit tests

Tests are defined in the `hello-world/tests` folder in this project. Use NPM to install the [Mocha test framework](https://mochajs.org/) and run unit tests from your local machine.

```bash
sam-ninjin-2023$ cd hello-world
hello-world$ npm install
hello-world$ npm run test
```

## Cleanup

To delete the sample application that you created, use the AWS CLI. Assuming you used your project name for the stack name, you can run the following:

```bash
aws cloudformation delete-stack --stack-name sam-ninjin-2023
```

## Resources

See the [AWS SAM developer guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html) for an introduction to SAM specification, the SAM CLI, and serverless application concepts.

Next, you can use AWS Serverless Application Repository to deploy ready to use Apps that go beyond hello world samples and learn how authors developed their applications: [AWS Serverless Application Repository main page](https://aws.amazon.com/serverless/serverlessrepo/)
