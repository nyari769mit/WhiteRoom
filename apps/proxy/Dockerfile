FROM node:22-slim AS base
RUN corepack enable pnpm

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages/shared/package.json packages/shared/
COPY packages/engine/package.json packages/engine/
COPY packages/llm-clients/package.json packages/llm-clients/
COPY packages/db/package.json packages/db/
COPY apps/proxy/package.json apps/proxy/
RUN pnpm install --frozen-lockfile --prod=false

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/packages/engine/node_modules ./packages/engine/node_modules
COPY --from=deps /app/packages/llm-clients/node_modules ./packages/llm-clients/node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=deps /app/apps/proxy/node_modules ./apps/proxy/node_modules
COPY . .
RUN pnpm --filter @whiteroom/shared build && \
    pnpm --filter @whiteroom/engine build && \
    pnpm --filter @whiteroom/llm-clients build && \
    pnpm --filter @whiteroom/db build && \
    pnpm --filter @whiteroom/proxy build

FROM base AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/shared/package.json ./packages/shared/
COPY --from=build /app/packages/engine/dist ./packages/engine/dist
COPY --from=build /app/packages/engine/package.json ./packages/engine/
COPY --from=build /app/packages/llm-clients/dist ./packages/llm-clients/dist
COPY --from=build /app/packages/llm-clients/package.json ./packages/llm-clients/
COPY --from=build /app/packages/db/dist ./packages/db/dist
COPY --from=build /app/packages/db/package.json ./packages/db/
COPY --from=build /app/apps/proxy/dist ./apps/proxy/dist
COPY --from=build /app/apps/proxy/package.json ./apps/proxy/
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/proxy/node_modules ./apps/proxy/node_modules
COPY --from=deps /app/packages/llm-clients/node_modules ./packages/llm-clients/node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules
COPY package.json pnpm-workspace.yaml ./

EXPOSE 8080
CMD ["node", "apps/proxy/dist/index.js"]
