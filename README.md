*Big thanks* to @ian0036 for his work in creating a CloudFormatioon Transform for Amazon Connect!!

His repository can be found here: [Link to Repo](https://github.com/iann0036/amazon-connect-cfn)

This is required to be able to deploy the stack with Amazon Connect. It was a little bit outdated, so I forked it and reimplemented the Lambda function to make use of the AWS SDK helper functions for Amazon Connect. That can be found here: [my fork'd version](https://github.com/Caoimhin89/amazon-connect-cfn.git)


# Voice Foundry Assignment

## Objective
To make this more fun, I decided to add a requirement to the project. I'm keeping all the original requirements, but instead of just uploading a nondescript file to S3 and transferring its data to a DynamoDB table, I plan to upload an agent directory CSV to S3 and use that to update an Amazon Connect instance, which I plan to also create in this project.

### Day 1
* Step 1: Created an S3 Bucket & boilerplate for Lambda function
* Step 2: Created a DynamoDB Table
* Step 3: Added a plugin to support object uploads to S3 on deployment
* Step 4: Added Amazon Connect
    * Things started to get tricky here. I found the above-mentioned CloudFormation Transform for Amazon Connect support, but noticed the CloudFormation Stack was failing. I discovered the the reference to the AWS managed policy, AmazonConnectFullAccess, was incorrect (it was probably correct at one time, but AWS updated the name), so I fixed the reference and the stack succeeded. I then returned to my serverless project and ran `sls deploy`. However, the CreateContactFlow step was failed.
    I looked at the source-code and found that the Transform that gave CloudFormation its Amazon Connect support was utilizing a Lambda running headless-chrome via aws-lambda-chrome and puppeteer to actually log into the console and create the Amazon Connect instance. I returned to the repository named above and found that this was already a reported bug. So, I forked the repository and updated the Lambda's code to use the aws-sdk to create the Connect instance and the ContactFlow. However, I soon encountered another obstacle.
    I found a strange bug, which I detailed here (along with what I did to try to resolve the problem): 
        * [StackOverflow](https://stackoverflow.com/questions/65057634/amazon-connect-in-creation-failed-status-after-successful-call-to-createinsta)
    and also reported here:
        * [GitHub Issue Report](https://github.com/aws/aws-sdk-js/issues/3557)
    
    In short, when I called createInstance() via the aws-sdk for nodeJS from the Lambda function, it returned a successful response, but actually failed to create the instance. So this turned out to be the first serious obstacle I needed to overcome to accomplish my goal.