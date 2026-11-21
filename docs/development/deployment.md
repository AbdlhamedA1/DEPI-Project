# Production Deployment & Containerization Architecture

- **Platform**: Sakany Student Housing Platform (منصة سكن الطلاب في مصر)
- **Specification Document**: Phase 3 Technical Design & Developer Guides
- **Document Path**: `docs/development/deployment.md`
- **Target Infrastructure**: Docker, Linux (Ubuntu/Debian Alpine), PostgreSQL 16 Managed Cloud, Next.js Standalone
- **Monorepo Architecture**: TypeScript Modular Monolith (`@repo/*`)

---

## 1. Containerization Architecture

The platform uses hardened, multi-stage Docker builds to produce lightweight, minimal, production-ready container images. Multi-stage builds ensure that build dependencies, development tools, and intermediate TypeScript compiler artifacts never enter the final runtime images.

```
+-----------------------------------------------------------------------------------------------+
|                                MULTI-STAGE DOCKER ARCHITECTURE                                |
+-----------------------------------------------------------------------------------------------+
| Stage 1: Base Alpine         --> Node.js 24 Alpine runtime + libc6-compat                     |
| Stage 2: Dependencies (Deps) --> Install all root and workspace dependencies (npm ci)        |
| Stage 3: Builder             --> Compile TypeScript (@repo/* packages, apps/api, apps/web)    |
| Stage 4: Production Runner   --> Minimal Alpine image + non-root 'node' user + compiled dist  |
+-----------------------------------------------------------------------------------------------+
```

---

### 1.1 Backend API Dockerfile (`infrastructure/docker/Dockerfile.api`)

The NestJS backend runs as an unprivileged `node` user on Alpine Linux. Only production dependencies and compiled JavaScript in `dist/` are included:

```dockerfile
# ==============================================================================
# STAGE 1: Base Runtime Environment
# ==============================================================================
FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ==============================================================================
# STAGE 2: Dependency Resolution
# ==============================================================================
FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-config/package.json ./packages/shared-config/
COPY packages/validation/package.json ./packages/validation/
COPY packages/api-client/package.json ./packages/api-client/

RUN npm ci --omit=dev=false

# ==============================================================================
# STAGE 3: Build & Compilation
# ==============================================================================
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production

# Compile internal workspace packages first
RUN npm run build:packages

# Compile NestJS API application
RUN npm run build -w @repo/api

# Prune development dependencies for minimal production footprint
RUN npm prune --omit=dev

# ==============================================================================
# STAGE 4: Production Runtime
# ==============================================================================
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3001

# Security: Run as unprivileged node user
USER node

# Copy minimal production runtime artifacts
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=node:node /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder --chown=node:node /app/packages ./packages

EXPOSE 3001
CMD ["node", "apps/api/dist/main.js"]
```

---

### 1.2 Frontend Next.js Dockerfile (`infrastructure/docker/Dockerfile.web`)

The Next.js frontend uses standalone output mode (`output: 'standalone'`), producing a self-contained Node.js server with minimal image size (~120MB):

```dockerfile
# ==============================================================================
# STAGE 1: Base Runtime Environment
# ==============================================================================
FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ==============================================================================
# STAGE 2: Dependency Resolution
# ==============================================================================
FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-config/package.json ./packages/shared-config/
COPY packages/validation/package.json ./packages/validation/
COPY packages/api-client/package.json ./packages/api-client/

RUN npm ci --omit=dev=false

# ==============================================================================
# STAGE 3: Build & Standalone Optimization
# ==============================================================================
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Compile shared dependencies
RUN npm run build:packages

# Build Next.js application with standalone output
RUN npm run build -w @repo/web

# ==============================================================================
# STAGE 4: Production Runtime
# ==============================================================================
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

USER node

# Copy public static assets and standalone server
COPY --from=builder --chown=node:node /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=builder --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
```

---

### 1.3 Container Orchestration (`infrastructure/docker/docker-compose.yml`)

The root `docker-compose.yml` provides local and staging orchestration for all three core services (PostgreSQL, NestJS API, and Next.js Web):

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: sakany_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USERNAME:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
      POSTGRES_DB: ${DB_DATABASE:-student_housing}
    ports:
      - '${DB_PORT:-5432}:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test:
        ['CMD-SHELL', 'pg_isready -U ${DB_USERNAME:-postgres} -d ${DB_DATABASE:-student_housing}']
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - sakany_network

  api:
    build:
      context: ../..
      dockerfile: infrastructure/docker/Dockerfile.api
    container_name: sakany_api
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      NODE_ENV: ${NODE_ENV:-development}
      PORT: ${API_PORT:-3001}
      DATABASE_URL: postgresql://${DB_USERNAME:-postgres}:${DB_PASSWORD:-postgres}@postgres:5432/${DB_DATABASE:-student_housing}?schema=public
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      SMS_GATEWAY_PROVIDER: ${SMS_GATEWAY_PROVIDER:-MOCK}
      STORAGE_DRIVER: ${STORAGE_DRIVER:-LOCAL}
    ports:
      - '${API_PORT:-3001}:${API_PORT:-3001}'
    volumes:
      - ../../uploads:/app/uploads
    networks:
      - sakany_network

  web:
    build:
      context: ../..
      dockerfile: infrastructure/docker/Dockerfile.web
    container_name: sakany_web
    restart: unless-stopped
    depends_on:
      - api
    environment:
      NODE_ENV: ${NODE_ENV:-development}
      PORT: ${WEB_PORT:-3000}
      NEXT_PUBLIC_API_URL: http://api:${API_PORT:-3001}/api/v1
      NEXT_PUBLIC_DEFAULT_LOCALE: ar
    ports:
      - '${WEB_PORT:-3000}:${WEB_PORT:-3000}'
    networks:
      - sakany_network

