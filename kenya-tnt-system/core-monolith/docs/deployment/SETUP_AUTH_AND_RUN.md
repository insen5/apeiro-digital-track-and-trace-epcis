# Setup Authentication and Run Application

## What Changed

### 1. **User Table - Added Password Column**
- Added `password` column to `users` table (nullable for backward compatibility)
- Updated User entity in TypeORM
- Updated schema.sql and seed.sql

### 2. **Demo Users with Passwords**
Three demo users are now available:
- **PPB (Regulator)**: `ppp@ppp.com` / `ppp`
- **Ranbaxy (Manufacturer)**: `ranbaxy@ranbaxy.com` / `ranbaxy`
- **KEMSA (Distributor)**: `kemsa@kemsa.com` / `kemsa`

### 3. **Authentication System**
- Simple login/logout system
- Role-based redirection after login
- Session stored in localStorage
- Backend validation via `/api/auth/login` endpoint

---

## Step-by-Step Setup Instructions

### Step 1: Apply Database Migration (Add Password Column)

If your database already exists, you need to add the password column:

```bash
cd /Users/apeiro/apeiro-digital-track-and-trace-epcis/kenya-tnt-system

# Run migration to add password column
docker-compose exec -T postgres psql -U tnt_user -d kenya_tnt_db < core-monolith/database/migrations/add_password_to_users.sql
```

**OR** if you want a fresh database:

```bash
cd /Users/apeiro/apeiro-digital-track-and-trace-epcis/kenya-tnt-system

# Drop and recreate database (WARNING: This deletes all data!)
docker-compose exec -T postgres psql -U tnt_user -d postgres -c "DROP DATABASE IF EXISTS kenya_tnt_db;"
docker-compose exec -T postgres psql -U tnt_user -d postgres -c "CREATE DATABASE kenya_tnt_db;"

# Run schema
docker-compose exec -T postgres psql -U tnt_user -d kenya_tnt_db < core-monolith/database/schema.sql

# Run seed data
./scripts/seed-database.sh
```

### Step 2: Verify Database

```bash
# Check that users have passwords
docker-compose exec -T postgres psql -U tnt_user -d kenya_tnt_db -c "SELECT email, password, organization, role FROM users WHERE password IS NOT NULL;"
```

You should see:
```
         email         | password |  organization  | role
-----------------------+----------+----------------+------
 ppp@ppp.com           | ppp      | ppp            | dha
 ranbaxy@ranbaxy.com   | ranbaxy  | Ranbaxy        | manufacturer
 kemsa@kemsa.com       | kemsa    | KEMSA          | cpa
```

### Step 3: Start Backend (if not running)

```bash
cd /Users/apeiro/apeiro-digital-track-and-trace-epcis/kenya-tnt-system/core-monolith
npm run start:dev
```

The backend should start on `http://localhost:4000/api`

### Step 4: Start Frontend (if not running)

```bash
cd /Users/apeiro/apeiro-digital-track-and-trace-epcis/kenya-tnt-system/frontend
npm run dev
```

The frontend should start on `http://localhost:3002`

### Step 5: Test Authentication

1. Open browser to `http://localhost:3002`
2. Click "Login" button
3. Use any of the demo credentials:
   - PPB: `ppp@ppp.com` / `ppp` → Redirects to `/regulator/ppb-batches`
   - Ranbaxy: `ranbaxy@ranbaxy.com` / `ranbaxy` → Redirects to `/manufacturer/batches`
   - KEMSA: `kemsa@kemsa.com` / `kemsa` → Redirects to `/distributor/shipments`

---

## About Manufacturer Consignments Page

The manufacturer consignments page (`/manufacturer/consignments`) **DOES show a table**. The issue is that it might be empty because:

### Why It Shows "No consignments found":

1. **No consignments imported yet**: Consignments are imported by the PPB (regulator) via the import JSON feature at `/regulator/ppb-batches`

2. **Filtering by GLN/PPBID**: The manufacturer endpoint filters consignments to only show those that match:
   - The user's GLN number, OR
   - The manufacturer's PPBID from their organization

### How to Test:

1. **Login as PPB** (`ppp@ppp.com` / `ppp`)
2. Go to `/regulator/ppb-batches`
3. Click "Import Consignment JSON" button
4. Paste test consignment JSON (see `PPB_TEST_JSON.json`)
5. Make sure the JSON has `manufacturerGLN: "8888888888888"` (Ranbaxy's GLN)
6. Import the consignment
7. **Logout** and **login as Ranbaxy** (`ranbaxy@ranbaxy.com` / `ranbaxy`)
8. Go to `/manufacturer/consignments`
9. You should now see the consignment in the table!

### The Filter Logic:

```typescript
// In consignment.service.ts - findAllForManufacturer()
if (user.glnNumber) {
  filter.manufacturerGLN = user.glnNumber; // Filters by user's GLN
}
```

So for Ranbaxy user with GLN `8888888888888`, it will only show consignments where `manufacturerGLN = '8888888888888'`

---

## Troubleshooting

### Backend Not Starting
```bash
# Check if postgres is running
docker-compose ps

# Check backend logs
cd core-monolith
npm run start:dev
```

### Frontend Not Starting
```bash
cd frontend
npm install  # If node_modules missing
npm run dev
```

### Login Fails with "Invalid email or password"
- Make sure you ran the migration to add password column
- Verify passwords exist in database (see Step 2)
- Check browser console for API errors

### Manufacturer Consignments Empty
- Import a consignment as PPB first
- Make sure consignment JSON has correct manufacturerGLN
- Check that user's GLN matches consignment's manufacturerGLN

---

## Quick Start (All-in-One)

```bash
# Navigate to project
cd /Users/apeiro/apeiro-digital-track-and-trace-epcis/kenya-tnt-system

# Ensure postgres is running
docker-compose up -d postgres

# Add password column (safe to run multiple times)
docker-compose exec -T postgres psql -U tnt_user -d kenya_tnt_db < core-monolith/database/migrations/add_password_to_users.sql

# Start backend in one terminal
cd core-monolith && npm run start:dev

# Start frontend in another terminal
cd frontend && npm run dev

# Open browser
open http://localhost:3002
```

## Production Notes

⚠️ **For production, you MUST**:
1. Use bcrypt to hash passwords
2. Use JWT tokens instead of localStorage
3. Add refresh token rotation
4. Add rate limiting on auth endpoints
5. Use HTTPS only
6. Add CORS restrictions
7. Add session timeout
