# Egyptian Student Housing Platform — Infrastructure & DevOps Architecture

**Document ID**: `ARCH-INFRA-001`  
**Version**: `1.0.0` (Phase 2 System Architecture)  
**Status**: `Approved Standard`  
**Target Environments**: Development (Local Docker Compose), Staging, Production  
**Architectural Decision Records**: `ADR-001` (Modular Monolith Monorepo), `ADR-004` (PostgreSQL Infrastructure)

---

## 1. Infrastructure Strategy & Hosting Paradigm

### 1.1 Guiding Principles

The infrastructure for the Egyptian Student Housing Platform is designed for high reliability, minimal operational friction, predictable hosting expenditure, and automated reproducibility.

Per `app.txt` (§6, §12) and `app2.txt`:

1. **Containerized Monorepo**: All services (`apps/web`, `apps/api`, and PostgreSQL database) are fully containerized using multi-stage Docker builds.
2. **Lean Cloud Footprint**: In the MVP phase, we avoid premature distributed Kubernetes clusters or complex cloud overhead. The platform operates cleanly on standard container runners (e.g. AWS ECS / App Runner, Railway, or managed VPS with Docker Compose).
3. **Strict Environment Parity**: Development, Staging, and Production environments share identical runtime container images, varying only in configuration injected via validated environment variables.
4. **Resilient Data Backups**: Automated, encrypted database snapshots and disaster recovery procedures safeguard transactional records from Day 1.

---

## 2. Multi-Stage Docker Build Architecture

### 2.1 Frontend Container (`infrastructure/docker/Dockerfile.web`)

The Next.js web application leverages Next.js standalone output to produce a minimal, production-ready image (<150MB):

```dockerfile
# Stage 1: Dependency resolution
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy root monorepo manifests
COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-config/package.json ./packages/shared-config/
COPY packages/api-client/package.json ./packages/api-client/
COPY packages/validation/package.json ./packages/validation/

RUN npm ci

# Stage 2: Source code compilation
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Compile shared packages first, then frontend
RUN npm run build --workspace=packages/shared-types
RUN npm run build --workspace=packages/validation
RUN npm run build --workspace=packages/api-client
RUN npm run build --workspace=apps/web

# Stage 3: Minimal runner image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone build output and static assets
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
```

### 2.2 Backend Container (`infrastructure/docker/Dockerfile.api`)

The NestJS API compiles TypeScript down to optimized JavaScript with production dependencies only:

```dockerfile
# Stage 1: Dependency resolution
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-config/package.json ./packages/shared-config/
COPY packages/validation/package.json ./packages/validation/

RUN npm ci

# Stage 2: Compilation
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production

RUN npm run build --workspace=packages/shared-types
RUN npm run build --workspace=packages/validation
RUN npm run build --workspace=apps/api

# Prune devDependencies
RUN npm prune --production

# Stage 3: Minimal runner image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

RUN addgroup --system --gid 1001 nestjs
RUN adduser --system --uid 1001 nestjs

COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder --chown=nestjs:nodejs /app/packages ./packages

USER nestjs

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:4000/api/v1/health || exit 1

CMD ["node", "apps/api/dist/src/main.js"]
```

---

## 3. Local Orchestration (`infrastructure/docker/docker-compose.yml`)

The root `docker-compose.yml` orchestrates the local development and testing environment with PostgreSQL 16 Alpine:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: student_housing_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: student_housing_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: devpassword
    ports:
      - '5432:5432'
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres -d student_housing_db']
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - student_housing_net

  api:
    build:
      context: ../../
      dockerfile: infrastructure/docker/Dockerfile.api
    container_name: student_housing_api
    restart: unless-stopped
    ports:
      - '4000:4000'
    environment:
      NODE_ENV: development
      PORT: 4000
      DATABASE_HOST: postgres
      DATABASE_PORT: 5432
      DATABASE_NAME: student_housing_db
      DATABASE_USER: postgres
      DATABASE_PASSWORD: devpassword
      JWT_ACCESS_SECRET: dev_jwt_access_secret_key_32_characters_minimum
      JWT_REFRESH_SECRET: dev_jwt_refresh_secret_key_32_characters_minimum
      FRONTEND_URL: http://localhost:3000
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - student_housing_net

  web:
    build:
      context: ../../
      dockerfile: infrastructure/docker/Dockerfile.web
    container_name: student_housing_web
    restart: unless-stopped
    ports:
      - '3000:3000'
    environment:
      NODE_ENV: development
      PORT: 3000
      NEXT_PUBLIC_API_URL: http://localhost:4000/api/v1
    depends_on:
      - api
    networks:
      - student_housing_net

