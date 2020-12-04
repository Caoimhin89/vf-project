'use strict';
const csvtojson = require('csvtojson');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const secretsManager = new AWS.SecretsManager();

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
  } catch (err) {
    console.error('S3GetObject Failed', JSON.stringify(err));
    console.error('RAW', err);
    throw (err);
  }
};

module.exports.isCSV = (s3Obj) => {
  const len = s3Obj.key.split('.').length;
  return (s3Obj.key.split('.')[len - 1].toLowerCase() === 'csv') ? true : false;
};

module.exports.normalizeCsvHeaders = (headerRow) => {
  const headings = headerRow.split(',');
  const normalizedHeadings = [];
  for (const h of headings) {
    const parts = h.replace(/ *\([^)]*\) */g, "").trim().toLowerCase().split(' ');
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].indexOf('security') > -1) {
        parts[i] = 'SecurityProfileIds';
      } else {
        parts[i] = parts[i].charAt(0).toUpperCase() + parts[i].substring(1);
      }
    }
    normalizedHeadings.push(parts.join('').trim());
  }
  return normalizedHeadings.join(',');
};

module.exports.parseCsv = async (csvString) => {
  return await csvtojson().fromString(csvString);
};

module.exports.genDbAgentParams = (tableName, instanceAlias, agent) => {
  return ({
    TableName: tableName,
    InstanceAlias: instanceAlias,
    Item: {
      Email: agent.EmailAddress,
      PhoneConfig: {
        PhoneType: agent.PhoneType,
        AfterContactWorkTimeLimit: agent.AcwTimeout,
        AutoAccept: agent.SoftPhoneAutoAccept,
        DeskPhoneNumber: agent.PhoneNumber
      },
      RoutingProfileId: agent.RoutingProfileName,
      SecurityProfileIds: agent.SecurityProfileIds.split('|'),
      Username: agent.UserLogin,
      HierarchyGroupId: agent.Userhierarchy,
      IdentityInfo: {
        Email: agent.EmailAddress,
        FirstName: agent.FirstName,
        LastName: agent.LastName
      }
    }
  });
};

module.exports.getAgentPassword = async (email) => {
  const credParams = {
    SecretId: `${email}_Connect_Password`
  };
  
  try {
    const res = await secretsManager.getSecretValue(credParams).promise();
    return res.SecretString;
  } catch(err) {
    console.error('GetSecretValue Failed', JSON.stringify(err));
    console.error('RAW', err);
    throw err;
  }
};
