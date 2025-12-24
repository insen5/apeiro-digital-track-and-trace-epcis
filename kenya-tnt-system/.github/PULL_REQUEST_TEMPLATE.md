# Pull Request

## 🎯 Deployment Target

- [ ] **Staging** (`167.172.76.83`) - Demos & QA
- [ ] **Production** (Company servers) - Live deployment

---

## ✅ Pre-merge Checklist

### Required Checks
- [ ] All GitHub Actions CI checks passing ✅
- [ ] No failing tests
- [ ] No security vulnerabilities
- [ ] Code reviewed (staging: self-review OK, main: **requires 1 approval**)

### Coverage Requirements
- [ ] **Staging**: 70% test coverage met
- [ ] **Production**: 80% test coverage met
- [ ] E2E tests passing (production only)
- [ ] Load tests passing (staging: 100 users, production: 1000 users)

### Code Quality
- [ ] Linting passed (no warnings)
- [ ] Type checking passed (TypeScript strict mode)
- [ ] No `console.log` statements in production code
- [ ] No TODO/FIXME comments without GitHub issue links

### Database & Migrations
- [ ] New entities follow snake_case (DB) + camelCase (code) naming standard
- [ ] Migration files tested on copy of production data
- [ ] Migration is reversible (if applicable)
- [ ] Database changes documented in migration file comments

### Documentation
- [ ] README updated (if public API changed)
- [ ] API documentation updated (Swagger/OpenAPI)
- [ ] Environment variables documented in `.env.*.template` files
- [ ] DOCUMENTATION_INDEX.md updated (if new docs added)

### Security & Compliance
- [ ] No secrets or API keys in code
- [ ] No Personal Identifiable Information (PII) in logs
- [ ] GS1 identifiers validated (GTIN, GLN, SSCC)
- [ ] EPCIS events follow GS1 2.0 standard

---

## 📋 Changes Description

### What does this PR do?
<!-- Brief description of the changes -->


### Why is this change needed?
<!-- Business justification or problem being solved -->


### How was this tested?
<!-- Describe your testing approach -->


---

## 🔗 Related Issues

<!-- Link to GitHub issues, Jira tickets, or other tracking -->
Closes #
Related to #

---

## 📸 Screenshots (if UI changes)

<!-- Add screenshots or screen recordings for frontend changes -->


---

## 🚨 Breaking Changes

- [ ] **No breaking changes**
- [ ] **Contains breaking changes** (describe below)

<!-- If breaking changes, describe migration path for existing users -->


---

## 📝 Deployment Notes

### Environment Variables
<!-- List any new or changed environment variables -->
- [ ] No new environment variables
- [ ] New variables added to `.env.*.template` files

### Post-Deployment Steps
<!-- Any manual steps required after deployment? -->
- [ ] No manual steps required
- [ ] Manual steps required (describe below)


---

## 🧪 Testing Checklist (Optional)

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated (if production)
- [ ] Load tests updated (if performance-critical)
- [ ] Tested locally with `docker-compose.dev.yml`
- [ ] Tested with staging environment configuration

---

## ⚠️ Reviewer Notes

<!-- Anything specific you want reviewers to focus on? -->


---

**Remember:** 
- ✅ Wait for all CI checks to pass before merging
- ✅ Staging merges can be self-reviewed
- ✅ Production merges **require 1 approval + manual deployment approval**
- ❌ Never push directly to `staging` or `main` branches


