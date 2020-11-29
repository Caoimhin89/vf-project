'use strict';
const uuid = require('uuidv4');
const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();

module.exports.hello = async event => {
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: 'Hello, world!',
        input: event,
      },
      null,
      2
    ),
  };
};

module.exports.s3ObjectExtractor = (event) => {
  return event.Records[0].s3.object;
};

module.exports.uploadObjectParser = async (event) => {
  const putObject = s3ObjectExtractor(event);

  // save upload data to dynamodb
  putObject.id = uuid.fromString(`${putObject.key}-${putObject.sequencer}`);
  const params = {
    TableName: process.env.UPLOAD_OBJECT_METADATA_TABLE,
    Item: putObject
  };
  try {
    const res = await db.put(params).promise();
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
        dynamoHashKey: putObject.id,
        input: event
      },
      null
    )
  };
};
