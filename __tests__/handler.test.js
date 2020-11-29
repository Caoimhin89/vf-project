const { test, expect } = require('@jest/globals');
const handler = require('../handler');
const testEvents = require('../test-events');

test('hello, world', async () => {
  const response = await handler.hello();
  expect(JSON.parse(response.body).message).toBe("Hello, world!");
});

test('retrieve key from S3 PutObject', async () => {
  const { s3PutObject } = testEvents;
  const response = await handler.uploadParser(s3PutObject);
  expect(JSON.parse(response.body).message.objectKey).toBe("test/key");
});