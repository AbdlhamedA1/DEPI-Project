# Local Development Setup Guide

- **Platform**: Sakany Student Housing Platform (منصة سكن الطلاب في مصر)
- **Specification Document**: Phase 3 Technical Design & Developer Guides
- **Document Path**: `docs/development/setup.md`
- **Monorepo Architecture**: TypeScript Modular Monolith with npm Workspaces (`@repo/*`)

---

## 1. System Prerequisites

Before initializing the platform locally, ensure your workstation satisfies the following software requirements. The project requires Node.js 24 and PostgreSQL 16.

| Dependency         | Required Version                      | Verification Command     | Purpose                                             |
| ------------------ | ------------------------------------- | ------------------------ | --------------------------------------------------- |
| **Node.js**        | `v24.x` (LTS, e.g., `v24.18.1+`)      | `node -v`                | JavaScript/TypeScript runtime engine                |
| **npm**            | `v10.x` or `v11.x` (e.g., `11.16.0+`) | `npm -v`                 | Monorepo package & workspace manager                |
| **PostgreSQL**     | `16.x`                                | `psql --version`         | Primary relational database with spatial extensions |
| **Docker Engine**  | `v24.0.0+`                            | `docker -v`              | Containerized services & test environment           |
| **Docker Compose** | `v2.20.0+`                            | `docker compose version` | Multi-container service orchestration               |
| **Git**            | `v2.30.0+`                            | `git --version`          | Version control system                              |

> **Node 24 Notice**: Ensure `node -v` outputs `v24.x`. If using `nvm` (Node Version Manager) or `fnm`, switch to Node 24 before installing dependencies:
>
> ```bash
> nvm install 24
> nvm use 24
> ```

---

## 2. Monorepo Architecture & npm Workspaces

The repository is structured as an npm workspaces monorepo containing application services in `apps/` and shared packages in `packages/`. Internal packages use the `@repo/` namespace.

```
student-housing-platform/
├── apps/
│   ├── web/                    # Next.js 14 App Router (Frontend, RTL/LTR bilingual)
│   └── api/                    # NestJS 10 Modular Monolith (24 domain modules)
├── packages/
│   ├── shared-types/           # Canonical TypeScript interfaces, enums, DTOs (@repo/shared-types)
│   ├── shared-config/          # Shared ESLint, Prettier, and tsconfig presets (@repo/shared-config)
│   ├── validation/             # Shared Zod validation schemas (@repo/validation)
│   └── api-client/             # Strongly-typed API client SDK (@repo/api-client)
├── infrastructure/
│   ├── docker/                 # Dockerfiles & docker-compose.yml
│   └── database/               # Backup and seed scripts
├── docs/                       # Architecture, database, API, and development docs
├── package.json                # Root workspace configuration
├── tsconfig.base.json          # Monorepo TypeScript path aliases
└── .env.example                # Canonical environment template
```

---

## 3. Repository Cloning & Installation

### Step 3.1: Clone Repository

```bash
git clone https://github.com/sakany/student-housing-platform.git
cd student-housing-platform
```

### Step 3.2: Install Dependencies

Run `npm install` at the repository root. npm workspaces automatically links internal packages across workspaces:

```bash
npm install
```

### Step 3.3: Build Shared Packages

Build the shared packages so that TypeScript type declarations and compiled outputs are immediately available to `apps/web` and `apps/api`:

```bash
npm run build:packages
```

This executes:

1. `npm run --workspace=@repo/shared-types build`
2. `npm run --workspace=@repo/validation build`
3. `npm run --workspace=@repo/api-client build`

---

## 4. Environment Variables Configuration

Copy the example environment configuration into `.env` at the root of the project:

```bash
cp .env.example .env
```

### Complete Environment Variable Reference

