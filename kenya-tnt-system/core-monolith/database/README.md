# Database Setup

## Step 1: Create PostgreSQL Database

### Option A: Using Docker (Recommended for Development)

```bash
docker run --name kenya-tnt-postgres \
  -e POSTGRES_DB=kenya_tnt_db \
  -e POSTGRES_USER=tnt_user \
  -e POSTGRES_PASSWORD=tnt_password \
  -p 5433:5432 \
  -d postgres:15-alpine
```

### Option B: Using Local PostgreSQL

```bash
createdb kenya_tnt_db
```

## Step 2: Enable PostGIS Extension

```bash
psql -U tnt_user -d kenya_tnt_db -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

Or if using local PostgreSQL:

```bash
psql -d kenya_tnt_db -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

## Step 3: Run Schema Migration

The schema is defined in TypeORM entities. Run migrations:

```bash
npm run typeorm migration:run
```

Or manually run the SQL from `schema.sql` if needed.

## Environment Variables

Add to `.env`:

```env
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=tnt_user
DB_PASSWORD=tnt_password
DB_DATABASE=kenya_tnt_db
```

