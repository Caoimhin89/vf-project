'use strict';
const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
const connect = new AWS.Connect();
const { s3ObjectExtractor, 
        getContentFromS3Obj,
        isCSV,
        parseCsv,
        genDbAgentParams} = require('./helpers');


// ------------ LAMBDA FUNCTIONS ---------------------------
module.exports.uploadObjectParser = async (event) => {
  const putObject = s3ObjectExtractor(event);
  const bucketName = event.Records[0].s3.bucket.name;

  // add object data to the payload
  try {
    putObject.content = await getContentFromS3Obj(bucketName, putObject.key)
  } catch (err) {
    return {
      statusCode: 500,
      FunctionError: err
    };
  }

  // prepare db params
  let params;
  if(isCSV(putObject)) {
    const csvRows = putObject.content.split('\n');
    csvRows[0] = normalizeCsvHeaders(csvRows[0]);
    const csv = csvRows.join('\n');
    const jsonRoster = await parseCsv(csv);
    
    params = genDbAgentParams(process.env.AGENT_ROSTER_TABLE, process.env.CONNECT_ALIAS, jsonRoster);
  } else {
    params = {
      TableName = process.env.UPLOAD_OBJECT_METADATA_TABLE,
      Item = putObject
    };
  }

  // save payload to dynamodb
  console.debug('PARAMS', JSON.stringify(params));
  try {
    const res = await db.put(params).promise();
    console.debug('RES', JSON.stringify(res));
  } catch (err) {
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


module.exports.agentRosterManager = async (event) => {
  console.debug('EVENT', JSON.stringify(event));

  const requests = [];
  let instance;
  try {
    const res = await connect.listInstances({}).promise();
    instance = res.InstanceSummaryList.filter(x => x.InstanceAlias === process.env.CONNECT_ALIAS)[0];
  } catch(err) {
    console.error('ListInstances Failed', JSON.stringify(err));
    console.error('RAW', err);

    // FATAL: return failure response
    return {
      statusCode: 500,
      functionError: err
    }
  }

  const params = {
    InstanceId: instance.Id
  };

  for(const record of event.Records) {
    const agent = record.NewImage;
    params.PhoneConfig = {
      PhoneType: agent.PhoneType.S,
      AfterContactWorkTimeLimit: agent.AfterContactWorkTimeLimit.N,
      AutoAccept: agent.AutoAccept.BOOL,
      DeskPhoneNumber: agent.PhoneNumber.S
    };
    params.RoutingProfileId = agent.RoutingProfileName.S;
    params.SecurityProfileIds = agent.SecurityProfiles.S.split('|');
    params.Username = agent.UserLogin.S;
    params.HierarchyGroupId = agent.Hierarchy.S;
    params.IdentityInfo = {
      Email: agent.EmailAddress,
      FirstName: agent.FirstName,
      LastName: agent.LastName
    };
    params.Password = await getAgentPassword(email);

    // send createUser request
    requests.push(connect.createUser(params).promise());
  }

  // resolve all requests
  let results;
  try {
    results = await Promise.all(requests);
  } catch(err) {
    console.error('Create Users Failed', JSON.stringify(err));
    console.error('RAW', err);

    // send failure response
    return {
      statusCode: 500,
      functionError: err
    };
  }

  // send success response
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Success!',
      payload: results
    })
  }
};
