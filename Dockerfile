FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS builder
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/
RUN pnpm install --frozen-lockfile
RUN pnpm exec prisma generate
COPY . .
RUN pnpm build
RUN pnpm prune --prod

FROM base AS production
ENV NODE_ENV=production
COPY package.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
RUN pnpm exec prisma generate
EXPOSE 3100
CMD ["node", "dist/src/index.js"]

FROM base AS development
ENV NODE_ENV=development
COPY package.json pnpm-lock.yaml ./
COPY . .
COPY prisma ./prisma/
RUN pnpm install
RUN pnpm exec prisma generate
EXPOSE 3100
CMD ["pnpm", "dev"]

FROM builder AS seed
CMD ["pnpm", "exec", "tsx", "prisma/seed.ts"]