volumes:
  postgres_data:
    driver: local

networks:
  sakany_network:
    driver: bridge
```

---

## 2. Staging vs Production Deployment Architecture

The platform enforces strict segregation between staging and production environments to preserve stability, data security, and compliance with Egyptian student privacy standards.

| Architectural Component   | Staging Environment                                            | Production Environment                                                 |
| ------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **Domain & URLs**         | `https://staging.sakany.eg`<br>`https://staging-api.sakany.eg` | `https://sakany.eg`<br>`https://api.sakany.eg`                         |
| **Compute Topology**      | Single container per tier (Docker on Linux VM / Cloud Run)     | Multi-instance autoscaling cluster behind Application Load Balancer    |
| **Database Architecture** | Burstable managed PostgreSQL 16 (single zone)                  | High-Availability (HA) Multi-AZ PostgreSQL 16 cluster + Read Replicas  |
| **Connection Pooling**    | Direct connections (max pool size: 20)                         | PgBouncer connection pooler (handles 1000+ concurrent clients)         |
| **SMS Gateway Mode**      | `SANDBOX` / `MOCK` (Logs OTP to console / mock aggregator)     | Live Egyptian SMS Aggregator with sender ID `Sakany`                   |
| **Cloudinary Assets**     | Separate staging cloud folder (`/staging/properties/`)         | Production CDN delivery with eager responsive transforms               |
| **KYC Document Storage**  | Encrypted staging cloud bucket with test ID scans              | Private S3/GCS bucket with client-side AES-256 encryption & strict IAM |
| **SSL / TLS Termination** | Let's Encrypt automated TLS certificates                       | Wildcard TLS 1.3 certificates via Cloudflare / Managed Load Balancer   |
| **CI/CD Deployment**      | Automated deployment on merge to `staging` branch              | Manual approval gate on merge to `main` branch                         |

---

## 3. Production Environment Variables Reference

Below is the canonical list of environment variables required in production environments:

| Variable                          | Type    | Production Value Guideline                                                             | Security Note                                               |
| --------------------------------- | ------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `NODE_ENV`                        | String  | `production`                                                                           | Enables optimized Next.js/NestJS runtime modes              |
| `PORT`                            | Number  | `3001` (API) / `3000` (Web)                                                            | Bound to unprivileged non-root ports                        |
| `DATABASE_URL`                    | String  | `postgresql://app_user:strong_pwd@pgbouncer.internal:6432/sakany_prod?sslmode=require` | Encrypted SSL connection string                             |
| `DATABASE_SSL`                    | Boolean | `true`                                                                                 | Enforces TLS connection to PostgreSQL                       |
| `JWT_SECRET`                      | String  | 64+ random hex characters                                                              | Never committed to git; rotate every 180 days               |
| `JWT_EXPIRES_IN`                  | String  | `15m`                                                                                  | Short lifespan reduces window of stolen token vulnerability |
| `JWT_REFRESH_SECRET`              | String  | 64+ random hex characters                                                              | Distinct from access token secret                           |
| `JWT_REFRESH_EXPIRES_IN`          | String  | `7d`                                                                                   | Stored in secure `HttpOnly; SameSite=Strict` cookie         |
| `SMS_GATEWAY_PROVIDER`            | String  | `LIVE`                                                                                 | Connects to authenticated Egyptian SMS provider             |
| `SMS_GATEWAY_API_KEY`             | String  | Encrypted provider API secret                                                          | Private carrier credentials                                 |
| `SMS_SENDER_ID`                   | String  | `Sakany`                                                                               | Registered sender ID approved by Egyptian NTRA              |
| `STORAGE_DRIVER`                  | String  | `CLOUDINARY`                                                                           | Uses CDN asset storage for property photos                  |
| `CLOUDINARY_CLOUD_NAME`           | String  | Production Cloudinary cloud identifier                                                 | Required for asset delivery                                 |
| `CLOUDINARY_API_KEY`              | String  | Production API key                                                                     | Media upload authentication                                 |
| `CLOUDINARY_API_SECRET`           | String  | Production API secret                                                                  | Stored strictly in secret manager                           |
| `GOOGLE_MAPS_API_KEY`             | String  | Server-side Google Maps key                                                            | Restrict by backend server IP address                       |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | String  | Client-side Google Maps key                                                            | Restrict by HTTP referrer (`*.sakany.eg/*`)                 |
| `SECURE_STORAGE_BUCKET`           | String  | `sakany-production-kyc-documents`                                                      | Private bucket with zero public read permissions            |
| `CORS_ORIGIN`                     | String  | `https://sakany.eg,https://www.sakany.eg`                                              | Strict CORS whitelist (no wildcards)                        |
| `NEXT_PUBLIC_API_URL`             | String  | `https://api.sakany.eg/api/v1`                                                         | Public API endpoint for frontend client                     |

