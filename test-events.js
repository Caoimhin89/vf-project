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

module.exports.putObjectCsv = {
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
          key: "agents.csv",
          size: 1024,
          eTag: "0123456789abcdef0123456789abcdef",
          sequencer: "0A1B2C3D4E5F678901"
        }
      }
    }
  ]
};

module.exports.csvPayload = `first name,last name,email address,password,user login,routing profile name,security_profile_name_1|security_profile_name_2,phone type (soft/desk),phone number,soft phone auto accept (yes/no),ACW timeout (seconds),UserHierarchy
Roe,Richard,rroe@example.com,F@keP@ssw0rd,rroe,Basic Routing Profile,CallCenterManager,SOFT_PHONE,,yes,30,technical support/IT/Eastern
Jackson,Mateo,mjackson@example.com,F@keP@ssw0rd,mjackson,Basic Routing Profile,Agent,DESK_PHONE,+12145550198,no,0,technical support/IT/Australia
Major,Mary,mmajor@example.com,F@keP@ssw0rd,mmajor,Basic Routing Profile,CallCenterManager,DESK_PHONE,+19725550120,no,0,general inquiries`;

module.exports.dynamoStreamAgents = {
  "Records": [
      {
          "eventID": "9cf749913c85e752d724d15c8f48a32e",
          "eventName": "INSERT",
          "eventVersion": "1.1",
          "eventSource": "aws:dynamodb",
          "awsRegion": "us-east-1",
          "dynamodb": {
              "ApproximateCreationDateTime": 1607029145,
              "Keys": {
                  "Email": {
                      "S": "kevin.n.glick@gmail.com"
                  }
              },
              "NewImage": {
                  "Email": {
                      "S": "kevin.n.glick@gmail.com"
                  },
                  "PhoneConfig": {
                      "M": {
                          "AutoAccept": {
                              "S": "yes"
                          },
                          "PhoneType": {
                              "S": "SOFT_PHONE"
                          },
                          "DeskPhoneNumber": {
                              "S": ""
                          },
                          "AfterContactWorkTimeLimit": {
                              "S": "30"
                          }
                      }
                  },
                  "RoutingProfileId": {
                      "S": "Basic Routing Profile"
                  },
                  "Username": {
                      "S": "kglick"
                  },
                  "HierarchyGroupId": {
                      "S": "technical support/IT/Eastern"
                  },
                  "IdentityInfo": {
                      "M": {
                          "Email": {
                              "S": "kevin.n.glick@gmail.com"
                          },
                          "FirstName": {
                              "S": "Kevin"
                          },
                          "LastName": {
                              "S": "Glick"
                          }
                      }
                  },
                  "SecurityProfileIds": {
                      "L": [
                          {
                              "S": "CallCenterManager"
                          }
                      ]
                  }
              },
              "SequenceNumber": "100000000004455250152",
              "SizeBytes": 355,
              "StreamViewType": "NEW_AND_OLD_IMAGES"
          },
          "eventSourceARN": "arn:aws:dynamodb:us-east-1:029298648981:table/voicefoundry-agent-roster-table/stream/2020-12-03T20:31:21.182"
      },
      {
          "eventID": "f51242c4e45c260e2664ce3a657caf22",
          "eventName": "INSERT",
          "eventVersion": "1.1",
          "eventSource": "aws:dynamodb",
          "awsRegion": "us-east-1",
          "dynamodb": {
              "ApproximateCreationDateTime": 1607029145,
              "Keys": {
                  "Email": {
                      "S": "my@fakeemail.com"
                  }
              },
              "NewImage": {
                  "Email": {
                      "S": "my@fakeemail.com"
                  },
                  "PhoneConfig": {
                      "M": {
                          "AutoAccept": {
                              "S": "no"
                          },
                          "PhoneType": {
                              "S": "DESK_PHONE"
                          },
                          "DeskPhoneNumber": {
                              "S": "+12162823930"
                          },
                          "AfterContactWorkTimeLimit": {
                              "S": "0"
                          }
                      }
                  },
                  "RoutingProfileId": {
                      "S": "Basic Routing Profile"
                  },
                  "Username": {
                      "S": "cglick"
                  },
                  "HierarchyGroupId": {
                      "S": "general inquiries"
                  },
                  "IdentityInfo": {
                      "M": {
                          "Email": {
                              "S": "my@fakeemail.com"
                          },
                          "FirstName": {
                              "S": "Caoimhin"
                          },
                          "LastName": {
                              "S": "Glick"
                          }
                      }
                  },
                  "SecurityProfileIds": {
                      "L": [
                          {
                              "S": "CallCenterManager"
                          }
                      ]
                  }
              },
              "SequenceNumber": "200000000004455250190",
              "SizeBytes": 336,
              "StreamViewType": "NEW_AND_OLD_IMAGES"
          },
          "eventSourceARN": "arn:aws:dynamodb:us-east-1:029298648981:table/voicefoundry-agent-roster-table/stream/2020-12-03T20:31:21.182"
      }
  ]
};