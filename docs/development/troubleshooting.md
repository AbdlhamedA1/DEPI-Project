# Troubleshooting & Operations Runbook

- **Platform**: Sakany Student Housing Platform (منصة سكن الطلاب في مصر)
- **Specification Document**: Phase 3 Technical Design & Developer Guides
- **Document Path**: `docs/development/troubleshooting.md`
- **Scope**: Diagnostic Procedures, Error Signatures, and Concrete Fixes

---

## 1. Database Connection & Migration Issues

### 1.1 Error: `ECONNREFUSED 127.0.0.1:5432` / Host Unreachable

- **Symptom**: The backend fails to start, logging:
  ```
  Error: connect ECONNREFUSED 127.0.0.1:5432
      at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1146:16)
  ```
- **Root Cause**: The PostgreSQL database server is not running, or is listening on a different port/interface.
- **Diagnostic Steps**:
  1. Verify if the Docker container is active:
     ```bash
     docker compose -f infrastructure/docker/docker-compose.yml ps
     ```
  2. If the container is stopped or exited, inspect the logs:
     ```bash
     docker compose -f infrastructure/docker/docker-compose.yml logs postgres
     ```
  3. Verify if port `5432` is listening:
     - **Windows PowerShell**:
       ```powershell
       Test-NetConnection -ComputerName localhost -Port 5432
       ```
     - **Linux / macOS**:
       ```bash
       nc -zv 127.0.0.1 5432
       ```
- **Resolution**:
  1. Start the containerized PostgreSQL service:
     ```bash
     docker compose -f infrastructure/docker/docker-compose.yml up -d postgres
     ```
  2. Check `.env` configuration. Ensure `DATABASE_URL` matches your local setup:
     ```ini
     DATABASE_URL=postgresql://postgres:postgres@localhost:5432/student_housing?schema=public
     DB_HOST=localhost
     DB_PORT=5432
     ```

---

### 1.2 Error: `password authentication failed for user "postgres"`

- **Symptom**: Connection rejected with PostgreSQL error code `28P01`.
- **Root Cause**: Credentials in `.env` differ from the initialized PostgreSQL database volume.
- **Resolution**:
  1. Verify credentials in `.env` (`DB_USERNAME` and `DB_PASSWORD`).
  2. If running via Docker Compose and the password was recently changed, Docker's existing data volume retains the old credentials. Reset the local volume (development only):
     ```bash
     docker compose -f infrastructure/docker/docker-compose.yml down -v
     docker compose -f infrastructure/docker/docker-compose.yml up -d postgres
     npm run migration:run -w @repo/api
     npm run seed -w @repo/api
     ```

---

### 1.3 Error: `type "cube" does not exist` or `type "earth" does not exist`

- **Symptom**: Migration `001` or `012` fails during distance calculation or index creation.
- **Root Cause**: The PostgreSQL extensions `cube` or `earthdistance` were not installed or lack superuser privileges.
- **Resolution**:
  Connect to PostgreSQL as superuser (`postgres`) and manually enable the extensions:
  ```sql
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  CREATE EXTENSION IF NOT EXISTS "cube";
  CREATE EXTENSION IF NOT EXISTS "earthdistance";
  ```
  Verify installed extensions:
  ```sql
  \dx
  ```

---

### 1.4 Migration Lock Stuck or Dirty Migration State

- **Symptom**: Migration CLI hangs indefinitely or reports:
  ```
  Migration "004_create_properties_and_verifications" failed: relation "properties" already exists
  ```
- **Root Cause**: A previous migration failed midway or terminated abnormally while holding an exclusive schema lock.
- **Diagnostic Steps**:
  Check for active PostgreSQL lock transactions:
  ```sql
  SELECT pid, query, state, age(clock_timestamp(), query_start)
  FROM pg_stat_activity
  WHERE query LIKE '%migration%' OR state = 'active';
  ```
- **Resolution**:
  1. Inspect the migration tracking table:
     ```sql
     SELECT * FROM migrations ORDER BY timestamp DESC;
     ```
  2. If a migration is partially applied, revert it using the CLI:
     ```bash
     npm run migration:revert -w @repo/api
     ```
  3. If a lock is held by a hanging process, terminate the backend PID:
     ```sql
     SELECT pg_terminate_backend(<PID>);
     ```
  4. Once clean, re-execute migrations:
     ```bash
     npm run migration:run -w @repo/api
     ```