| Variable Name                     | Required | Default / Example Value                                                       | Description                                               |
| --------------------------------- | -------- | ----------------------------------------------------------------------------- | --------------------------------------------------------- |
| **Runtime Settings**              |          |                                                                               |                                                           |
| `NODE_ENV`                        | Yes      | `development`                                                                 | Runtime environment (`development`, `test`, `production`) |
| `API_PORT`                        | Yes      | `3001` (or `4000`)                                                            | Port where NestJS API server listens                      |
| `WEB_PORT`                        | Yes      | `3000`                                                                        | Port where Next.js web application listens                |
| **PostgreSQL Database**           |          |                                                                               |                                                           |
| `DATABASE_URL`                    | Yes      | `postgresql://postgres:postgres@localhost:5432/student_housing?schema=public` | Standard PostgreSQL connection URI                        |
| `DB_HOST`                         | Yes      | `localhost`                                                                   | Database host                                             |
| `DB_PORT`                         | Yes      | `5432`                                                                        | Database port                                             |
| `DB_USERNAME`                     | Yes      | `postgres`                                                                    | Database superuser/application user                       |
| `DB_PASSWORD`                     | Yes      | `postgres`                                                                    | Database password                                         |
| `DB_DATABASE`                     | Yes      | `student_housing`                                                             | Target database name                                      |
| **Authentication & Security**     |          |                                                                               |                                                           |
| `JWT_SECRET`                      | Yes      | `dev-jwt-super-secret-key-min-32-chars-long`                                  | HMAC secret for signing short-lived access JWTs (15 min)  |
| `JWT_EXPIRES_IN`                  | Yes      | `15m` (or `7d` dev)                                                           | Access token lifespan                                     |
| `JWT_REFRESH_SECRET`              | Yes      | `dev-jwt-refresh-super-secret-key-32-chars`                                   | HMAC secret for signing refresh tokens                    |
| `JWT_REFRESH_EXPIRES_IN`          | Yes      | `7d` (or `30d`)                                                               | Refresh token lifespan                                    |
| **OTP & SMS Verification**        |          |                                                                               |                                                           |
| `OTP_EXPIRY_MINUTES`              | Yes      | `5`                                                                           | Lifespan of 6-digit phone verification OTP                |
| `OTP_MAX_ATTEMPTS`                | Yes      | `3`                                                                           | Maximum incorrect verification attempts before cooldown   |
| `SMS_GATEWAY_PROVIDER`            | Yes      | `MOCK`                                                                        | SMS gateway provider (`MOCK`, `TWILIO`, `LOCAL_SMS`)      |
| `SMS_GATEWAY_API_KEY`             | No       | `mock_dev_sms_key`                                                            | API key for production SMS provider                       |
| `MOCK_OTP_CODE`                   | No       | `123456`                                                                      | Fixed OTP accepted when `SMS_GATEWAY_PROVIDER=MOCK`       |
| **Cloudinary Media Assets**       |          |                                                                               |                                                           |
| `STORAGE_DRIVER`                  | Yes      | `LOCAL`                                                                       | Media storage driver (`LOCAL` or `CLOUDINARY`)            |
| `CLOUDINARY_CLOUD_NAME`           | No       | `mock_cloud`                                                                  | Cloudinary account cloud name                             |
| `CLOUDINARY_API_KEY`              | No       | `mock_api_key`                                                                | Cloudinary public API key                                 |
| `CLOUDINARY_API_SECRET`           | No       | `mock_api_secret`                                                             | Cloudinary private API secret                             |
| **Google Maps Integration**       |          |                                                                               |                                                           |
| `GOOGLE_MAPS_API_KEY`             | No       | `mock_google_maps_key`                                                        | Google Maps API key (geocoding, distance matrix)          |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | No       | `mock_google_maps_key`                                                        | Client-accessible Google Maps key                         |
| **Private KYC Storage**           |          |                                                                               |                                                           |
| `SECURE_STORAGE_LOCAL_PATH`       | Yes      | `./uploads/secure_kyc`                                                        | Local filesystem path for sensitive National IDs & deeds  |
| `SECURE_STORAGE_BUCKET`           | No       | `student-housing-kyc-private`                                                 | Encrypted cloud bucket for production KYC files           |
| **Frontend Settings**             |          |                                                                               |                                                           |
| `NEXT_PUBLIC_API_URL`             | Yes      | `http://localhost:3001/api/v1`                                                | Base REST API URL accessed by Next.js browser client      |
| `NEXT_PUBLIC_DEFAULT_LOCALE`      | Yes      | `ar`                                                                          | Default language (`ar` Egyptian Arabic RTL, `en` LTR)     |
| `NEXT_PUBLIC_SUPPORTED_LOCALES`   | Yes      | `ar,en`                                                                       | Comma-delimited list of active locales                    |
| **Initial Superadmin Seed**       |          |                                                                               |                                                           |
| `ADMIN_PHONE`                     | Yes      | `+201000000000`                                                               | Seeded superadmin phone number                            |
| `ADMIN_EMAIL`                     | Yes      | `admin@sakany.eg`                                                             | Seeded superadmin email address                           |
| `ADMIN_PASSWORD`                  | Yes      | `SakanyAdmin2026!Secure`                                                      | Seeded superadmin password                                |

