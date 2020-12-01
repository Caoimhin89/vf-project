'use strict';
const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

// ------------- HELPER FUNCTIONS -----------------

module.exports.s3ObjectExtractor = (event) => {
  return event.Records[0].s3.object;
};

module.exports.getContentFromS3Obj = async (bucket, key) => {
  const params = {
    Bucket: bucket,
    Key: key
  };

  try {
    const res = await s3.getObject(params).promise();
    return res.Body.toString('utf-8');
  } catch(err) {
    console.error('S3GetObject Failed', JSON.stringify(err));
    console.error('RAW', err);
    throw(err);
  }
};


// Lambda Function
module.exports.uploadObjectParser = async (event) => {
  const putObject = module.exports.s3ObjectExtractor(event);
  const bucketName = event.Records[0].s3.bucket.name;

  // add object data to the payload
  try {
    putObject.content = await module.exports.getContentFromS3Obj(bucketName, putObject.key)
  } catch(err) {
    return {
      statusCode: 500,
      FunctionError: err
    };
  }

  // save payload to dynamodb
  const params = {
    TableName: process.env.UPLOAD_OBJECT_METADATA_TABLE,
    Item: putObject
  };
  console.debug('PARAMS', JSON.stringify(params));
  try {
    const res = await db.put(params).promise();
    console.debug('RES', JSON.stringify(res));
  } catch(err) {
    console.error('SaveToDynamo Failed', JSON.stringify(err));
    console.error('RAW', err);

    // return error
    return {
      statusCode: 500,
      FunctionError: JSON.stringify(err)
    }
  }

  // return success
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: putObject,
        input: event
      },
      null
    )
  };
};
