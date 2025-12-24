# 📋 PR Template Added!

**Date**: December 20, 2025

## ✅ What Was Created

### For kenya-tnt-system
- ✅ `.github/PULL_REQUEST_TEMPLATE.md` - Comprehensive PR checklist

This template will automatically show up when creating PRs via GitHub UI or CLI!

---

## 🎯 Template Features

### Deployment Target Selection
- Staging (demos/QA)
- Production (live deployment)

### Automated Reminders
- ✅ GitHub Actions status checks
- ✅ Test coverage requirements (70% staging, 80% prod)
- ✅ Code quality standards
- ✅ Security & compliance checks
- ✅ Documentation updates
- ✅ Database naming conventions (snake_case DB + camelCase code)

### GS1/EPCIS Specific
- GS1 identifier validation (GTIN, GLN, SSCC)
- EPCIS 2.0 compliance checks

---

## 🔄 Add to Template Repository

This PR template should also be added to:
**Repository**: https://github.com/insen5/project-template-standard

### Steps to Add:
```bash
# Clone the template repo (if not already cloned)
cd ~/repos
git clone https://github.com/insen5/project-template-standard.git
cd project-template-standard

# Create .github directory if it doesn't exist
mkdir -p .github

# Copy the PR template
cp /path/to/kenya-tnt-system/.github/PULL_REQUEST_TEMPLATE.md .github/

# Commit and push
git add .github/PULL_REQUEST_TEMPLATE.md
git commit -m "feat: Add comprehensive PR template with CI/CD checks"
git push origin main
```

### Customize for Different Projects
The template includes sections for:
- **Generic projects**: Basic CI/CD, testing, documentation
- **Industry-specific** (remove if not applicable):
  - GS1 identifier validation
  - EPCIS compliance
  - Pharmaceutical tracking requirements

Projects can remove irrelevant sections while keeping core checklist items.

---

## 📝 How It Works

### When Creating a PR:

**Via GitHub CLI:**
```bash
gh pr create --base staging --head develop --title "Deploy to staging"
```

**Via GitHub UI:**
1. Go to repository → Pull requests → New pull request
2. Template automatically loads with checklist
3. Fill in the blanks and check boxes

### What Reviewers See:
- ✅ All checkboxes visible
- ✅ GitHub Actions status (red/green)
- ✅ Coverage reports
- ✅ Clear description of changes

---

## 🎨 Customization Options

### For kenya-tnt-system (Healthcare/Pharma)
Keep all sections - includes GS1, EPCIS, compliance checks

### For Generic Web Apps
Remove these sections:
- GS1 identifier validation
- EPCIS compliance
- Pharmaceutical-specific checks

Keep these sections:
- Deployment target
- CI/CD checks
- Code quality
- Documentation
- Security basics

### For Internal Tools
Simplify to:
- Basic CI checks
- Code review
- Deployment notes

---

## ✅ Next Steps

1. **Test the template**: Create a test PR and verify the template loads
2. **Add to template repo**: Copy to project-template-standard
3. **Customize per project**: Remove irrelevant sections for non-healthcare projects
4. **Train team**: Show team members how to use the checklist

---

## 🚀 Benefits

### For Free Tier Private Repos
- ✅ Provides structure even without enforceable branch protection
- ✅ Reminds developers of best practices
- ✅ Documents required checks explicitly
- ✅ Creates consistency across projects

### For CI/CD
- ✅ Aligns with existing GitHub Actions workflows
- ✅ References actual coverage requirements (70%/80%)
- ✅ Includes deployment target selection
- ✅ Tracks breaking changes

### For Code Quality
- ✅ Enforces documentation updates
- ✅ Prevents secret leakage
- ✅ Maintains naming conventions
- ✅ Ensures proper testing

---

**Files Created:**
- ✅ `kenya-tnt-system/.github/PULL_REQUEST_TEMPLATE.md`

**To Do:**
- [ ] Add to https://github.com/insen5/project-template-standard
- [ ] Test with actual PR creation
- [ ] Train team on usage


