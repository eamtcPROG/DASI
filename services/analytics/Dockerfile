# Build context must be services/ (compose file dir). All COPY from analytics/ so we never pull another service.
FROM node:alpine AS builder

WORKDIR /app

COPY analytics/package.json analytics/package-lock.json* ./
RUN npm ci

COPY analytics/src ./src
COPY analytics/tsconfig.json analytics/tsconfig.build.json analytics/nest-cli.json ./
RUN grep -rq "TypeOrmModule\|typeorm" src/ 2>/dev/null && (echo "FATAL: TypeORM in analytics source" && exit 1) || true
RUN npm run build

FROM node:alpine AS production

ENV NODE_ENV=production

WORKDIR /app

COPY analytics/package.json analytics/package-lock.json* ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

CMD ["node", "dist/main.js"]
