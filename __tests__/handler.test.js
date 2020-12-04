const { test, expect } = require('@jest/globals');
const handler = require('../handler');
const helpers = require('../helpers');
const testEvents = require('../test-events');

test('retrieve object data from S3 PutObject event', async () => {
  const { putObject } = testEvents;
  const response = helpers.s3ObjectExtractor(putObject);
  expect(response.key).toBe("test/key");
  expect(response.eTag).toBe("0123456789abcdef0123456789abcdef");
  expect(response.size).toBe(1024);
  expect(response.sequencer).toBe("0A1B2C3D4E5F678901");
});

test('can identify csv file from S3 CreateObject event', async () => {
  const { putObject, putObjectCsv } = testEvents;
  const nonCsvRes = helpers.isCSV(helpers.s3ObjectExtractor(putObject));
  const csvRes = helpers.isCSV(helpers.s3ObjectExtractor(putObjectCsv));
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
    'UserLogin',
    'RoutingProfileName',
    'PhoneNumber',
    'PhoneType',
    'Userhierarchy',
    'SecurityProfileIds',
    'SoftPhoneAutoAccept',
    'AcwTimeout'];
    const res = helpers.normalizeCsvHeaders(csvPayload.split('\n')[0]);
    expect(res.split(',').every(h => expectedHeaders.includes(h))).toBe(true);
});

test('can create array of agent objects from csv string', async () => {
  const { csvPayload } = testEvents;
  const response = await helpers.parseCsv(helpers.normalizeCsvHeaders(csvPayload));
  const expectedAttrs = [
    'FirstName',
    'LastName',
    'EmailAddress',
    'Password',
    'UserLogin',
    'RoutingProfileName',
    'PhoneNumber',
    'PhoneType',
    'Userhierarchy',
    'SecurityProfileIds',
    'SoftPhoneAutoAccept',
    'AcwTimeout'];
  expect(Array.isArray(response)).toBe(true);
  expect(response.length).toBe(csvPayload.split('\n').length - 1);
  expect(typeof response[0]).toBe('object');
  expect(response.every(agent => Object.keys(agent).every(attr => expectedAttrs.indexOf(attr) > - 1))).toBe(true);
});

test('can generate dynamodb putItem params for an agent object', async () => {
  const { csvPayload } = testEvents;
  const agentArray = await helpers.parseCsv(helpers.normalizeCsvHeaders(csvPayload));
  const expectedAttrs = [
    'FirstName',
    'LastName',
    'Email',
    'Username',
    'RoutingProfileId',
    'DeskPhoneNumber',
    'PhoneType',
    'HierarchyGroupId',
    'SecurityProfileIds',
    'AutoAccept',
    'AfterContactWorkTimeLimit'];
  const params = helpers.genDbAgentParams('my-table', 'my-instance', agentArray[0]);

  expect(typeof params).toBe('object');
  for(let attr of expectedAttrs) {
    expect(params.Item[attr] !== 'undefined' || 
    params.Item.IdentityInfo[attr] !== 'undefined' || 
    params.Item.PhoneConfig[attr] !== 'undefined').toBe(true);
  }
  expect(params.TableName).toBe('my-table');
  expect(params.InstanceAlias).toBe('my-instance');
});