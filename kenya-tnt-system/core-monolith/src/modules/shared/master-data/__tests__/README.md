# Master Data Testing

**Last Updated:** December 17, 2025  
**Purpose:** Testing documentation for master data quality system

---

## 🧪 Test Files

### Unit Tests

| File | Purpose | Coverage |
|------|---------|----------|
| `master-data-quality.service.spec.ts` | Quality audit service | 764 lines, comprehensive |
| `generic-quality-report.service.spec.ts` | Generic report generation | Config-driven tests |
| `generic-quality-report-product.service.spec.ts` | Product-specific reports | Product quality logic |
| `generic-sync.service.spec.ts` | Sync orchestration | All sync strategies |
| `generic-sync-logging.service.spec.ts` | Sync logging | Log persistence |

### Integration Tests

| File | Purpose | Coverage |
|------|---------|----------|
| `master-data-sync-logging.integration.spec.ts` | End-to-end sync logging | Full flow with database |

---

## 🚀 Running Tests

### Run All Master Data Tests

```bash
cd kenya-tnt-system/core-monolith
npm test master-data
```

### Run Specific Test File

```bash
npm test master-data-quality.service
npm test generic-quality-report.service
npm test master-data-sync-logging.integration
```

### Run with Coverage

```bash
npm test -- --coverage master-data
```

---

## 📊 Test Coverage Goals

| Component | Target | Current |
|-----------|--------|---------|
| Quality Audit Service | >90% | ~95% |
| Generic Sync Service | >85% | ~90% |
| Quality Report Service | >90% | ~92% |
| Sync Logging | >80% | ~85% |

---

## 🧩 Test Structure

### Quality Audit Tests

```typescript
describe('MasterDataQualityService', () => {
  describe('calculateQualityScore', () => {
    // Tests for score calculation logic
  });
  
  describe('generateQualityReport', () => {
    // Tests for report generation
  });
  
  describe('enrichQualityReport', () => {
    // Tests for enrichment logic
  });
});
```

### Sync Tests

```typescript
describe('GenericSyncService', () => {
  describe('triggerSync', () => {
    // Tests for sync orchestration
  });
  
  describe('logSyncAttempt', () => {
    // Tests for sync logging
  });
});
```

---

## 🔧 Test Utilities

### Mock Data

Test files include comprehensive mock data for:
- Products with various quality scores
- Premises with different completeness levels
- Facilities (UAT/Prod) with real-world edge cases
- Sync logs with different statuses

### Test Helpers

```typescript
// Create test product with specific quality issues
const testProduct = createMockProduct({
  missingGTIN: true,
  invalidDate: true
});

// Create test quality report
const testReport = createMockQualityReport({
  overallScore: 75.0,
  completeness: 80.0
});
```

---

## ⚠️ Common Test Scenarios

### Completeness Calculation

- All fields populated (100%)
- Some required fields missing (partial)
- All fields empty (0%)
- Optional vs required field logic

### Validity Testing

- Valid data formats
- Invalid dates (future manufacturing)
- Invalid GTINs (bad check digit)
- Invalid GLNs

### Consistency Testing

- Duplicate detection
- Conflicting data
- Cross-entity validation

### Timeliness Testing

- Data < 24 hours old (excellent)
- Data 1-7 days old (good)
- Data > 7 days old (stale)
- Never synced data

---

## 📝 Adding New Tests

When adding new entity types:

1. **Create Mock Data**: Add mock factory for new entity
2. **Quality Tests**: Test quality calculation for entity-specific dimensions
3. **Sync Tests**: Test sync orchestration for new entity type
4. **Integration Tests**: End-to-end test with database
5. **Update Config**: Ensure test config matches production config

Example:
```typescript
describe('New Entity Quality', () => {
  it('should calculate completeness correctly', () => {
    const entity = createMockNewEntity({ missingFields: ['field1'] });
    const score = calculateCompleteness(entity);
    expect(score).toBeLessThan(100);
  });
});
```

---

## 🐛 Debugging Tests

### Enable Verbose Logging

```bash
npm test -- --verbose master-data
```

### Debug Single Test

```bash
npm test -- --testNamePattern="should calculate quality score" master-data-quality
```

### Watch Mode

```bash
npm test -- --watch master-data
```

---

## 📚 Related Documentation

- **[../README.md](../README.md)** - Master data module overview
- **[../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)** - System architecture
- **[../docs/QUALITY_PARAMETERS.md](../docs/QUALITY_PARAMETERS.md)** - Calculation logic

---

**Maintained By**: Backend Team  
**Test Framework**: Jest  
**CI/CD**: Tests run on every PR
