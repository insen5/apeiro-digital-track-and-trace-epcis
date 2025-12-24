# 📋 Instructions: Adding PR Template to Template Repository

**Target Repository**: https://github.com/insen5/project-template-standard  
**Date**: December 20, 2025

---

## 🎯 Quick Steps

```bash
# 1. Clone the template repository
cd ~/repos  # or your preferred location
git clone https://github.com/insen5/project-template-standard.git
cd project-template-standard

# 2. Create .github directory if it doesn't exist
mkdir -p .github

# 3. Copy the PR template
# You can either:
# A) Copy from kenya-tnt-system (includes healthcare-specific items)
cp /Users/apeiro/apeiro-digital-track-and-trace-epcis/kenya-tnt-system/.github/PULL_REQUEST_TEMPLATE.md .github/

# B) Use the generic version from PR_TEMPLATE_FOR_TEMPLATE_REPO.md
# (Copy the markdown content inside the code block)

# 4. Commit and push
git add .github/PULL_REQUEST_TEMPLATE.md
git commit -m "feat: Add PR template with CI/CD checklist

- Comprehensive PR checklist for all projects
- Includes deployment target selection
- Coverage requirements (70% staging, 80% production)
- Security, documentation, and code quality checks
- Customizable per project type"

git push origin main
```

---

## 📝 Generic Template Content

For the template repository, use this **simplified version** (copy content below):

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

### Coverage Requirements
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

## 🎨 Customization Per Project Type

### Keep Generic Sections For All Projects:
- ✅ Deployment target
- ✅ CI checks
- ✅ Code quality
- ✅ Documentation
- ✅ Security basics

### Add Industry-Specific Sections As Needed:

#### Healthcare/Pharma (like kenya-tnt-system)
```markdown
### Industry-Specific Compliance
- [ ] GS1 identifiers validated (GTIN, GLN, SSCC)
- [ ] EPCIS events follow GS1 2.0 standard
- [ ] Regulatory compliance verified (PPB, FDA, etc.)
```

#### E-commerce
```markdown
### E-commerce Specific
- [ ] Payment integration tested
- [ ] Order flow verified
- [ ] Inventory updates working
- [ ] Email notifications functional
```

#### Financial Services
```markdown
### Financial Compliance
- [ ] PCI DSS compliance verified
- [ ] Transaction logs complete
- [ ] Audit trail maintained
- [ ] Encryption validated
```

---

## ✅ After Adding to Template Repo

### Test the Template
```bash
# Create a new project from template
gh repo create test-new-project --template insen5/project-template-standard

# Verify PR template exists
cd test-new-project
ls .github/PULL_REQUEST_TEMPLATE.md

# Create test PR
gh pr create --base main --head test-branch --title "Test PR"
# ✅ Template should auto-load
```

### Update Template Repo README
Add section to README.md:
```markdown
## Features

This template includes:
- ✅ Multi-environment Docker Compose setup (dev, staging, production)
- ✅ GitHub Actions CI/CD workflows
- ✅ Comprehensive PR template with CI/CD checklist
- ✅ NFR Matrix (Non-functional requirements)
- ✅ Environment variable templates
- ✅ Best practices documentation
```

---

## 📚 Related Files

In kenya-tnt-system repo:
- `.github/PULL_REQUEST_TEMPLATE.md` - The actual template (healthcare version)
- `PR_TEMPLATE_ADDED.md` - Feature documentation
- `PR_TEMPLATE_FOR_TEMPLATE_REPO.md` - This guide
- `BRANCH_PROTECTION_SUMMARY.md` - Complete setup summary

---

## 🔄 Maintenance

### When to Update Template
- CI/CD requirements change
- New compliance standards added
- Coverage thresholds adjusted
- Security requirements updated

### How to Update
1. Update in template repo first
2. Update in active projects via PR
3. Document changes in template repo README

---

## ✅ Checklist for Template Repo

Before pushing to template repository:

- [ ] `.github/` directory created
- [ ] `PULL_REQUEST_TEMPLATE.md` added
- [ ] Generic version used (no project-specific items)
- [ ] Tested by creating test PR
- [ ] README.md updated to mention PR template
- [ ] Committed with clear message
- [ ] Pushed to `main` branch

---

**Created**: December 20, 2025  
**Purpose**: Guide for adding PR template to project-template-standard  
**Status**: Ready to execute


