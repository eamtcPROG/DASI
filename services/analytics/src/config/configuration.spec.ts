import configuration from './configuration';

describe('configuration', () => {
  const original = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...original };
  });

  afterAll(() => {
    process.env = original;
  });

  it('applies default port, mongodb uri, and rabbitmq queue', () => {
    delete process.env.PORT;
    delete process.env.MONGODB_URI;
    delete process.env.RMQ_ANALYTICS_QUEUE;

    const config = configuration();

    expect(config.port).toBe(3004);
    expect(config.mongodb.uri).toBe('mongodb://localhost:27017/analytics');
    expect(config.rabbitmq.queue).toBe('analytics');
  });
});
