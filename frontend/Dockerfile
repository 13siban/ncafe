# Stage 1: Install dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./ 
RUN npm install --legacy-peer-deps

# Stage 2: Build the application
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED 1

# PortOne build arguments
ARG NEXT_PUBLIC_PORTONE_STORE_ID
ARG NEXT_PUBLIC_PORTONE_KAKAOPAY_CHANNEL_KEY
ARG NEXT_PUBLIC_PORTONE_NAVERPAY_CHANNEL_KEY
ARG NEXT_PUBLIC_PORTONE_INICIS_CHANNEL_KEY

ENV NEXT_PUBLIC_PORTONE_STORE_ID=$NEXT_PUBLIC_PORTONE_STORE_ID
ENV NEXT_PUBLIC_PORTONE_KAKAOPAY_CHANNEL_KEY=$NEXT_PUBLIC_PORTONE_KAKAOPAY_CHANNEL_KEY
ENV NEXT_PUBLIC_PORTONE_NAVERPAY_CHANNEL_KEY=$NEXT_PUBLIC_PORTONE_NAVERPAY_CHANNEL_KEY
ENV NEXT_PUBLIC_PORTONE_INICIS_CHANNEL_KEY=$NEXT_PUBLIC_PORTONE_INICIS_CHANNEL_KEY

# Build the Next.js application
RUN npm run build

# Stage 3: Production runner
FROM node:20-alpine AS runner
WORKDIR /app

# [수정] 헬스체크 및 디버깅용 curl, Sharp 네이티브 의존성 설치
RUN apk add --no-cache curl vips-dev

ENV NODE_ENV production
# Disable telemetry during runtime
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public

# Set permissions for prerender cache (though standalone handles static files)
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy standalone build artifacts
# The standalone folder contains the server and necessary node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Sharp: standalone 빌드에 네이티브 모듈이 누락될 수 있으므로 builder에서 복사
COPY --from=builder /app/node_modules/sharp ./node_modules/sharp
COPY --from=builder /app/node_modules/@img ./node_modules/@img

USER nextjs

EXPOSE 3000

ENV PORT 3000
# set hostname to localhost
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
