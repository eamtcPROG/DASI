export default () => ({
  NODE_ENV: process.env.NODE_ENV,
  version: process.env.VERSION ?? '1.0.0',
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3004,
  mongodb: {
    uri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/analytics',
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URI,
    queue: process.env.RMQ_ANALYTICS_QUEUE ?? 'analytics',
  },
});
