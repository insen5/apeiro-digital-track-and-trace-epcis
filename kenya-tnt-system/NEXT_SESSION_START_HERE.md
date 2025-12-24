# Next Session - Start Here

**Current Status:** 263 compilation errors (56% reduction from 600)  
**Phase:** Backend migration 78% complete

---

## 🎯 Quick Start for Next Session

### 1. Check Current Errors
```bash
cd core-monolith
npm run build 2>&1 | grep -c "ERROR"
# Should show ~260-270 errors
```

### 2. Main Error Categories
- **Array type issues:** ~35 errors (manual fixes needed)
- **Analytics services:** ~100 errors (property access)
- **GS1 helpers:** ~50 errors
- **Other services:** ~75 errors

### 3. Strategy
- Fix one service file at a time
- Test compile after each fix
- Use targeted sed for patterns
- Manual review for complex files

---

## 📋 Priority Files to Fix

### High Priority (blocks testing):
1. ✅ batch.service.ts (DONE)
2. ✅ consignment.service.ts (DONE)
3. ✅ auth.service.ts (DONE)
4. Fix remaining analytics services
5. Fix GS1 helper services

### Medium Priority:
- ppb-batch services
- recall service
- epcis-backfill

---

## 🔧 Common Fix Patterns

```bash
# Fix property access
sed -i '' 's/\.userId/\.user_id/g' file.ts

# Fix where clauses
sed -i '' 's/where: { userId/where: { user_id: userId/g' file.ts

# Fix shorthand
sed -i '' 's/{ userId,/{ user_id: userId,/g' file.ts
```

---

**Time to 0 errors:** 2-3 hours  
**Then:** Frontend (3-4 hours) + Testing (2 hours)

**Last Updated:** Dec 22, 2025 03:45 UTC

