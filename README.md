# CI/CD Pipeline: Multi-Branch Deployment Architecture

> A production-ready GitHub Actions workflow for managing code promotion across multiple environments with branch isolation and automated deployment.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Branch Strategy](#branch-strategy)
4. [CI/CD Workflow](#cicd-workflow)
5. [Getting Started](#getting-started)
6. [Developer Guide](#developer-guide)
7. [Deployment Process](#deployment-process)
8. [Troubleshooting](#troubleshooting)
9. [Security & Best Practices](#security--best-practices)

---

## 📌 Overview

This repository implements a **scalable CI/CD pipeline** using GitHub Actions that:

- ✅ **Detects active branch** and applies environment-specific configurations
- ✅ **Validates** HTML/CSS/JavaScript without external dependencies
- ✅ **Prevents cross-branch conflicts** through automated checks
- ✅ **Supports promotion of code**: `feature` → `dev` → `test` → `main`
- ✅ **Ensures branch isolation**: Feature branches run independently
- ✅ **Automated deployments** to environment-specific locations
- ✅ **Comprehensive logging** and detailed step summaries

### Key Features

| Feature | Details |
|---------|---------|
| **Branch Detection** | Automatically identifies branch type (main/test/dev/feature) |
| **Build Validation** | HTML structure, CSS, and JavaScript syntax checks |
| **Conflict Prevention** | Cross-branch conflict detection and enforcement |
| **Promotion Gates** | Controlled code promotion with branch-specific rules |
| **Environment-Aware** | Different deployment targets per branch |
| **Artifact Storage** | Build artifacts retained for 30 days |
| **Detailed Reporting** | GitHub Step Summaries for visibility |

---

## 🏗️ Architecture

### Directory Structure

```
ci-cd-sample/
├── .github/
│   └── workflows/
│       └── ci-cd.yml              # Main CI/CD workflow
├── src/
│   ├── index.html                 # HTML application template
│   ├── styles.css                 # Responsive styling
│   └── app.js                     # Branch-aware initialization
├── build/                         # Build output (generated)
└── README.md                      # This file
```

### Pipeline Stages

```
┌─────────────────┐
│  1. DETECT      │  Identify active branch (main/test/dev/feature)
└────────┬────────┘
         │
┌────────▼────────┐
│  2. BUILD       │  Copy files, inject metadata, validate HTML/CSS/JS
└────────┬────────┘
         │
┌────────▼────────┐
│  3. TEST        │  Linting, accessibility, performance checks
└────────┬────────┘
         │
┌────────▼────────┐
│  4. GATES       │  Enforce promotion rules and branch policies
└────────┬────────┘
         │
┌────────▼────────┐
│  5. DEPLOY      │  Deploy to branch-specific environment
└────────┬────────┘
         │
┌────────▼────────┐
│  6. SUMMARY     │  Generate final report and next steps
└─────────────────┘
```

---

## 🌿 Branch Strategy

### Branch Hierarchy

```
main (Production)
  ↑
  ├─ Receives merges from: test branch only
  ├─ Deployment: /var/www/html/ (Production)
  └─ Access Level: Protected (require reviews)

test (Staging)
  ↑
  ├─ Receives merges from: dev branch only
  ├─ Deployment: /var/www/test/ (Test)
  └─ Used for: Pre-production validation

dev (Development)
  ↑
  ├─ Receives merges from: feature branches
  ├─ Deployment: /var/www/dev/ (Development)
  └─ Used for: Integration testing

branch-* (Feature Branches)
  ├─ Created from: dev branch
  ├─ Deployment: /var/www/features/{branch-name}/ (Isolated)
  └─ Examples: branch-1, branch-2, feature/user-auth, etc.
```

### Branch Responsibilities

#### 🔴 `main` (Production)

- **Purpose**: Production-ready code
- **Source**: Merges from `test` branch only
- **Protection Rules**: 
  - Require pull request reviews
  - Dismiss stale reviews
  - Require status checks to pass
- **Deployment**: Automatic to production
- **Access**: Limited to maintainers

#### 🟠 `test` (Staging)

- **Purpose**: Pre-production testing
- **Source**: Merges from `dev` branch only
- **Validation**: Integration tests, user acceptance testing
- **Deployment**: Automatic to staging environment
- **Duration**: Temporary (2-7 days per cycle)

#### 🟡 `dev` (Development)

- **Purpose**: Integration point for feature branches
- **Source**: Merges from feature branches (via pull requests)
- **Validation**: Code review, unit tests
- **Deployment**: Automatic to development environment
- **Stability**: Should always be deployable

#### 🟢 `branch-*` (Feature Branches)

- **Purpose**: Isolated feature development
- **Created from**: `dev` branch
- **Naming**: `branch-1`, `branch-2`, `feature/description`
- **Scope**: Single feature or bug fix
- **Duration**: Temporary (development cycle)
- **Deployment**: Isolated environment for testing
- **Merge**: Pull request → `dev` branch (code review required)

---

## 🔄 CI/CD Workflow

### Trigger Events

The workflow automatically runs on:

```yaml
- Push to any branch: main, test, dev, branch-*
- Pull Request: To any target branch
```

### Stage 1: Detect Branch

**Purpose**: Identify the active branch and its type

```bash
Input: GitHub context (branch name, event type)
Processing:
  - Determine branch type (main/test/dev/feature)
  - Extract branch metadata
Output: Branch type flags for downstream stages
```

**Output Variables**:
- `branch`: Current branch name
- `is-main`: Boolean flag for main branch
- `is-test`: Boolean flag for test branch
- `is-dev`: Boolean flag for dev branch
- `is-feature`: Boolean flag for feature branches

### Stage 2: Build & Validate

**Purpose**: Compile application and validate integrity

**Steps**:
1. Checkout code
2. Copy application files to `build/` directory
3. Inject branch metadata (branch name, commit SHA, build time)
4. Validate HTML structure (DOCTYPE, head, body, required elements)
5. Validate CSS file syntax
6. Validate JavaScript syntax
7. Check for cross-branch conflicts
8. Generate build report

**Artifacts**: `build-{branch-name}` (30-day retention)

### Stage 3: Test & Quality Checks

**Purpose**: Ensure code quality and accessibility

**Checks**:
- HTML linting (images, meta tags, semantic structure)
- Accessibility compliance (lang attribute, color contrast)
- Performance analysis (file sizes, optimization)
- Code style validation

**Result**: Pass/Fail status blocks subsequent stages

### Stage 4: Deployment Gates

**Purpose**: Enforce branch promotion rules

**Rules**:
```
main ← Only from test (requires human approval)
test ← Only from dev (automatic after validation)
dev  ← Only from branch-* (automatic after validation)
branch-* ← Independent (no restrictions)
```

### Stage 5: Deploy

**Purpose**: Deploy to environment-specific locations

**Deployment Matrix**:

| Branch | Target | Location | Trigger |
|--------|--------|----------|---------|
| `main` | Production | `/var/www/html/` | After `test` merge |
| `test` | Staging | `/var/www/test/` | After `dev` merge |
| `dev` | Development | `/var/www/dev/` | After feature merge |
| `branch-*` | Feature | `/var/www/features/{name}/` | On push |

**Process**:
1. Download build artifacts
2. Prepare deployment (backups, health checks)
3. Transfer files to target server
4. Restart application service
5. Verify deployment

### Stage 6: Summary

**Purpose**: Provide visibility and next steps

Generates detailed report including:
- Pipeline execution status
- Branch information
- Next actions based on branch type

---

## 🚀 Getting Started

### Prerequisites

- GitHub account with repository access
- Git installed locally
- Node.js (optional, for local testing)

### Setup Instructions

#### 1. Clone the Repository

```bash
git clone https://github.com/selvar2/ci-cd-sample.git
cd ci-cd-sample
```

#### 2. Create Required Branches

```bash
# Create test branch (if not exists)
git branch test
git push origin test

# Create dev branch (if not exists)
git branch dev
git push origin dev

# Create feature branches (examples)
git branch branch-1
git branch branch-2
git push origin branch-1 branch-2
```

#### 3. Configure Branch Protection (GitHub UI)

For `main` branch:
1. Go to Settings → Branches → Add rule
2. Apply to: `main`
3. Enable:
   - ✅ Require pull request reviews (1 approval)
   - ✅ Dismiss stale pull request approvals
   - ✅ Require status checks to pass
4. Save

#### 4. (Optional) Configure Deployment Credentials

If deploying to actual servers, add GitHub Secrets:

1. Go to Settings → Secrets and variables → Actions
2. Add secrets:
   - `DEPLOY_HOST`: Server hostname
   - `DEPLOY_USER`: SSH username
   - `DEPLOY_KEY`: Private SSH key

Example in workflow:

```yaml
- name: Deploy
  env:
    DEPLOY_HOST: ${{ secrets.DEPLOY_HOST }}
    DEPLOY_USER: ${{ secrets.DEPLOY_USER }}
  run: |
    scp -r build/* ${{ env.DEPLOY_USER }}@${{ env.DEPLOY_HOST }}:/var/www/html/
```

---

## 👨‍💻 Developer Guide

### Working on Feature Branches

#### Creating a Feature Branch

```bash
# Switch to dev branch
git checkout dev
git pull origin dev

# Create feature branch
git checkout -b branch-1
```

#### Making Changes

```bash
# Edit files in your feature branch
echo "<h1>Hello City</h1>" >> src/index.html

# Commit changes
git add .
git commit -m "feat: Add Hello City feature"

# Push to remote
git push origin branch-1
```

**What Happens Automatically**:
1. ✅ CI/CD pipeline starts
2. ✅ Branch detected as `branch-1`
3. ✅ Build validation runs
4. ✅ Tests execute
5. ✅ Deployment to `/var/www/features/branch-1/`
6. ✅ Report generated in Step Summary

#### Creating a Pull Request

1. Go to GitHub repository
2. Click "Compare & pull request"
3. Set base: `dev`, compare: `branch-1`
4. Add description and request reviewers
5. After approval, merge using "Create a merge commit"

### Code Modification Guidelines

#### Modifying HTML

Edit [src/index.html](src/index.html):

```html
<!-- Example: Update app title for your feature -->
<h1 id="app-title">Hello Feature</h1>
```

The JavaScript in `app.js` will automatically update the display based on the branch name in the meta tag.

#### Modifying Styles

Edit [src/styles.css](src/styles.css):

```css
/* Example: Change color scheme */
header {
    background: linear-gradient(135deg, #your-color-1 0%, #your-color-2 100%);
}
```

#### Modifying JavaScript Logic

Edit [src/app.js](src/app.js):

```javascript
// Add branch-specific configuration
const branchConfig = {
    'branch-3': {
        title: 'Hello Mobile',
        environment: 'Feature (branch-3)',
        color: '#FF6B6B'
    }
};
```

### Viewing Workflow Results

1. Go to Actions tab
2. Click on your branch's workflow run
3. Expand each stage to see:
   - Step output
   - Step summaries
   - Artifact uploads
   - Deployment reports

---

## 📦 Deployment Process

### Development Workflow

```
1. Developer pushes to branch-1
   └─ ✓ Build, test, deploy to /var/www/features/branch-1/
   
2. Testing complete, create PR to dev
   └─ ✓ Code review
   └─ ✓ Merge commit
   
3. Automatic deployment to dev
   └─ ✓ Build, test, deploy to /var/www/dev/
   └─ ✓ Integration testing
```

### Staging Workflow

```
1. Create PR from dev to test
   └─ ✓ Review changes
   └─ ✓ Merge commit
   
2. Automatic deployment to test
   └─ ✓ Build, test, deploy to /var/www/test/
   └─ ✓ User acceptance testing (2-7 days)
   └─ ✓ Performance monitoring
```

### Production Workflow

```
1. Create PR from test to main
   └─ ✓ Change review
   └─ ✓ Approval required
   └─ ✓ All checks must pass
   
2. Merge to main
   └─ ✓ Automatic production deployment
   └─ ✓ Backup previous version
   └─ ✓ Health checks
   └─ ✓ Monitor metrics
```

### Rollback Procedure

If issues occur in production:

```bash
# Revert the merge commit
git revert -m 1 <merge-commit-hash>
git push origin main

# Pipeline automatically:
# 1. Detects main branch push
# 2. Builds previous version
# 3. Deploys to production
```

---

## 🔍 Troubleshooting

### Build Fails - Missing HTML Elements

**Error**: `✗ Missing app title element`

**Solution**:
1. Verify `index.html` contains `<div id="app-title">`
2. Check for typos in element IDs
3. Rebuild and push

### JavaScript Syntax Error

**Error**: `node: command not found` or syntax error

**Solution**:
1. Validate JavaScript locally: `node -c src/app.js`
2. Fix syntax errors
3. Recommit and push

### Deployment Fails

**Causes**:
- Invalid SSH credentials
- Network connectivity issues
- Insufficient disk space

**Debug Steps**:
1. Check GitHub Secrets are configured
2. Verify SSH key permissions (600)
3. Test SSH connection manually:
   ```bash
   ssh -i key.pem user@host "echo 'SSH working'"
   ```

### Files Not Deployed

**Possible Reasons**:
- Build stage failed silently
- Artifacts not uploaded
- Wrong deployment path

**Debug**:
1. Download artifacts from Actions
2. Verify file contents
3. Check workflow logs for errors

---

## 🔐 Security & Best Practices

### Branch Protection

Enable for `main` branch:

```yaml
- Require pull request reviews (minimum 1)
- Dismiss stale pull request approvals
- Require status checks to pass before merge
- Include administrators
- Restrict who can push to matching branches
```

### Secret Management

**Never commit**:
- API keys
- SSH private keys
- Database credentials
- Authentication tokens

**Instead, use GitHub Secrets**:

```yaml
env:
  DEPLOY_USER: ${{ secrets.DEPLOY_USER }}
  DEPLOY_HOST: ${{ secrets.DEPLOY_HOST }}
run: |
  deploy-script.sh
```

### Artifact Retention

Current setting: **30 days**

- Reduces storage costs
- Maintains compliance requirements
- Allows rollback within retention window

To modify:

```yaml
env:
  ARTIFACT_RETENTION_DAYS: 60  # Change to 60 days
```

### Audit Trail

All pipeline executions are logged:
- Branch name
- Commit SHA
- Actor/author
- Timestamp
- Stage results
- Deployment details

Access in: Actions → Workflow runs → Click run → View logs

### Code Review Process

**For dev branch**:
1. Minimum 1 approval
2. Automated checks must pass
3. Dismissable reviews after new commits

**For main branch**:
1. Minimum 1 approval (maintainer only)
2. All checks must pass
3. Cannot dismiss reviews

### Deployment Approvals

**For test → main promotion**:

```yaml
# Add manual approval step (optional)
- name: Request Manual Approval
  if: needs.detect-branch.outputs.is-test == 'true'
  uses: actions/github-script@v7
  with:
    script: |
      // Create comment requesting approval
      github.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: '⏳ Ready for production. Awaiting approval from maintainer.'
      })
```

---

## 📊 Monitoring & Observability

### Pipeline Metrics

- **Success Rate**: Monitor in Actions dashboard
- **Build Duration**: Track in workflow summaries
- **Deployment Frequency**: Track pushes per branch
- **Error Rates**: Monitor failed builds

### Access Workflow Results

1. **GitHub UI**: Actions → Select workflow
2. **Command Line**:
   ```bash
   gh run list --branch dev --limit 10
   gh run view <run-id> --log
   ```
3. **Programmatic**: GitHub API `/repos/{owner}/{repo}/actions/runs`

### Setting Up Alerts

```yaml
# Email notifications (GitHub default)
# Slack integration (optional)
- name: Notify Slack
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## 📝 Workflow Examples

### Example 1: Feature Development

**Scenario**: Developer adds "Hello City" feature to branch-1

```bash
# Step 1: Create and work on feature branch
git checkout -b branch-1
echo "<h1>Hello City</h1>" >> src/index.html
git add .
git commit -m "feat: Add Hello City"
git push origin branch-1

# Automatically triggered:
# - Branch detected: branch-1
# - Build validates HTML
# - Deploy to /var/www/features/branch-1/
# - Report generated
```

### Example 2: Promotion from Dev to Test

**Scenario**: Code ready for testing

```bash
# Step 1: Create PR on GitHub
# Base: test | Compare: dev
# Description: "Release v1.2.0 to staging"
# Reviewers: @team-leads

# Step 2: After approval, merge
# Automatically triggered:
# - Branch detected: test
# - Build validates
# - Deploy to /var/www/test/
# - Report with "Ready for production" message
```

### Example 3: Emergency Hotfix

**Scenario**: Production bug found

```bash
# Step 1: Create hotfix from main
git checkout main
git checkout -b hotfix/critical-bug
# ... fix code ...
git push origin hotfix/critical-bug

# Step 2: Create PR
# Base: dev | Compare: hotfix/critical-bug
# Label: hotfix, urgent

# Step 3: Expedited review → merge to dev
# Step 4: Create PR: dev → test
# Step 5: After quick testing → create PR: test → main
# Step 6: Merge and automatic production deployment
```

---

## 📚 Additional Resources

### GitHub Actions Documentation
- [GitHub Actions Quickstart](https://docs.github.com/en/actions/quickstart)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Contexts](https://docs.github.com/en/actions/learn-github-actions/contexts)

### Git Workflows
- [Git Flow Model](https://nvie.com/posts/a-successful-git-branching-model/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Trunk Based Development](https://trunkbaseddevelopment.com/)

### Web Development
- [HTML5 Standards](https://html.spec.whatwg.org/)
- [Web Accessibility (WCAG)](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Web Docs](https://developer.mozilla.org/)

---

## 🤝 Contributing

### How to Contribute

1. Create feature branch: `git checkout -b branch-name`
2. Make changes and test locally
3. Commit with clear messages: `git commit -m "description"`
4. Push to remote: `git push origin branch-name`
5. Create pull request with detailed description
6. Address review feedback
7. Merge after approval

### Code of Conduct

- Be respectful and inclusive
- Test changes before pushing
- Write clear commit messages
- Review others' code thoughtfully

---

## 📄 License

This project is provided as-is for educational and reference purposes.

---

## 📞 Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review workflow logs in GitHub Actions
3. Consult [Additional Resources](#additional-resources)
4. Open an issue with detailed context

---

## ✅ Assumptions & Limitations

### Assumptions

1. **Single HTML Application**: The repo contains a simple HTML+CSS+JS app
2. **GitHub Enterprise**: Assumes standard GitHub with Actions enabled
3. **Static Content Only**: No backend compilation or package installation required
4. **SSH Deployment**: Real deployments use SSH (credentials via GitHub Secrets)
5. **Manual Approval**: main branch merges require human review
6. **Unix/Linux Servers**: Deployment targets run on Linux with standard file structure

### Limitations

1. **No Database Migrations**: Workflow doesn't handle DB schema changes
2. **No Container Orchestration**: Doesn't support Kubernetes or Docker Compose
3. **Basic Testing**: HTML/CSS/JS validation only, no end-to-end tests
4. **Simple Rollback**: Manual revert required for complex rollbacks
5. **Limited Monitoring**: No integration with monitoring/alerting systems
6. **Single Repo**: Assumes monorepo for all environments

### Future Enhancements

- [ ] End-to-end testing with Playwright/Cypress
- [ ] Docker containerization
- [ ] AWS/Azure/GCP deployment integration
- [ ] Automated performance testing (Lighthouse)
- [ ] Slack/Teams notifications
- [ ] Database migration management
- [ ] Canary/Blue-Green deployments
- [ ] Cost optimization tracking

---

## 📊 Checklist for Implementation

- [ ] Clone repository locally
- [ ] Create `test` and `dev` branches
- [ ] Create feature branches (branch-1, branch-2)
- [ ] Configure branch protection on `main`
- [ ] (Optional) Add GitHub Secrets for deployment
- [ ] Test workflow by pushing to `branch-1`
- [ ] Review Actions tab for results
- [ ] Modify HTML files for your use case
- [ ] Document team-specific deployment procedures
- [ ] Train team members on workflow
- [ ] Set up monitoring and alerts

---

**Version**: 1.0  
**Last Updated**: December 29, 2025  
**Maintained By**: DevOps Team