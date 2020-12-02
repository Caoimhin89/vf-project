const { test, expect } = require('@jest/globals');
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
  const { putObject, putObjectCsv } = testEvents;
  const nonCsvRes = handler.isCSV(putObject);
  const csvRes = handler.isCSV(putObjectCsv);
  expect(nonCsvRes).toBe(false);
  expect(csvRes).toBe(true);
});

test('normalizes csv header names to PascalCase', () => {
  const { csvPayload } = testEvents;
  const expectedHeaders = [
    'FirstName',
    'LastName',
    'EmailAddress',
    'Password',
    'Username',
    'RoutingProfileId',
    'DeskPhoneNumber',
    'PhoneType',
    'HierarchyGroupId',
    'SecurityProfileIds',
    'AutoAccept',
    'AfterContactWorkTimeLimit'];
    const res = handler.normalizeCsvHeaders(csvPayload.split('\n')[0]);
    expect(res.every(h => expectedHeaders.indexOf(h) > -1));
});

test('can create array of agent objects from csv string', async () => {
  const { s3CsvPayload } = testEvents;
  const response = await handler.parseCsv(s3CsvPayload);
  const expectedAttrs = [
    'FirstName',
    'LastName',
    'EmailAddress',
    'Password',
    'Username',
    'RoutingProfileId',
    'DeskPhoneNumber',
    'PhoneType',
    'HierarchyGroupId',
    'SecurityProfileIds',
    'AutoAccept',
    'AfterContactWorkTimeLimit'];
  expect(Array.isArray(response)).toBe(true);
  expect(response.length).toBe(s3CsvPayload.split('\n').length - 1);
  expect(typeof response[0]).toBe('object');
  expect(response.every(agent => Object.keys(agent).every(attr => expectedAttrs.indexOf(attr) > - 1))).toBe(true);
});

test('can generate dynamodb putItem params for an agent object', async () => {
  const { csvPayload } = testEvents;
  const agentArray = await handler.parseCsv(csvPayload);
  const expectedAttrs = [
    'FirstName',
    'LastName',
    'EmailAddress',
    'Password',
    'Username',
    'RoutingProfileId',
    'DeskPhoneNumber',
    'PhoneType',
    'HierarchyGroupId',
    'SecurityProfileIds',
    'AutoAccept',
    'AfterContactWorkTimeLimit'];
  const params = handler.genDbAgentParams('my-instance', agentArray[0]);

  expect(typeof params).toBe('object');
  for(let attr of expectedAttrs) {
    expect(params.Item[attr]).toBeTruthy()
    expect(Object.keys(params.Item).indexOf(attr) > -1).toBe(true);
  }
  expect(params.TableName).toBeTruthy();
});

test('can generate Connect.createUser params from agent object', async () => {
  const { agent } = testEvents;
  const params = handler.genCreateUserParams(agent);
});