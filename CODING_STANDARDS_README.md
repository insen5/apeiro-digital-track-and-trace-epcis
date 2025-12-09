# Coding Standards & Cursor AI Integration

This document explains how the coding standards are enforced and how to use them with Cursor AI.

---

## 📚 Documentation Structure

```
Project Root/
├── .cursorrules                           # ← Cursor AI automatically reads this
├── DATABASE_NAMING_AUDIT.md              # Complete audit of current state
├── CODING_STANDARDS_README.md            # ← You are here
│
└── kenya-tnt-system/
    ├── database/
    │   ├── SCHEMA_STANDARDS.md           # Database naming quick reference
    │   └── migrations/
    │       └── MIGRATION_TEMPLATE.sql    # Copy this for new migrations
    │
    └── core-monolith/src/shared/domain/entities/
        ├── ENTITY_TEMPLATE.ts            # Copy this for new entities
        ├── epcis-event.entity.ts         # Gold standard example
        ├── facility-inventory.entity.ts  # Another good example
        └── ... other entities
```

---

## 🤖 How Cursor AI Uses These Files

### Automatic Context (Always Loaded)

1. **`.cursorrules`** - Cursor automatically loads this in **every conversation**
   - Contains all critical rules
   - Database naming conventions
   - TypeORM best practices
   - Project structure guidelines

### Manual Context (Use @ Symbol)

When asking Cursor to create database features, reference these files:

```
@.cursorrules @database/SCHEMA_STANDARDS.md @epcis-event.entity.ts

Create a new facility_orders table and entity following our standards.
```

This ensures Cursor has the right examples and conventions in context.

---

## 🎯 Common Workflows

### Creating a New Database Table + Entity

**Step 1**: Check existing schema
```bash
cd kenya-tnt-system
docker-compose exec postgres psql -U tnt_user -d kenya_tnt_db -c "\dt"
docker-compose exec postgres psql -U tnt_user -d kenya_tnt_db -c "\d similar_table"
```

**Step 2**: Ask Cursor (with context)
```
@.cursorrules @database/SCHEMA_STANDARDS.md @ENTITY_TEMPLATE.ts @MIGRATION_TEMPLATE.sql

Create a facility_orders feature with:
- Table: facility_orders (from_facility_user_id, to_facility_user_id, product_id, quantity)
- Entity: FacilityOrder
- Migration: V12__Add_Facility_Orders.sql

Follow snake_case convention for all columns.
```

**Step 3**: Verify output
- [ ] Migration uses snake_case for ALL columns
- [ ] Entity properties match database columns exactly
- [ ] No unnecessary `@Column({ name: ... })` overrides
- [ ] Entity registered in `database.module.ts`

**Step 4**: Test
```bash
# Apply migration
npm run migration:run

# Test entity
# In your service:
await this.facilityOrderRepository.findOne({ where: { id: 1 } });
```

---

### Reviewing Cursor's Code

When Cursor generates database code, check:

✅ **DO** - Correct patterns:
```typescript
// Entity with snake_case properties
@Entity('facility_orders')
export class FacilityOrder {
  @Column({ type: 'uuid' })
  from_facility_user_id: string;  // ✅ Matches DB column
  
  @Column()
  created_at: Date;  // ✅ Matches DB column
}
```

❌ **DON'T** - Incorrect patterns:
```typescript
// Entity with camelCase properties
@Column()
fromFacilityUserId: string;  // ❌ Doesn't match DB

@Column({ name: 'from_facility_user_id' })
fromFacilityUserId: string;  // ❌ Unnecessary override
```

---

### Updating Cursor's Context Mid-Conversation

If Cursor starts using wrong conventions:

```
Stop! Please review @.cursorrules again.

All database columns MUST use snake_case, not camelCase.
The entity properties should be: from_facility_user_id, not fromFacilityUserId.

Please regenerate following the snake_case standard.
```

---

## 📖 Quick Reference Cards

### Database Naming

| Type | Format | Example |
|------|--------|---------|
| Table | plural_snake_case | `facility_orders` |
| Column | snake_case | `user_id`, `created_at` |
| Foreign Key | {table}_id | `user_id`, `batch_id` |
| Boolean | is_{adj} / has_{noun} | `is_active`, `has_error` |
| Timestamp | {event}_at | `created_at`, `processed_at` |

### TypeORM Entity

