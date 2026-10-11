# Stage 1: Install ALL dependencies & build
FROM node:20-alpine AS builder
RUN npm install -g pnpm@9
WORKDIR /app

# Copy everything and install
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/ packages/
COPY apps/api/ apps/api/

# Install all deps (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN pnpm --filter @nextpik/database prisma:generate

# Build the API
RUN pnpm --filter @nextpik/api build

# Stage 2: Production runner
FROM node:20-alpine AS runner
RUN npm install -g pnpm@9
RUN apk add --no-cache curl
WORKDIR /app

# Copy the full workspace (with node_modules intact)
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/packages/shared ./packages/shared

EXPOSE 4000

CMD ["node", "apps/api/dist/main.js"]
