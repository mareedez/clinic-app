FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./
RUN npm ci --only=production && \
    npm install -g tsx && \
    npx prisma generate && \
    npm cache clean --force
COPY --from=builder /app/dist ./dist
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
CMD node -e "require('http').get('http://localhost:4000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Явно передаем переменную DATABASE_URL в аргументы команды
CMD sh -c "echo DATABASE_URL=\$DATABASE_URL > .env && npx prisma migrate deploy && tsx prisma/seed.ts && node dist/index.js"