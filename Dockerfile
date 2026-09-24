# ---- deps ---------------------------------------------------------------
FROM node:24-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* .npmrc ./
RUN npm ci

# ---- build --------------------------------------------------------------
FROM node:24-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- runtime ------------------------------------------------------------
FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    DATA_DIR=/data

# The SQLite database MUST live on a persistent volume mounted at /data.
VOLUME ["/data"]

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public

EXPOSE 3000
CMD ["npm", "run", "start"]
