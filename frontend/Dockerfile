# Build dependencies
FROM node:18-alpine AS deps

# Add build-time dependency for improved performance with Sharp (image processing)
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files for dependency caching
COPY package.json package-lock.json* ./

# Install dependencies using cache mount for node_modules
RUN --mount=type=cache,target=/root/.npm \
    npm install --prefer-offline --no-audit

# Build the app
FROM node:18-alpine AS builder
WORKDIR /app

# Add runtime dependencies
RUN apk add --no-cache libc6-compat

# Set environment variables
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_ADMIN_PATH
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_ADMIN_PATH=$NEXT_PUBLIC_ADMIN_PATH
ENV NODE_ENV=production

# Copy node_modules first (separate layer for better caching)
COPY --from=deps /app/node_modules ./node_modules

# Copy source files
COPY . .

# Standalone output for better performance
RUN npm run build

# Production image
FROM node:18-alpine AS runner
WORKDIR /app

# Add runtime dependencies and reduce image size
RUN apk add --no-cache libc6-compat && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set production environment
ENV NODE_ENV production

# Copy necessary files from builder (only what's needed)
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Use non-root user for better security
RUN mkdir .next
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
USER nextjs

# Expose port and start
EXPOSE ${FRONTEND_PORT}
CMD ["npm", "start"] 