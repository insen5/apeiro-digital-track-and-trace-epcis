# Database & TypeORM Naming Standard - IMPLEMENTED

**Date:** December 11, 2025  
**Status:** ✅ EXECUTED AND ACTIVE  

## ✅ What Was Decided

After analysis of 679 backend + 190 frontend references:

1. **NEW tables:** snake_case DB + camelCase entities
2. **LEGACY tables:** Keep camelCase (no migration)
3. **Pattern:** Follow EPCIS entities

## 📋 THE STANDARD

### New Tables
```sql
-- Database: snake_case
CREATE TABLE product_audits (
  user_id UUID,
  created_at TIMESTAMP
);
```

```typescript
// Entity: camelCase + overrides
@Entity('product_audits')
export class ProductAudit {
  @Column({ name: 'user_id' })
  userId: string;  // API: { "userId": "..." }
  
  @Column({ name: 'created_at' })
  createdAt: Date;
}
```

### Legacy Tables (users, batches, consignments)
```typescript
// Keep as-is - no overrides
@Entity('users')
export class User {
  @Column()
  roleId: number;  // DB column already "roleId"
}
```

## 🎯 Why?

- 679 backend camelCase refs
- 190 frontend camelCase refs
- No serialization layer exists
- Migration would take 120+ hours + break frontend

## 📚 Gold Standard

Follow these examples:
- `epcis-event.entity.ts`
- `facility-inventory.entity.ts`
- `product-status.entity.ts`

## ✅ Implementation

- [x] Updated .cursorrules
- [x] Documented standard
- [ ] Use for all new development

**Last Updated:** December 11, 2025  
**Reference:** FINAL_RECOMMENDATION_CAMEL_VS_SNAKE.md
