# Stage 1: Builder
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package files
COPY backend/package*.json ./
COPY backend/prisma ./prisma

# Install dependencies (using npm install to handle lock file sync)
RUN npm install

# Copy source code
COPY backend/ .

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build

# Verify build output exists (NestJS generates dist/src/main.js)
RUN test -f dist/src/main.js || (echo "ERROR: dist/src/main.js not found after build" && exit 1)

# Stage 2: Runner
FROM node:24-alpine AS runner

WORKDIR /app

# Create non-root user
RUN addgroup -S nestjs && \
    adduser -S -G nestjs nestjs

# Copy package files
COPY backend/package*.json ./
COPY backend/prisma ./prisma
COPY backend/tsconfig.seed.json ./tsconfig.seed.json

# Install production dependencies and Prisma CLI
RUN npm install --only=production && \
    npm install prisma --save-dev && \
    npm cache clean --force

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Verify dist/src/main.js exists in runner stage
RUN test -f dist/src/main.js || (echo "ERROR: dist/src/main.js not found in runner stage" && exit 1)

# Change ownership
RUN chown -R nestjs:nestjs /app

USER nestjs

EXPOSE 4000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/src/main.js"]