---

## 2. Network & Port Conflicts

### 2.1 Error: `EADDRINUSE: address already in use :::3000` or `:::3001`

- **Symptom**: Next.js (port 3000) or NestJS (port 3001 or 4000) crashes on startup with:
  ```
  Error: listen EADDRINUSE: address already in use :::3000
  ```
- **Root Cause**: A orphaned Node.js process from a previous run is still listening on the port.
- **Resolution**:

#### On Windows PowerShell:

```powershell
# 1. Identify the process ID (PID) occupying port 3000
netstat -ano | findstr :3000

# 2. Identify the process occupying port 3001
netstat -ano | findstr :3001

# 3. Kill the process by PID (e.g. PID 14220)
taskkill /F /PID 14220

# Alternatively, using PowerShell cmdlets:
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess | Stop-Process -Force
```

#### On Linux / macOS:

```bash
# 1. Kill process on port 3000
fuser -k 3000/tcp

# 2. Kill process on port 3001
fuser -k 3001/tcp

# Alternatively, using lsof:
kill -9 $(lsof -t -i:3000)
kill -9 $(lsof -t -i:3001)
```

---

## 3. Cross-Origin Resource Sharing (CORS) Errors

### 3.1 Symptom: Browser Blocks API Requests from Next.js

- **Console Log**:
  ```
  Access to XMLHttpRequest at 'http://localhost:3001/api/v1/properties' from origin
  'http://localhost:3000' has been blocked by CORS policy:
  No 'Access-Control-Allow-Origin' header is present on the requested resource.
  ```
- **Root Cause**: The API server has not whitelisted `http://localhost:3000` or rejects credentials.
- **Resolution**:
  1. Check `.env` at the root or `apps/api/.env`:
     ```ini
     CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000
     ```
  2. Verify that `apps/api/src/main.ts` enables credentials and the configured origin:
     ```typescript
     app.enableCors({
       origin: process.env.CORS_ORIGIN?.split(',') || [
         'http://localhost:3000',
         'http://127.0.0.1:3000',
       ],
       credentials: true,
       methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
       allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
     });
     ```
  3. Ensure that frontend requests sending cookies or auth headers include `credentials: 'include'` (in `fetch`) or `withCredentials: true` (in `axios`).

---

## 4. Authentication, JWT & Token Expiry

### 4.1 Symptom: Infinite `401 Unauthorized` Loop on Frontend

