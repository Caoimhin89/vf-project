const { test, expect } = require('@jest/globals');
const uuid = require('uuidv4');
const handler = require('../handler');
const testEvents = require('../test-events');

test('retrieve object data from S3 PutObject event', async () => {
  const { putObject } = testEvents;
  const response = await handler.s3ObjectExtractor(putObject);
  expect(response.key).toBe("test/key");
  expect(response.eTag).toBe("0123456789abcdef0123456789abcdef");
  expect(response.size).toBe(1024);
  expect(response.sequencer).toBe("0A1B2C3D4E5F678901");
});

test('can identify csv file from S3 CreateObject event', async () => {

});

test('separate csv file into rows', async () => {

});

test('create array of agent objects from csv rows', async () => {

});

test('generate dynamodb putItem params for an agent object', async () => {

});

test('identify agents from dynamodb stream', async () => {

});

test('generate Connect.createUser params from agent object', async () => {

});

test('generate Connect.associateUserWithInstance params from createAgent response', async () => {

});