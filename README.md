# Credit Expenses

A TypeScript API for managing credit card transactions. Users can sign in, store transactions and merchants, organize them into categories, and view spending reports. Persistence is PostgreSQL via Prisma.

## Features

- Email and password registration and login, plus Google OAuth
- JWT authentication and a refresh endpoint (`POST /api/auth/refresh`, token valid for 1 day)
- Profile read and update (`/api/profile/me`) and avatar upload (`PATCH /api/profile/avatar`)
- Admin-only user list and delete
- Create transactions from bank-style notification payloads; list them with `period`, `page`, `limit`, `categoryId` and `order`; plus a transaction summary
- Category CRUD and merchant list, get and create (merchants belong to a category)
- Spending reports by period (week, month, quarter, annual), category breakdown, and a filtered summary
- LLM category inference through OpenRouter (`openai/gpt-4.1-nano`). If inference fails, the category falls back to `unknown`
- A script that parses semicolon-delimited invoice CSVs and inserts transactions, queuing invalid rows for export
- Duplicate protection via a unique constraint on user, merchant, amount, date, card number, currency and installment

## Stack

- Node.js, TypeScript, pnpm
- Fastify 5 with Zod schemas (`fastify-type-provider-zod`)
- Prisma and PostgreSQL 17
- JWT (`@fastify/jwt`), Google OAuth (`@fastify/oauth2`), cookies, multipart uploads
- Helmet, CORS, request sanitization, and rate limiting (100 requests per minute; health and docs are excluded)
- OpenAI SDK pointed at OpenRouter for structured extraction
- Pino logging, Biome for lint and format, Jest with Prismock (no real database in tests)
- Docker and Docker Compose (development and production targets)

## Architecture

```
src/
├── index.ts                 # process entry point
├── api/
│   ├── server.ts            # Fastify setup, plugins, Swagger, hooks
│   ├── routes/              # HTTP routes by domain
│   ├── controllers/
│   ├── services/            # domain logic, LLM, parsing, reports
│   ├── schemas/             # Zod contracts
│   ├── plugins/             # DI-style plugin registration
│   └── middleware/
├── scripts/                 # invoice CSV import
└── __tests__/security/      # JWT and input-validation tests
prisma/
├── schema.prisma
├── seed.ts                  # admin user and default categories
└── migrations/
```

Domain models: `User`, `Category`, `Merchant`, `Transaction`. Transaction types are `DEBIT`, `CREDIT` and `PIX`. Auth providers are `LOCAL` and `GOOGLE`.

## Running with Docker

1. Copy the example env files and fill in real values. Do not commit them.

   ```bash
   cp .env.example .env
   cp docker.env.example docker.env
   ```

2. In `.env`, set at least `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, `USER_ENCRYPTION_KEY`, and `OPEN_ROUTER_API_KEY`. For Google login, also set `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET`.

3. `docker.env` is loaded by Compose so the app container can reach Postgres on the `db` hostname. `docker.env.example` sets the OAuth callback to the route registered in code:

   ```
   DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}"
   GOOGLE_OAUTH_CALLBACK_URL=http://localhost:3100/api/auth/google/callback
   ```

4. Start the database and the development app (this is what `pnpm docker:up` runs):

   ```bash
   pnpm docker:up
   ```

   The Compose `dev` service runs `prisma migrate deploy`, seeds the database, then starts the app with `pnpm dev:docker`.

5. The API listens on port 3100.

   - Health: [http://localhost:3100/health](http://localhost:3100/health)
   - Swagger UI (non-production only): [http://localhost:3100/documentation](http://localhost:3100/documentation)

Stop the stack with `pnpm docker:down`.

### Without Docker

```bash
pnpm install
# point DATABASE_URL at a local Postgres, then:
pnpm prisma:migrate
pnpm seed
pnpm dev
```

## Tests

```bash
pnpm test              # Jest with coverage; Prismock replaces Prisma
pnpm security:test     # JWT and input-validation suite (jest.security.config.js)
```

Service and controller specs live next to the code (`*.spec.ts`). Security tests are under `src/__tests__/security/`.

## API

All feature routes except `/health` and the auth register/login/Google endpoints require a `Bearer` JWT. Interactive docs are at `/documentation` when `NODE_ENV` is not `production`.

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/health` | Status, environment, version |
| POST | `/api/auth/register` | Email and password |
| POST | `/api/auth/login` | |
| GET | `/api/auth/check-email` | |
| POST | `/api/auth/google` | Google login with a token body |
| GET | `/api/auth/google/callback` | OAuth callback |
| POST | `/api/auth/refresh` | Authenticated |
| GET, PATCH | `/api/profile/me` | |
| PATCH | `/api/profile/avatar` | Multipart |
| GET, DELETE | `/api/users`, `/api/users/:id` | Admin role only |
| GET, POST | `/api/transactions` | POST accepts a notification payload |
| GET | `/api/transactions/summary` | |
| GET, POST | `/api/categories` | |
| GET, PUT, DELETE | `/api/categories/:id` | |
| GET, POST | `/api/merchants` | |
| GET | `/api/merchants/:id` | |
| GET | `/api/reports/period-spending` | Query: `period` |
| GET | `/api/reports/category-breakdown` | Query: `period` |
| GET | `/api/reports/summary` | Query: `period`, optional `categoryId`, `merchantId` |

## Invoice CSV import

`pnpm process-account-statement` runs `src/scripts/process-account-statement.ts`. It reads a semicolon-delimited invoice CSV, inserts transactions, and writes failed rows when any line cannot be imported.

Pass the user id and the input CSV as flags or environment variables. Relative paths are resolved from the current working directory. Failed rows are written to `data/failed/failed_rows.csv` unless you override that path.

```bash
pnpm process-account-statement -- --user-id <userId> --file <path-to.csv>
pnpm process-account-statement -- --user-id <userId> --file <path-to.csv> --failed-output <path>

INVOICE_USER_ID=<userId> INVOICE_CSV_PATH=<path-to.csv> pnpm process-account-statement
INVOICE_FAILED_OUTPUT=<path> pnpm process-account-statement -- --user-id <userId> --file <path-to.csv>
```

Flags override the matching environment variables. The command exits with an error when the user id or input file is missing.

## License

ISC
