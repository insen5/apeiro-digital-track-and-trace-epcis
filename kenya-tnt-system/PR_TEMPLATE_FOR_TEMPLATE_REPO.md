# Pull Request Template for project-template-standard

This template should be copied to your template repository at:
**https://github.com/insen5/project-template-standard/.github/PULL_REQUEST_TEMPLATE.md**

---

## 📋 Instructions for Use

1. Copy this file to `.github/PULL_REQUEST_TEMPLATE.md` in your template repo
2. When creating new projects from template, this PR template will be included
3. Customize per project by removing irrelevant sections

---

## 🎯 Generic PR Template (Copy content below)

```markdown
# Pull Request

## 🎯 Deployment Target

- [ ] **Development** - Fast iteration, local testing
- [ ] **Staging** - QA, demos, production-like testing
- [ ] **Production** - Live deployment

---

## ✅ Pre-merge Checklist

### Required Checks
- [ ] All GitHub Actions CI checks passing ✅
- [ ] No failing tests
- [ ] No security vulnerabilities
- [ ] Code reviewed

### Coverage Requirements (adjust per environment)
- [ ] **Development**: No coverage requirement
- [ ] **Staging**: 70% test coverage met
- [ ] **Production**: 80% test coverage met

### Code Quality
- [ ] Linting passed (no warnings)
- [ ] Type checking passed
- [ ] No `console.log` statements in production code
- [ ] No TODO/FIXME comments without issue links

### Database & Migrations (if applicable)
- [ ] Migration files tested
- [ ] Migration is reversible (if applicable)
- [ ] Database changes documented

### Documentation
- [ ] README updated (if public API changed)
- [ ] API documentation updated
- [ ] Environment variables documented in `.env.*.template` files

### Security
- [ ] No secrets or API keys in code
- [ ] No Personal Identifiable Information (PII) in logs
- [ ] Dependencies updated and scanned

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

Closes #
Related to #

---

## 📸 Screenshots (if UI changes)

<!-- Add screenshots or screen recordings for frontend changes -->


---

## 🚨 Breaking Changes

- [ ] **No breaking changes**
- [ ] **Contains breaking changes** (describe below)


---

## 📝 Deployment Notes

### Environment Variables
- [ ] No new environment variables
- [ ] New variables added to `.env.*.template` files

### Post-Deployment Steps
- [ ] No manual steps required
- [ ] Manual steps required (describe below)


---

## ⚠️ Reviewer Notes

<!-- Anything specific you want reviewers to focus on? -->


---

**Remember:** 
- ✅ Wait for all CI checks to pass before merging
- ✅ Staging merges can be self-reviewed
- ✅ Production merges require approval
- ❌ Never push directly to protected branches
```

---

## 🎨 Customization Guide

### For Healthcare/Pharma Projects (like kenya-tnt-system)
**Add these sections:**
```markdown
### Industry-Specific Compliance
- [ ] GS1 identifiers validated (GTIN, GLN, SSCC)
- [ ] EPCIS events follow GS1 2.0 standard
- [ ] Regulatory compliance verified (PPB, FDA, etc.)
```

### For E-commerce Projects
**Add these sections:**
```markdown
### E-commerce Specific
- [ ] Payment integration tested
- [ ] Order flow verified
- [ ] Inventory updates working
- [ ] Email notifications functional
```

### For Internal Tools
**Simplify to:**
```markdown
### Basic Checks
- [ ] CI checks passing
- [ ] Tested locally
- [ ] Documentation updated
```

---

## 🔄 Adding to Template Repository

```bash
# Clone template repo
git clone https://github.com/insen5/project-template-standard.git
cd project-template-standard

# Create .github directory
mkdir -p .github

# Create PR template (copy the generic template above)
# Save to: .github/PULL_REQUEST_TEMPLATE.md

# Commit and push
git add .github/PULL_REQUEST_TEMPLATE.md
git commit -m "feat: Add PR template with CI/CD checklist"
git push origin main
```

---

## 📚 Related Files to Add to Template

Consider also adding:
1. `.github/workflows/ci-dev.yml` - Development CI
2. `.github/workflows/ci-staging.yml` - Staging CI
3. `.github/workflows/ci-production.yml` - Production CI
4. `.github/CODEOWNERS` - Code ownership (free tier alternative to branch protection)
5. `NFR_MATRIX.md` - Non-functional requirements
6. `docker-compose.dev.yml` - Development environment
7. `docker-compose.staging.yml` - Staging environment
8. `docker-compose.production.yml` - Production environment

---

**Created**: December 20, 2025
**Purpose**: Standardize PR process across all projects
**Benefits**: Consistency, quality checks, CI/CD alignment


