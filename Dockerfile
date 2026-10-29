# syntax=docker/dockerfile:1

FROM docker.io/oven/bun:1.4.4-alpine AS build
WORKDIR /app
COPY . .
RUN bun install --frozen-lockfile
RUN bun run build

FROM docker.io/oven/bun:1.4.4-alpine AS api
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/drizzle ./apps/api/drizzle
COPY --from=build /app/apps/api/drizzle.config.ts ./apps/api/drizzle.config.ts
COPY --from=build /app/apps/api/src/database ./apps/api/src/database
EXPOSE 3001
CMD ["bun", "apps/api/dist/index.js"]

FROM docker.io/oven/bun:1.4.4-alpine AS web
WORKDIR /app/apps/web
ENV NODE_ENV=production
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/web/node_modules ./node_modules
COPY --from=build /app/apps/web/dist ./dist
COPY --from=build /app/apps/web/server.mjs ./server.mjs
COPY --from=build /app/apps/web/package.json ./package.json
EXPOSE 3000
CMD ["bun", "server.mjs"]