| Element | Convention | Example |
|---------|-----------|---------|
| Class Name | PascalCase | `FacilityOrder` |
| Property Name | snake_case | `user_id`, `created_at` |
| Table Name | plural_snake_case | `@Entity('facility_orders')` |
| Column Decorator | Minimal | `@Column()` (no name override) |

---

## 🔍 Templates & Examples

### Copy-Paste Templates

**New Entity** → Copy `src/shared/domain/entities/ENTITY_TEMPLATE.ts`

**New Migration** → Copy `database/migrations/MIGRATION_TEMPLATE.sql`

### Gold Standard Examples

**Best entity example** → `src/shared/domain/entities/epcis-event.entity.ts`
- 17 snake_case properties
- Proper indexes
- Clear relationships

**Good migration example** → Look at existing V* files in migrations/

---

## 🚨 Common Mistakes & Fixes

### Mistake 1: Cursor uses camelCase

**Wrong**:
```typescript
@Column()
userId: string;
```

**Fix**:
```
Please use snake_case for the property name to match the database column:

@Column()
user_id: string;
```

### Mistake 2: Unnecessary name overrides

**Wrong**:
```typescript
@Column({ name: 'user_id' })
user_id: string;
```

**Fix**:
```
Remove the name override since the property already matches the column:

@Column()
user_id: string;
```

### Mistake 3: SQL with camelCase

**Wrong**:
```sql
CREATE TABLE orders (
  userId UUID NOT NULL
);
```

**Fix**:
```
Use snake_case in SQL:

CREATE TABLE orders (
  user_id UUID NOT NULL
);
```

---

## 🛠️ Maintaining Standards

### When Adding New Team Members

1. Share this file: `CODING_STANDARDS_README.md`
2. Review `.cursorrules` together
3. Walk through an example using templates
4. Show how to use `@` references with Cursor

### When Standards Evolve

1. Update `.cursorrules` first
2. Update templates (ENTITY_TEMPLATE.ts, MIGRATION_TEMPLATE.sql)
3. Update SCHEMA_STANDARDS.md
4. Announce changes to team

### Monthly Review

- Check for new entities not following standards
- Look for manual `@Column({ name: ... })` overrides
- Review recent migrations for consistency

---

## 💡 Pro Tips

### Tip 1: Always Start with Schema Check
Before asking Cursor to generate anything database-related:
```bash
\d existing_similar_table
```
This shows you the actual column names to follow.

### Tip 2: Use Multiple References
Don't just rely on `.cursorrules`. Add specific examples:
```
@.cursorrules @epcis-event.entity.ts @facility-inventory.entity.ts

Create a new tracking entity similar to EPCIS events.
```

### Tip 3: Correct Cursor Early
If you see camelCase in the first response, stop immediately:
```
Stop! Review @.cursorrules - we use snake_case for database columns.
```

### Tip 4: Keep Templates Updated
When you create a particularly good entity/migration, consider updating the templates.

---

## 🎓 Learning Resources

### Internal Docs
- `DATABASE_NAMING_AUDIT.md` - Why we standardized to snake_case
- `SNAKE_NAMING_STRATEGY_REMOVAL_SUMMARY.md` - What we fixed
- `MIGRATION_STRATEGY.md` - Migration planning

### External Resources
- [PostgreSQL Naming Conventions](https://www.postgresql.org/docs/current/sql-syntax-lexical.html)
- [TypeORM Best Practices](https://typeorm.io/entities)
- [GS1 EPCIS Standard](https://www.gs1.org/standards/epcis)

---

## 🆘 Getting Help

### If Cursor Keeps Making Mistakes
1. Clear the conversation and start fresh
2. Explicitly reference `.cursorrules` at the start:
   ```
   @.cursorrules
   
   Please review our database standards before we begin.
   All database columns must use snake_case.
   ```

### If You're Unsure About a Convention
1. Check existing similar code (e.g., `epcis-event.entity.ts`)
2. Review `SCHEMA_STANDARDS.md`
3. Check actual database: `\d table_name`
4. Ask the team

---

## ✅ Pre-Commit Checklist

Before committing any database-related changes:

- [ ] All table names are plural_snake_case
- [ ] All column names are snake_case
- [ ] Entity properties match database columns exactly
- [ ] No unnecessary `@Column({ name: ... })` overrides
- [ ] Entity registered in `database.module.ts`
- [ ] Migration tested in development
- [ ] Indexes created for foreign keys
- [ ] TypeScript compiles without errors
- [ ] `.cursorrules` was followed

---

**Questions?** Review `.cursorrules` or ask the team!

**Last Updated**: December 9, 2025

