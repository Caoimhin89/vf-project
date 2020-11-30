'use strict';
const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();

module.exports.s3ObjectExtractor = (event) => {
  return event.Records[0].s3.object;
};

module.exports.uploadObjectParser = async (event) => {
  const putObject = module.exports.s3ObjectExtractor(event);

  // save upload data to dynamodb
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
