# syntax=docker/dockerfile:1.7
# The cadet portal for the cluster's preview stacks (k3s-homelab, ADR 0010):
# seeded data and the dev sign-in (CADET is Cdt Kian Ashworth), reachable only
# over the tailnet. Production is Vercel and never builds this file.
FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
# PREVIEW_BUILD is inlined at build time and is what lets a production build
# offer the dev sign-in (lib/config.ts devSignInBuild). The API address comes
# from API_INTERNAL_BASE when the pod starts: the portal only calls the API
# from its server, so nothing browser-side needs it.
ENV NEXT_PUBLIC_PREVIEW_BUILD=1 AUTH_SECRET=build-placeholder
RUN npm run build && npm prune --omit=dev

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000
COPY --from=build --chown=node:node /app ./
USER node
EXPOSE 3000
CMD ["node_modules/.bin/next", "start"]
