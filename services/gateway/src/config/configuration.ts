export default () => ({
  NODE_ENV: process.env.NODE_ENV,
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 0,
  version: process.env.VERSION,
  rabbitmq: {
    url: process.env.RABBITMQ_URI,
    identityQueue: process.env.RMQ_IDENTITY_QUEUE ?? 'user',
    analyticsQueue: process.env.RMQ_ANALYTICS_QUEUE ?? 'analytics',
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 0,
  },
});
