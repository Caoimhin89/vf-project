'use strict';
const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
const connect = new AWS.Connect();
const secretsManager = new AWS.SecretsManager();
const uuid = require('uuidv4');
const { s3ObjectExtractor, 
        getContentFromS3Obj,
        isCSV,
        parseCsv,
        genDbAgentParams,
        getAgentPassword,
        normalizeCsvHeaders} = require('./helpers');


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

    // store each agent's password securely in Secrets Manager
    const createSecretRequests = [];
    for(let i = 0; i < jsonRoster.length; i++) {
      const pwdParams = {
        ClientRequestToken: uuid.fromString(new Date().toDateString),
        Description: `password for ${jsonRoster[i].FirstName} ${jsonRoster[i].LastName}`, 
        Name: `${jsonRoster[i].EmailAddress}_Connect_Password`, 
        SecretString: `${jsonRoster[i].Password}`
       };
      
      createSecretRequests.push(secretsManager.createSecret(pwdParams).promise());
    }

    // resolve promises
    try {
      await Promise.all(createSecretRequests);
    } catch(err) {
      console.error('CreateSecret Failed', JSON.stringify(err));
      console.error('RAW', err);

      // FATAL: send failure response
      return {
        statusCode: 500,
        functionError: err
      }
    }

    // put item requests
    const putItemReqs = [];
    for(const agent of jsonRoster) {
      params = genDbAgentParams(process.env.AGENT_ROSTER_TABLE, process.env.CONNECT_ALIAS, agent);
      console.debug('PARAMS', JSON.stringify(params));
      putItemReqs.push(db.put(params).promise());
    }
    try {
      await Promise.all(putItemReqs);
    } catch(err) {
      console.error('SaveToDynamo Failed', JSON.stringify(err));
      console.error('RAW', err);
      // return error
      return {
        statusCode: 500,
        FunctionError: JSON.stringify(err)
      }
    }
  } else {
    params = {
      TableName: process.env.UPLOAD_OBJECT_METADATA_TABLE,
      Item: putObject
    };
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

  console.debug('INSTANCE', JSON.stringify(instance));
  const params = {
    InstanceId: instance.Id
  };

  let securityProfiles;
  try {
    securityProfiles = await connect.listSecurityProfiles({InstanceId: instance.Id}).promise();
  } catch(err) {
    console.error('ListSecurityProfiles Failed', JSON.stringify(err));
    console.error('RAW', err);

    // FATAL: return failure response
    return {
      statusCode: 500,
      functionError: err
    }
  }

  let routingProfiles;
  try {
    routingProfiles = await connect.listRoutingProfiles({InstanceId: instance.Id}).promise();
  } catch(err) {
    console.error('ListRoutingProfiles Failed', JSON.stringify(err));
    console.error('RAW', err);

    // FATAL: return failure response
    return {
      statusCode: 500,
      functionError: err
    }
  }

  let hierarchy;
  try {
    hierarchy = await connect.describeUserHierarchyStructure({InstanceId: instance.Id}).promise();
  } catch(err) {
    console.error('DescribeUserHierarchyStructure Failed', JSON.stringify(err));
    console.error('RAW', err);

    // FATAL: return failure response
    return {
      statusCode: 500,
      functionError: err
    }
  }

  console.debug('HIERARCHY', JSON.stringify(hierarchy));
  const hierarchyIds = Object.keys(hierarchy.HierarchyStructure).map(k => {
    return {
      Id: hierarchy.HierarchyStructure[k].Id,
      Name: hierarchy.HierarchyStructure[k].Name
    }
  });

  for(const record of event.Records) {
    const agent = record.dynamodb.NewImage;
    console.debug('AGENT', JSON.stringify(agent));
    params.PhoneConfig = {
      PhoneType: agent.PhoneConfig.M.PhoneType.S,
      AfterContactWorkTimeLimit: agent.PhoneConfig.M.AfterContactWorkTimeLimit.N,
      AutoAccept: (agent.PhoneConfig.M.AutoAccept.BOOL) ? agent.PhoneConfig.M.AutoAccept.BOOL : 
      (agent.PhoneConfig.M.AutoAccept.S === 'yes') ? true : false,
      DeskPhoneNumber: (agent.PhoneConfig.M.DeskPhoneNumber) ? agent.PhoneConfig.M.DeskPhoneNumber.S : null
    };
    params.RoutingProfileId = (agent.RoutingProfileId.S) ? routingProfiles.RoutingProfileSummaryList.filter(r => r.Name === agent.RoutingProfileId.S)[0].Id : null;
    params.SecurityProfileIds = (agent.SecurityProfileIds.L) ? agent.SecurityProfileIds.L.map(x => securityProfiles.SecurityProfileSummaryList.filter(s => s.Name === x.S)[0].Id) : null;
    params.Username = agent.Username.S;
    params.HierarchyGroupId = (agent.HierarchyGroupId.S && hierarchyIds.length > 0) ? hierarchyIds.filter(h => h.Name === agent.HierarchyGroupId.S)[0].Id : null;
    params.IdentityInfo = {
      Email: agent.IdentityInfo.M.Email.S,
      FirstName: agent.IdentityInfo.M.FirstName.S,
      LastName: agent.IdentityInfo.M.LastName.S
    };
    try {
      params.Password = await getAgentPassword(agent.IdentityInfo.M.Email.S);
    } catch(err) {
      console.error('GetAgentPassword Failed', JSON.stringify(err));
      console.error('RAW', err);
      // FATAL: return error response
      return {
        statusCode: 500,
        functionError: err
      }
    }

    // send createUser request
    console.debug('PARAMS', JSON.stringify(params));
    requests.push(connect.createUser(params).promise());
  }

  // resolve all requests
  let results;
  try {
    results = await Promise.all(requests);
    console.debug('RESULTS', JSON.stringify(results));
  } catch(err) {
    console.error('CreateUsers Failed', JSON.stringify(err));
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