---

## 4. Database Migration Automation in Continuous Delivery

Database migrations execute automatically during deployment before new application instances start receiving user traffic.

```
[ Developer Merge to main ]
            │
            ▼
[ Automated CI Pipeline Passes ]
            │
            ▼
[ Stage 1: Pre-Deployment Migration Runner ]
  - Executes: npm run migration:run -w @repo/api
  - Connects to production database with migration role
  - Uses transactional locks; aborts rollout on failure
            │
            ▼
[ Stage 2: Zero-Downtime Rolling Update ]
  - Spins up new container replicas running updated code
  - Polls /api/v1/health until healthy (liveness + readiness)
  - Shifts load balancer traffic to new containers
  - Gracefully stops old container instances
```

### Expand-and-Contract Migration Pattern

To guarantee zero-downtime during rolling updates:

1. **Expand**: Add new columns or tables as nullable or with default values. Both old and new application versions remain operational.
2. **Deploy Code**: Deploy the new application version that begins reading and writing the new columns.
3. **Contract**: In a subsequent migration, apply `NOT NULL` constraints or drop deprecated columns once all old application instances are terminated.

---

## 5. Continuous Integration & Delivery Pipeline (`.github/workflows/ci.yml`)

The repository includes a complete GitHub Actions workflow enforcing quality gates on every Pull Request and automating container releases:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main, staging]

jobs:
  lint-and-typecheck:
    name: Code Quality & Type Checking
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js 24
        uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: 'npm'

      - name: Install Monorepo Dependencies
        run: npm ci

      - name: Run ESLint Quality Gate
        run: npm run lint

      - name: Run TypeScript Type Check
        run: npm run type-check

  automated-tests:
    name: Unit & Integration Tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: student_housing_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U test_user -d student_housing_test"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js 24
        uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Build Shared Packages
        run: npm run build:packages

      - name: Run Database Migrations on Test DB
        run: npm run migration:run -w @repo/api
        env:
          DATABASE_URL: postgresql://test_user:test_password@localhost:5432/student_housing_test?schema=public

      - name: Execute Full Test Suite
        run: npm run test
        env:
          DATABASE_URL: postgresql://test_user:test_password@localhost:5432/student_housing_test?schema=public
          NODE_ENV: test

  docker-build:
    name: Docker Container Build Verification
    needs: [lint-and-typecheck, automated-tests]
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: actions/setup-buildx-action@v3

      - name: Build Backend Container
        uses: docker/build-push-action@v5
        with:
          context: .
          file: infrastructure/docker/Dockerfile.api
          push: false
          tags: sakany-api:test

      - name: Build Frontend Container
        uses: docker/build-push-action@v5
        with:
          context: .
          file: infrastructure/docker/Dockerfile.web
          push: false
          tags: sakany-web:test
```

---

## 6. Observability, Health Checks & Automated Backups

### 6.1 Health Check Endpoint: `GET /api/v1/health`

Monitored by Kubernetes probes, Docker health checks, and cloud load balancers:

```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up",
      "latencyMs": 4
    },
    "memory_rss": {
      "status": "up",
      "usedMb": 118
    },
    "storage": {
      "status": "up"
    }
  },
  "timestamp": "2026-11-21T00:00:00.000Z"
}
```

If the database connection is lost or connection pool exhausted, the endpoint responds with `503 Service Unavailable`, prompting the load balancer to remove the unhealthy instance from traffic routing.

### 6.2 Automated Database Backup Strategy

- **Nightly Logical Backup**: `pg_dump` executed at 02:00 Cairo Time (UTC+2) to compress and stream the database to an encrypted cold storage bucket.
- **Continuous Write-Ahead Log (WAL) Archiving**: WAL logs archived to cloud storage to support Point-in-Time Recovery (PITR) with a Recovery Point Objective (RPO) < 5 minutes.
- **Retention Schedule**:
  - Daily backups retained for 30 days.
  - Weekly backups retained for 12 weeks.
  - Monthly backups retained for 12 months.
