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