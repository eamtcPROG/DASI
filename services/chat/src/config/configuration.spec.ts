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

  it('defaults analytics queue name', () => {
    delete process.env.RMQ_ANALYTICS_QUEUE;

    const config = configuration();

    expect(config.rabbitmq.analyticsQueue).toBe('analytics');
  });
});