volumes:
  pgdata:
    driver: local

networks:
  student_housing_net:
    driver: bridge
```

---

## 4. Environment Separation Matrix

The platform is strictly segmented across three isolated environments:

| Feature / Configuration    | Development (`.env.development`)    | Staging (`.env.staging`)                 | Production (`.env.production`)                                      |
| -------------------------- | ----------------------------------- | ---------------------------------------- | ------------------------------------------------------------------- |
| **Hosting Infrastructure** | Local Docker Compose / Host machine | Cloud container runner (single instance) | Highly available cloud cluster / autoscaling                        |
| **PostgreSQL Database**    | Local container (`postgres:16`)     | Managed sandbox PostgreSQL               | Managed PostgreSQL (e.g. AWS RDS) with Multi-AZ & automated backups |
| **SSL / TLS Encryption**   | Optional HTTP                       | Enforced HTTPS (Let's Encrypt)           | Enforced HTTPS (Enterprise SSL + HSTS preload)                      |
| **SMS / OTP Gateway**      | Mock Adapter (Logs OTP to stdout)   | Sandbox SMS Gateway with test numbers    | Live Egyptian SMS Gateway (VictoryLink / Twilio / Infobip)          |
| **Public Media CDN**       | Cloudinary Dev Sandbox folder       | Cloudinary Staging folder                | Cloudinary Production folder (Optimized transforms)                 |
| **Private KYC Storage**    | Local encrypted filesystem mount    | S3 Sandbox bucket (SSE enabled)          | S3 Dedicated Private Bucket with SSE-KMS & strict IAM policy        |
| **CORS Origin Policy**     | `http://localhost:3000`             | `https://staging.studenthousing.eg`      | `https://studenthousing.eg`                                         |
| **Log Level & Verbosity**  | `debug` (Pretty printed)            | `info` (Structured JSON)                 | `warn` / `error` (Structured JSON + Error tracking)                 |

---

## 5. CI/CD Pipeline Architecture (`.github/workflows/ci.yml`)

Continuous Integration is executed on every pull request and push to `main` and `develop` branches:

```yaml
name: Continuous Integration & Quality Gates

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-format:
    name: Code Style & Linting
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check

  typecheck:
    name: TypeScript Verification
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run type-check

  unit-tests:
    name: Unit & Domain Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm test

  integration-tests:
    name: Integration Tests & DB Transactions
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: test_db
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run test:integration
        env:
          DATABASE_HOST: localhost
          DATABASE_PORT: 5432
          DATABASE_NAME: test_db
          DATABASE_USER: test_user
          DATABASE_PASSWORD: test_password

  build-verification:
    name: Production Build Verification
    runs-on: ubuntu-latest
    needs: [lint-and-format, typecheck, unit-tests]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run build

  security-audit:
    name: Dependency Vulnerability Audit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm audit --audit-level=high
```

---

## 6. Observability, Health Checks & Disaster Recovery

### 6.1 Health Check Endpoints (`/api/v1/health`)

Powered by `@nestjs/terminus`:

- `GET /api/v1/health`: Returns overall platform operational status.
- Probes include:
  1. `TypeOrmHealthIndicator`: Verifies active read/write database ping.
  2. `MemoryHealthIndicator`: Asserts RSS and heap memory are below 85% container allocation.
  3. `DiskHealthIndicator`: Ensures storage volume has >10% free capacity.

### 6.2 Structured Logging with Correlation IDs

- Logging format: JSON lines adhering to the OpenTelemetry schema.
- Every HTTP request receives an incoming `X-Correlation-Id` header (or generates a random UUIDv4) that is propagated through all controller logs, database transaction logs, and outgoing integration calls.
- Sensitive fields (passwords, OTP codes, Egyptian National IDs, Authorization headers) are automatically redacted by the logger interceptor.

### 6.3 Backup Strategy & Disaster Recovery Plan (`infrastructure/database/backup/`)

- **Automated Daily Backups**:
  - Script: `scripts/database/backup.sh` executes a compressed `pg_dump` with custom format (`-Fc`).
  - Encrypted with AES-256 before transmission to secondary off-site backup storage.
- **Retention Schedule**:
  - Daily snapshots retained for 7 days.
  - Weekly snapshots retained for 4 weeks.
  - Monthly snapshots retained for 12 months.
- **Recovery Time Objective (RTO)**: Under 30 minutes.
- **Recovery Point Objective (RPO)**: Under 24 hours (or point-in-time recovery via PostgreSQL WAL archiving in production).
- **Automated Verification**: Weekly automated CI job restores the latest backup snapshot to a temporary test database to verify backup integrity.
