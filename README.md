# aws-lambda-mongodb-backup
A NodeJS project that demonstrates how to make a backup file of a MongoDB database and store the file in a S3 bucket. This project is designed to be executed as an AWS Lambda function.

## Build

```
npm install --save
```

## Test

Zip the project and upload it in your AWS Lambda function.

Then, test the Lambda function with a test event using the format shown below:

```json
{
  "mongoIp" : "Primary Replica IP Address",
  "database" : "Database Name",
  "username" : "Username",
  "passowrd" : "Password",
  "bucket" : "S3 Bucket Name"
}
```

## To Do's:
- Simplify the code for cleaning up a backup file
- Handle irregular error from cleaning up a backup file
- Accept more than 1 MongoDB reaplica IP addresses
- Any other error handling logic

