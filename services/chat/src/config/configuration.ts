export default () => ({
  NODE_ENV: process.env.NODE_ENV,
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 0,
  version: process.env.VERSION,
  database: {
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT
      ? parseInt(process.env.DATABASE_PORT, 10)
      : 0,
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URI,
    analyticsQueue: process.env.RMQ_ANALYTICS_QUEUE ?? "analytics",
  },
});
