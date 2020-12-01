'use-strict';

// event retrieved from Lambda Console
// test > configure test > S3Put
module.exports.putObject = {
    Records: [
      {
        eventVersion: "2.0",
        eventSource: "aws:s3",
        awsRegion: "us-west-2",
        eventTime: "1970-01-01T00:00:00.000Z",
        eventName: "ObjectCreated:Put",
        userIdentity: {
          principalId: "EXAMPLE"
        },
        requestParameters: {
          sourceIPAddress: "127.0.0.1"
        },
        responseElements: {
          "x-amz-request-id": "EXAMPLE123456789",
          "x-amz-id-2": "EXAMPLE123/5678abcdefghijklambdaisawesome/mnopqrstuvwxyzABCDEFGH"
        },
        s3: {
          s3SchemaVersion: "1.0",
          configurationId: "testConfigRule",
          bucket: {
            name: "example-bucket",
            ownerIdentity: {
              principalId: "EXAMPLE"
            },
            arn: "arn:aws:s3:::example-bucket"
          },
          object: {
            key: "test/key",
            size: 1024,
            eTag: "0123456789abcdef0123456789abcdef",
            sequencer: "0A1B2C3D4E5F678901"
          }
        }
      }
    ]
};

module.exports.dynamoStreamCSV = {
    "Records": [
      {
        "eventID": "1",
        "eventVersion": "1.0",
        "dynamodb": {
          "Keys": {
            "key": {
              "S": "agent_roster.csv"
            }
          },
          "NewImage": {
            "key": {
              "S": "agent_roster.csv"
            },
            "sequencer": {
              "N": "ADFJLASJFASJF"
            },
            "content": {
              "S": `first name,last name,email address,password,user login,routing profile name,security_profile_name_1|security_profile_name_2,phone type (soft/desk),phone number,soft phone auto accept (yes/no),ACW timeout (seconds),UserHierarchy
                Roe,Richard,rroe@example.com,F@keP@ssw0rd,rroe,Basic Routing Profile,CallCenterManager,SOFT_PHONE,,yes,30,technical support/IT/Eastern
                Jackson,Mateo,mjackson@example.com,F@keP@ssw0rd,mjackson,Basic Routing Profile,Agent,DESK_PHONE,+12145550198,no,0,technical support/IT/Australia
                Major,Mary,mmajor@example.com,F@keP@ssw0rd,mmajor,Basic Routing Profile,CallCenterManager,DESK_PHONE,+19725550120,no,0,general inquiries`
            }
          },
          "StreamViewType": "NEW_AND_OLD_IMAGES",
          "SequenceNumber": "111",
          "SizeBytes": 26
        },
        "awsRegion": "us-east-1",
        "eventName": "INSERT",
        "eventSourceARN": "arn:aws:dynamodb:us-east-1:account-id:table/ExampleTableWithStream/stream/2015-06-27T00:48:05.899",
        "eventSource": "aws:dynamodb"
      },
      {
        "eventID": "2",
        "eventVersion": "1.0",
        "dynamodb": {
          "OldImage": {
            "Message": {
              "S": "New item!"
            },
            "Id": {
              "N": "101"
            }
          },
          "SequenceNumber": "222",
          "Keys": {
            "Id": {
              "N": "101"
            }
          },
          "SizeBytes": 59,
          "NewImage": {
            "Message": {
              "S": "This item has changed"
            },
            "Id": {
              "N": "101"
            }
          },
          "StreamViewType": "NEW_AND_OLD_IMAGES"
        },
        "awsRegion": "us-east-1",
        "eventName": "MODIFY",
        "eventSourceARN": "arn:aws:dynamodb:us-east-1:account-id:table/ExampleTableWithStream/stream/2015-06-27T00:48:05.899",
        "eventSource": "aws:dynamodb"
      },
      {
        "eventID": "3",
        "eventVersion": "1.0",
        "dynamodb": {
          "Keys": {
            "Id": {
              "N": "101"
            }
          },
          "SizeBytes": 38,
          "SequenceNumber": "333",
          "OldImage": {
            "Message": {
              "S": "This item has changed"
            },
            "Id": {
              "N": "101"
            }
          },
          "StreamViewType": "NEW_AND_OLD_IMAGES"
        },
        "awsRegion": "us-east-1",
        "eventName": "REMOVE",
        "eventSourceARN": "arn:aws:dynamodb:us-east-1:account-id:table/ExampleTableWithStream/stream/2015-06-27T00:48:05.899",
        "eventSource": "aws:dynamodb"
      }
    ]
  };