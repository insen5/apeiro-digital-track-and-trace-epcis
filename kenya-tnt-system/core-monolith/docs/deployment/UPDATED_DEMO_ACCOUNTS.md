# Updated Demo Accounts

All demo accounts now use the password: **`password`**

## Demo Accounts

### 1. PPB (Regulator)
- **Email**: `ppp@ppp.com`
- **Password**: `password`
- **Role**: `dha` (Regulator)
- **Organization**: PPB
- **GLN**: 9999999999999
- **Redirects to**: `/regulator/ppb-batches`

### 2. Test Manufacturer
- **Email**: `test-manufacturer@pharma.ke`
- **Password**: `password`
- **Role**: `manufacturer`
- **Organization**: Test Manufacturer
- **GLN**: `6164003000000`
- **Redirects to**: `/manufacturer/batches`

### 3. KEMSA (Supplier/Distributor)
- **Email**: `kemsa@health.ke`
- **Password**: `password`
- **Role**: `cpa` (Supplier/Distributor)
- **Organization**: KEMSA
- **GLN**: `0614141000013`
- **Redirects to**: `/distributor/shipments`

### 4. Kenyatta National Hospital (Facility)
- **Email**: `facility1@health.ke`
- **Password**: `password`
- **Role**: `user_facility` (Health Facility)
- **Organization**: Kenyatta National Hospital
- **GLN**: `0614141000020`
- **Redirects to**: `/` (home page - no specific module yet)

---

## Apply the Updated Demo Accounts

### Option 1: Run Migration (Update Existing Users)
```bash
cd /Users/apeiro/apeiro-digital-track-and-trace-epcis/kenya-tnt-system

# Apply the migration
docker-compose exec -T postgres psql -U tnt_user -d kenya_tnt_db < core-monolith/database/migrations/update_demo_users.sql
```

### Option 2: Fresh Database (Start from Scratch)
```bash
cd /Users/apeiro/apeiro-digital-track-and-trace-epcis/kenya-tnt-system

# Drop and recreate database
docker-compose exec -T postgres psql -U tnt_user -d postgres -c "DROP DATABASE IF EXISTS kenya_tnt_db;"
docker-compose exec -T postgres psql -U tnt_user -d postgres -c "CREATE DATABASE kenya_tnt_db;"

# Apply schema and seed
docker-compose exec -T postgres psql -U tnt_user -d kenya_tnt_db < core-monolith/database/schema.sql
./scripts/seed-database.sh
```

---

## Testing Manufacturer Consignments

To test the manufacturer consignments page with the new GLN:

1. **Login as PPB** (`ppp@ppp.com` / `password`)
2. Go to `/regulator/ppb-batches`
3. Click "Import Consignment JSON"
4. Use test JSON with **manufacturerGLN: "6164003000000"** (Test Manufacturer's GLN)
5. Import the consignment
6. **Logout** and **login as Test Manufacturer** (`test-manufacturer@pharma.ke` / `password`)
7. Go to `/manufacturer/consignments`
8. You should see the consignment filtered for your GLN!

---

## Changes Made

### Backend:
- ✅ Updated `seed.sql` with new demo accounts
- ✅ Created migration script: `database/migrations/update_demo_users.sql`
- ✅ All passwords changed to: `password`

### Frontend:
- ✅ Updated login page quick login buttons
- ✅ Added GLN numbers to display
- ✅ Updated redirect logic to handle `user_facility` role
- ✅ Changed all passwords to `password`

---

## Next Steps

1. **Apply the migration** (see above)
2. **Restart the backend** if it's running:
   ```bash
   cd core-monolith
   npm run start:dev
   ```
3. **Test login** at `http://localhost:3002/login`
4. **Import a consignment** as PPB with the correct manufacturer GLN
5. **View consignments** as Test Manufacturer
