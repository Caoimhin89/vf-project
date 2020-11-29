const handler = require('../handler');

test('hello, world', async () => {
  const response = await handler.hello();
  expect(JSON.parse(response.body).message).toBe("Hello, world!");
});