---

## 5. PostgreSQL Database Setup

The platform requires PostgreSQL 16 with the `uuid-ossp`, `cube`, and `earthdistance` extensions enabled.

### Option A: Using Docker Compose (Recommended)

Start the pre-configured PostgreSQL 16 service using Docker:

```bash
# Start PostgreSQL in the background
docker compose -f infrastructure/docker/docker-compose.yml up -d postgres

# Verify container health
docker compose -f infrastructure/docker/docker-compose.yml ps
```

The database container exposes port `5432` and mounts a named Docker volume (`postgres_data`) for persistent data storage.

### Option B: Using a Native PostgreSQL 16 Installation

If running PostgreSQL directly on your host machine:

1. Connect to PostgreSQL using `psql`:
   ```bash
   psql -U postgres
   ```
2. Create the platform database:
   ```sql
   CREATE DATABASE student_housing;
   \c student_housing;
   ```
3. Enable the required extensions:
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS "cube";
   CREATE EXTENSION IF NOT EXISTS "earthdistance";
   ```

---

## 6. Database Migrations & Seeding

### Step 6.1: Run Database Migrations

Execute the 12-stage migration sequence to create all 26 relational tables, enums, foreign keys, and indexes:

```bash
npm run migration:run --workspace=@repo/api
```

### Step 6.2: Run Seed Data Pipeline

Populate the database with initial directory data, universities with geographic coordinates, system configuration, and the initial superadmin:

```bash
npm run seed --workspace=@repo/api
```

#### Seed Datasets Included:

1. **Egyptian Cities & Areas (`01-cities-and-areas.seed.ts`)**:
   - Cairo (القاهرة): Dokki, Nasr City, New Cairo / 5th Settlement, Heliopolis, Maadi.
   - Giza (الجيزة): Mohandessin, 6th of October, Sheikh Zayed, Haram.
   - Alexandria (الإسكندرية): Shatby, Sidi Gaber, Smouha, Miami.
2. **Universities with Main Campus Coordinates (`02-universities.seed.ts`)**:
   - Cairo University (جامعة القاهرة): `lat: 30.0276, lng: 31.2101`
   - Ain Shams University (جامعة عين شمس): `lat: 30.0768, lng: 31.2853`
   - Helwan University (جامعة حلوان): `lat: 29.8668, lng: 31.3204`
   - German University in Cairo - GUC (الجامعة الألمانية بالقاهرة): `lat: 29.9869, lng: 31.4414`
   - American University in Cairo - AUC (الجامعة الأمريكية بالقاهرة): `lat: 30.0198, lng: 31.5000`
3. **Platform Settings (`03-platform-settings.seed.ts`)**:
   - `pilot_free_listing_limit`: 5 active listings per provider during pilot.
   - `max_open_requests_per_student`: 3 requests (`BR-BKG-001`).
   - `otp_expiry_minutes`: 5 minutes.
   - `contact_disclosure_policy`: immediate upon booking request submission.
4. **Initial Superadmin (`04-initial-superadmin.seed.ts`)**:
   - Creates the single system administrator account (`+201000000000` / `admin@sakany.eg`).

---

## 7. Running the Monorepo

### Running Both Applications Concurrently

To start both the frontend (`apps/web`) and backend (`apps/api`) in parallel:

```bash
npm run dev
```

### Running Applications Independently

You can run individual services in separate terminal sessions:

```bash
# Terminal 1: Run NestJS API (Port 3001 or 4000)
npm run dev:api