- **Symptom**: The browser continuously redirects between `/login` and the requested page.
- **Root Cause**: The short-lived access token (15 min) expired, and the refresh token is missing, expired, or rejected by cookie policy.
- **Diagnostic Steps**:
  1. Inspect the browser's cookies under DevTools -> Application -> Storage -> Cookies.
  2. Check if `refresh_token` exists and is marked `HttpOnly`.
  3. Check the expiration timestamp on the JWT payload via [jwt.io](https://jwt.io) or base64 decoding.
- **Resolution**:
  1. Clear browser cookies and localStorage for `localhost:3000`.
  2. Ensure the refresh token endpoint (`POST /api/v1/auth/refresh-token`) is receiving the refresh token:
     ```bash
     curl -X POST http://localhost:3001/api/v1/auth/refresh-token \
       -H "Content-Type: application/json" \
       -d '{"refreshToken": "<your_refresh_token>"}'
     ```
  3. On localhost development in Google Chrome, ensure cookies do not require `SameSite=None` without `Secure`. In local development (`NODE_ENV=development`), cookies should use:
     ```typescript
     res.cookie('refresh_token', token, {
       httpOnly: true,
       secure: false, // Set to true only in production (HTTPS)
       sameSite: 'lax',
       maxAge: 7 * 24 * 60 * 60 * 1000,
     });
     ```

---

### 4.2 Symptom: OTP SMS Not Received During Local Development

- **Symptom**: Registering a student or owner triggers "OTP Sent", but no SMS arrives on the mobile device.
- **Root Cause**: Local development is disconnected from cellular SMS gateways to avoid billing and carrier delays.
- **Resolution**:
  1. Set `SMS_GATEWAY_PROVIDER=MOCK` in `.env`:
     ```ini
     SMS_GATEWAY_PROVIDER=MOCK
     MOCK_OTP_CODE=123456
     ```
  2. Check the NestJS API terminal log output. The mock gateway logs the OTP directly to the console:
     ```
     [MockSmsGateway] [MOCK OTP] Verification code for +201012345678 is: 123456 (Expires in 5 minutes)
     ```
  3. Enter `123456` in the verification modal.

---

### 4.3 Error: `ERR_OTP_RATE_LIMIT_EXCEEDED` (HTTP 429)

- **Symptom**: Resending OTP fails with:
  ```json
  {
    "success": false,
    "statusCode": 429,
    "errorCode": "ERR_OTP_RATE_LIMIT_EXCEEDED",
    "message": "لقد تجاوزت الحد المسموح به من طلبات التحقق. يرجى الانتظار 15 دقيقة"
  }
  ```
- **Root Cause**: More than 3 OTP requests were sent for the same phone number within 15 minutes.
- **Resolution for Developers**:
  In development, reset the OTP attempts tracker in Redis/memory by restarting the API server or clearing the cache:
  ```bash
  # Restart the development server to clear in-memory rate limiters
  npm run dev:api
  ```

---

## 5. Monorepo Workspace & TypeScript Path Aliases

### 5.1 Error: `Cannot find module '@repo/shared-types'` or `@repo/validation`

- **Symptom**: `npm run build` or `npm run type-check` fails reporting that internal packages cannot be found.
- **Root Cause**: The shared packages have not been compiled, or npm workspaces symlinks in `node_modules` are out of sync.
- **Resolution**:
  1. Build the shared packages explicitly:
     ```bash
     npm run build:packages
     ```
  2. Verify that `tsconfig.base.json` path mappings match package source locations:
     ```json
     {
       "compilerOptions": {
         "paths": {
           "@repo/shared-types": ["packages/shared-types/src/index.ts"],
           "@repo/shared-types/*": ["packages/shared-types/src/*"],
           "@repo/validation": ["packages/validation/src/index.ts"],
           "@repo/validation/*": ["packages/validation/src/*"],
           "@repo/api-client": ["packages/api-client/src/index.ts"],
           "@repo/api-client/*": ["packages/api-client/src/*"]
         }
       }
     }
     ```
  3. If symlinks are broken, perform a clean reinstall:
     - **Windows PowerShell**:
       ```powershell
       Remove-Item -Recurse -Force node_modules, apps/*/node_modules, packages/*/node_modules, package-lock.json
       npm install
       npm run build:packages
       ```
     - **Linux / macOS**:
       ```bash
       rm -rf node_modules apps/*/node_modules packages/*/node_modules package-lock.json
       npm install
       npm run build:packages
       ```

---

## 6. Media Asset Storage & Cloudinary Issues

### 6.1 Error: `Must supply api_key` or Cloudinary Timeout

- **Symptom**: Uploading property photos fails with Cloudinary authentication or network timeout errors.
- **Root Cause**: Missing or invalid Cloudinary credentials in `.env`, or developing offline.
- **Resolution**:
  Switch the platform to local disk storage mode in `.env`:
  ```ini
  STORAGE_DRIVER=LOCAL
  ```
  In local mode:
  - Files are saved to `apps/api/uploads/` on the local filesystem.
  - Files are served statically via `http://localhost:3001/uploads/...`.
  - No external internet access or Cloudinary API keys are required.

---

## 7. Diagnostic Quick-Reference Matrix

| Issue              | Quick Diagnostic Command                                        | Immediate Fix                                                |
| ------------------ | --------------------------------------------------------------- | ------------------------------------------------------------ |
| PostgreSQL Down    | `docker compose -f infrastructure/docker/docker-compose.yml ps` | `docker compose up -d postgres`                              |
| Port 3000 Busy     | `netstat -ano \| findstr :3000`                                 | `taskkill /F /PID <PID>`                                     |
| Port 3001 Busy     | `netstat -ano \| findstr :3001`                                 | `taskkill /F /PID <PID>`                                     |
| Broken Symlinks    | `npm run build:packages`                                        | `npm install`                                                |
| Missing Extensions | `psql -U postgres -d student_housing -c "\dx"`                  | `CREATE EXTENSION "cube"; CREATE EXTENSION "earthdistance";` |
| Token Expired      | Inspect DevTools Cookies (`refresh_token`)                      | Clear cookies & log in again                                 |
| Missing OTP        | Terminal output of NestJS API                                   | Use code `123456` when `SMS_GATEWAY_PROVIDER=MOCK`           |
