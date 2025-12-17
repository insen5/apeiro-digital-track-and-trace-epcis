# Migration Strategy for Production Deployment

## 🚨 Critical Issue Identified

Your **migration files** use `snake_case` column names, but your **actual database** uses `camelCase` column names. This mismatch needs to be resolved before production deployment.

---

## 📊 Current State Analysis

### Database Reality (What's Actually Running)
```
users table columns:
- id, email, password, role, roleId, glnNumber, organization, isDeleted, refreshToken, createdAt, updatedAt

consignments table columns:
- id, eventID, eventType, eventTimestamp, sourceSystem, destinationSystem, consignmentID, 
  manufacturerPPBID, MAHPPBID, manufacturerGLN, MAHGLN, registrationNo, shipmentDate, 
  countryOfOrigin, destinationCountry, totalQuantity, userId, createdAt, updatedAt

batches table columns:
- id, productId, batchno, expiry, qty, sentQty, isEnabled, userId, earlyWarningNotified,
  earlyWarningDate, secondaryNotified, secondaryDate, finalNotified, finalDate, 
  postExpiryNotified, postExpiryDate, createdAt, updatedAt
```

### Migration Files (What Was Supposed to Happen)
```sql
-- From migrations/add_consignments_and_serial_numbers.sql
event_id, event_type, consignment_id, manufacturer_ppb_id, user_id, etc. (snake_case)

-- From schema.sql
role_id, gln_number, is_deleted, product_id, etc. (snake_case)
```

### What Changed
✅ **SnakeNamingStrategy removed** - TypeORM now uses camelCase by default
✅ **Entity overrides removed** - Entities now align with actual database
❌ **Migration files still have snake_case** - Need to be updated or ignored

---

## 🎯 Recommended Strategy for Production

### Option 1: Accept Current Reality (RECOMMENDED) ✅

**Action:** Update migration files to match the actual camelCase database schema.

**Rationale:**
- Your production-like database is already running with camelCase
- Changing the database now would require massive data migration
- Less risky than altering all tables in production

**Steps:**

1. **Audit Current Database Schema**
   ```bash
   # Export current schema as baseline
   cd kenya-tnt-system
   docker-compose exec postgres pg_dump -U tnt_user -d kenya_tnt_db --schema-only > database/schema_actual_$(date +%Y%m%d).sql
   ```

2. **Create New Migration Files**
   - Keep old migration files for history
   - Create new `V10__Baseline_CamelCase_Schema.sql` that matches reality
   - Mark it as already applied in production

3. **Update `schema.sql` to Match Reality**
   - Replace all snake_case with camelCase in `schema.sql`
   - This becomes your source of truth going forward

4. **Document the Decision**
   ```sql
   -- V10__Baseline_CamelCase_Schema.sql
   -- This migration documents the actual schema as of Dec 2025
   -- The database was manually created with camelCase columns
   -- All entities and TypeORM now use camelCase without naming strategy
   -- NO ACTION REQUIRED - This is a documentation migration only
   ```

---

### Option 2: Migrate Database to snake_case (NOT RECOMMENDED) ❌

**Why NOT recommended:**
- Requires altering every table in production
- Risk of data corruption or downtime
- Many foreign key constraints to handle
- Current system works fine with camelCase

**Only consider if:**
- You have no production data yet
- You strongly prefer snake_case for database conventions
- You have time to rewrite and test everything

---

## 📋 Pre-Production Checklist

### Before Deploying to Production:

- [x] Remove SnakeNamingStrategy from TypeORM config
- [x] Clean up entity column name overrides
- [ ] Export current database schema
- [ ] Create V10 baseline migration (documentation only)
- [ ] Update schema.sql to match camelCase reality
- [ ] Test all CRUD operations after changes
- [ ] Test PPB consignment import
- [ ] Test EPCIS event creation
- [ ] Test journey tracking queries
- [ ] Verify all existing data still accessible

---

## 🔧 Migration File Best Practices Going Forward

### New Migration Template (camelCase)
```sql
-- V11__Add_New_Feature.sql
CREATE TABLE IF NOT EXISTS new_feature (
  id SERIAL PRIMARY KEY,
  userId UUID NOT NULL REFERENCES users(id),
  featureName VARCHAR(255) NOT NULL,
  isEnabled BOOLEAN DEFAULT false,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_new_feature_userId ON new_feature(userId);
```

### TypeORM Entity Template (No Overrides Needed)
```typescript
@Entity('new_feature')
export class NewFeature {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' })
  userId: string;

  @Column()
  featureName: string;

  @Column({ default: false })
  isEnabled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

---

## 🚀 Deployment Instructions

### Development Environment
```bash
# 1. Kill current backend
lsof -ti :4000 | xargs kill -9

# 2. Rebuild with changes
cd kenya-tnt-system/core-monolith
npm run build

# 3. Start backend
npm run start:dev
# OR for production mode:
NODE_ENV=production node dist/main.js

# 4. Test login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "ppp@ppp.com", "password": "password"}'
```

### Production Deployment
```bash
# 1. Backup current database
pg_dump -U tnt_user -d kenya_tnt_db > backup_pre_deployment_$(date +%Y%m%d).sql

# 2. Deploy new code (entities without naming strategy)
git pull origin main
npm ci
npm run build

# 3. NO DATABASE MIGRATIONS NEEDED
# (Current schema already matches new entity definitions)

# 4. Restart application
pm2 restart kenya-tnt-backend
# OR
systemctl restart kenya-tnt

# 5. Verify health
curl http://localhost:4000/api/health

# 6. Test critical endpoints
# - Login
# - PPB import
# - EPCIS events
# - Journey tracking
```

---

## ⚠️ Known Issues Resolved

1. ✅ **role_id vs roleId** - Fixed by removing naming strategy
2. ✅ **batch_id vs batchId** - Fixed by removing naming strategy
3. ✅ **serialNumber column not found** - Fixed by removing naming strategy
4. ✅ **Login 500 errors** - Fixed by entity cleanup

---

## 📝 Future Recommendations

1. **Use camelCase for all new tables** - Consistent with current schema
2. **Remove all snake_case migration files** - Replace with camelCase versions
3. **Document schema changes** - Keep MIGRATION_STRATEGY.md updated
4. **Test TypeORM queries** - Ensure no more column name mismatches
5. **Consider migration tool** - Use TypeORM migrations going forward

---

## 🆘 Rollback Plan

If issues occur after deployment:

```bash
# 1. Stop application
pm2 stop kenya-tnt-backend

# 2. Restore previous code version
git checkout <previous-commit-hash>
npm ci
npm run build

# 3. Add back SnakeNamingStrategy temporarily
# Edit database.module.ts:
# namingStrategy: new SnakeNamingStrategy(),

# 4. Add back column overrides to entities
# (Refer to git history for previous versions)

# 5. Restart
pm2 start kenya-tnt-backend
```

---

## 📞 Support

For issues or questions:
1. Check backend logs: `tail -f /tmp/backend-*.log`
2. Check database connectivity: `docker-compose exec postgres psql -U tnt_user -d kenya_tnt_db -c "SELECT 1;"`
3. Verify TypeORM connection: Check application startup logs

---

**Last Updated:** December 9, 2025  
**Status:** ✅ Changes Implemented - Ready for Testing