# Terminal 2: Run Next.js Web Application (Port 3000)
npm run dev:web
```

### Building the Entire Monorepo

To compile all packages and applications for production:

```bash
# Build shared packages (@repo/shared-types, @repo/validation, @repo/api-client)
npm run build:packages

# Build applications (@repo/api, @repo/web)
npm run build:apps

# Full monorepo build
npm run build
```

### Code Quality & Type Checking

```bash
# Type check all workspaces
npm run type-check

# Lint all workspaces
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format
```

---

## 8. Local Endpoints & Verification Matrix

Once initialized, verify that each service responds correctly:

| Service / Interface   | Local URL                                               | Method | Expected Output / Status                                   |
| --------------------- | ------------------------------------------------------- | ------ | ---------------------------------------------------------- |
| **Web Application**   | `http://localhost:3000`                                 | `GET`  | Next.js Landing page rendered in Egyptian Arabic (RTL)     |
| **Web English Route** | `http://localhost:3000/en`                              | `GET`  | Next.js Landing page rendered in English (LTR)             |
| **API Health Check**  | `http://localhost:3001/api/v1/health`                   | `GET`  | `{"status":"ok","database":"connected","timestamp":"..."}` |
| **Cities Directory**  | `http://localhost:3001/api/v1/locations/cities`         | `GET`  | List of active Egyptian cities (Cairo, Giza, Alexandria)   |
| **Universities API**  | `http://localhost:3001/api/v1/universities`             | `GET`  | List of universities with GPS campus coordinates           |
| **Public Settings**   | `http://localhost:3001/api/v1/platform-settings/public` | `GET`  | Public system settings (limits, pilot rules)               |
| **PostgreSQL Port**   | `localhost:5432`                                        | TCP    | Connected via `psql` or database GUI                       |

---

## 9. Recommended IDE Configuration

For the optimal developer experience in Visual Studio Code:

1. **Recommended Extensions**:
   - `dbaeumer.vscode-eslint`: Real-time ESLint checking across all workspaces.
   - `esbenp.prettier-vscode`: Automatic code formatting on save.
   - `bradlc.vscode-tailwindcss`: Tailwind CSS autocomplete and class sorting.
   - `mtxr.sqltools` + `mtxr.sqltools-driver-pg`: Direct database exploration.

2. **VSCode Workspace Settings (`.vscode/settings.json`)**:

   ```json
   {
     "editor.defaultFormatter": "esbenp.prettier-vscode",
     "editor.formatOnSave": true,
     "editor.codeActionsOnSave": {
       "source.fixAll.eslint": "explicit"
     },
     "typescript.tsdk": "node_modules/typescript/lib",
     "files.eol": "\n"
   }
   ```

3. **TypeScript Path Aliases**:
   Path mappings are centralized in `tsconfig.base.json` and consumed by all packages and apps:
   - `@repo/shared-types` -> `packages/shared-types/src/index.ts`
   - `@repo/validation` -> `packages/validation/src/index.ts`
   - `@repo/api-client` -> `packages/api-client/src/index.ts`
   - `@repo/shared-config/*` -> `packages/shared-config/*`
