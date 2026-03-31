export default () => ({
  NODE_ENV: process.env.NODE_ENV,
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3005,
  version: process.env.VERSION,
  rabbitmq: {
    url: process.env.RABBITMQ_URI,
    notificationQueue: process.env.RMQ_NOTIFICATION_QUEUE ?? 'notification',
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM,
    preview: process.env.SMTP_PREVIEW === 'true',
  },
});
