# Build context must be this directory (services/analytics). See docker-compose: context ./analytics.
FROM node:alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY src ./src
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
RUN grep -rq "TypeOrmModule\|typeorm" src/ 2>/dev/null && (echo "FATAL: TypeORM in analytics source" && exit 1) || true
RUN npm run build

FROM node:alpine AS production

ENV NODE_ENV=production

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

CMD ["node", "dist/main.js"]
