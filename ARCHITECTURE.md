# Technical Architecture & Implementation Details

## Table of Contents
1. [Workflow Architecture](#workflow-architecture)
2. [Stage-by-Stage Breakdown](#stage-by-stage-breakdown)
3. [Branch Detection Logic](#branch-detection-logic)
4. [Environment-Specific Behavior](#environment-specific-behavior)
5. [Artifact Management](#artifact-management)
6. [Deployment Matrix](#deployment-matrix)
7. [Integration Points](#integration-points)
8. [Error Handling](#error-handling)
9. [Performance Metrics](#performance-metrics)

---

## Workflow Architecture

### Core Design Principles

```
┌────────────────────────────────────────────────────────────────┐
│ GitHub Push Event (any branch)                                 │
└─────────────────────────────┬──────────────────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │  Workflow Trigger  │
                    │  (on: push/PR)     │
                    └─────────┬──────────┘
                              │
        ┌─────────────────────┴──────────────────────┐
        │ Parallel Processing (Independent)         │
        │ (All jobs can run simultaneously)         │
        └──────────────────────────────────────────┘
        │
        ├─→ [Job 1] detect-branch      (outputs flags)
        │
        ├─→ [Job 2] build              (depends on 1)
        │
        ├─→ [Job 3] test               (depends on 1,2)
        │
        ├─→ [Job 4] deployment-gates   (depends on 1,2,3)
        │
        ├─→ [Job 5] deploy             (depends on 1,2,3,4)
        │           ├─ Deploy Dev
        │           ├─ Deploy Test
        │           ├─ Deploy Prod
        │           └─ Deploy Feature
        │
        └─→ [Job 6] summary            (runs always)

```

### Job Dependencies

```yaml
detect-branch
├── outputs: branch, is-main, is-test, is-dev, is-feature
│
├─→ build
│   ├── needs: detect-branch
│   └── outputs: build-{branch} artifact
│
├─→ test
│   ├── needs: detect-branch, build
│   └── outputs: test results in summary
│
├─→ deployment-gates
│   ├── needs: detect-branch, build, test
│   ├── condition: github.event_name == 'push'
│   └── outputs: gate status
│
├─→ deploy
│   ├── needs: detect-branch, build, test, deployment-gates
│   ├── condition: github.event_name == 'push'
│   └── outputs: deployment report
│
└─→ summary
    ├── needs: all previous jobs
    ├── condition: always() [runs even on failure]
    └── outputs: final report
```

---

## Stage-by-Stage Breakdown

### Stage 1: Detect Branch

**File**: [.github/workflows/ci-cd.yml](.github/workflows/ci-cd.yml#L34-L95)

**Purpose**: Identify branch type and set environment-specific flags

**Input**:
```yaml
github.event_name       # 'push' or 'pull_request'
github.ref_name         # Branch name for push events
github.head_ref          # Branch name for PR events
```

**Processing Logic**:
```bash
if [ event = 'pull_request' ]
  branch = github.head_ref
else
  branch = github.ref_name

if [ branch = 'main' ]
  is-main = true
elif [ branch = 'test' ]
  is-test = true
elif [ branch = 'dev' ]
  is-dev = true
elif [ branch matches 'branch-*' ]
  is-feature = true
fi
```

**Output Variables**:
```yaml
outputs:
  branch:     'branch-1'        # Current branch name
  is-main:    'false'           # Boolean string
  is-test:    'false'           # Boolean string
  is-dev:     'false'           # Boolean string
  is-feature: 'true'            # Boolean string
```

**Step Summary**:
```
🟢 Detected: FEATURE (branch-1)
Branch: branch-1
Event: push
```

---

### Stage 2: Build & Validate

**File**: [.github/workflows/ci-cd.yml](.github/workflows/ci-cd.yml#L97-L267)

**Purpose**: Compile application and ensure integrity

**Step 1: Checkout Code**
```bash
uses: actions/checkout@v4
# Gets full repository history for analysis
```

**Step 2: Setup Environment**
```bash
uses: actions/setup-node@v4
# Version: Node 18 (from env.NODE_VERSION)
```

**Step 3: Copy Application Files**
```bash
# Source: src/
# Destination: build/
# This creates the deployment package
```

**Step 4: Inject Branch Metadata**
```bash
# Adds to <head>:
<meta name="branch" content="branch-1">
<meta name="build-time" content="2025-12-29T12:34:56Z">
<meta name="commit-sha" content="abc123def456">
```

**Step 5: HTML Structure Validation**
```bash
Checks for:
✓ <!DOCTYPE html>
✓ <html> tag
✓ <head> section
✓ <body> section
✓ #app-title element
```

**Step 6: CSS Validation**
```bash
Checks:
✓ File existence
✓ Contains body {} styles
✓ File properly terminated
```

**Step 7: JavaScript Validation**
```bash
Checks:
✓ File not empty
✓ Syntax valid (via 'node -c')
✓ Contains required functions
```

**Step 8: Conflict Detection**
```bash
Rules:
! If branch != 'main' AND file contains 'production' → Warning
! Prevents accidental production markers in dev branches
```

**Artifacts Uploaded**:
```
Name: build-branch-1
Contents:
├── index.html (with metadata injected)
├── styles.css
└── app.js
Retention: 30 days (configurable)
```

---

### Stage 3: Test & Quality Checks

**File**: [.github/workflows/ci-cd.yml](.github/workflows/ci-cd.yml#L269-L398)

**Purpose**: Ensure code meets quality standards

**HTML Linting**:
```bash
Checks:
✓ img tags have alt attributes
✓ viewport meta tag present
✓ H1 tag exists
✓ Semantic HTML structure

Warnings:
⚠ Missing alt attributes
⚠ Missing viewport meta
```

**Accessibility Checks**:
```bash
Checks:
✓ <html lang="en"> attribute present
✓ Color contrast (basic check)
✓ Form labels
✓ WCAG 2.1 AA compliance markers
```

**Performance Analysis**:
```bash
Metrics:
- Total build size
- HTML file size
- CSS file size  
- JavaScript file size

Thresholds:
⚠ Warn if HTML > 100KB
⚠ Warn if CSS > 100KB
⚠ Warn if JS > 100KB
```

**Test Results Output**:
```
[Step Summary]
- ✓ HTML linting passed
- ✓ Accessibility checks passed
- ✓ Performance checks passed
- ✓ File sizes optimal
```

---

### Stage 4: Deployment Gates

**File**: [.github/workflows/ci-cd.yml](.github/workflows/ci-cd.yml#L400-L468)

**Purpose**: Enforce branch promotion rules and prevent invalid deployments

**Promotion Rules Enforcement**:

```
Branch: main
├─ Allowed source: test branch only
├─ Promotion path: test → main
├─ Required approval: Team Lead
└─ Gate status: REQUIRES MANUAL APPROVAL

Branch: test
├─ Allowed source: dev branch only
├─ Promotion path: dev → test
├─ Required approval: Code reviewer
└─ Gate status: AUTOMATIC (after validation)

Branch: dev
├─ Allowed source: feature branches
├─ Promotion path: branch-* → dev
├─ Required approval: Code reviewer
└─ Gate status: AUTOMATIC (after validation)

Branch: branch-*
├─ Allowed source: Any (created from dev)
├─ Promotion path: Independent
├─ Required approval: None
└─ Gate status: PASS (isolation enforced)
```

**Gate Evaluation Logic**:
```bash
case $branch in
  main)
    if event != 'push' then FAIL
    if source_branch != 'test' then WARN
    require_manual_approval
    ;;
  test)
    if event != 'push' then FAIL
    if source_branch != 'dev' then WARN
    auto_approve_if_tests_pass
    ;;
  dev)
    if event != 'push' then FAIL
    auto_approve_if_tests_pass
    ;;
  branch-*)
    always_pass_isolation_gate
    ;;
esac
```

**Step Summary Output**:
```
## Deployment Gate Validation

🔴 Branch: Production (main)
Promotion Source: test branch only
Required Approvals: 1 (Team Lead)
✓ Push to main branch detected

OR

🟡 Branch: Development (dev)
Promotion Source: feature branches
Promotion Target: test branch
✓ Ready for promotion to staging
```

---

### Stage 5: Deploy

**File**: [.github/workflows/ci-cd.yml](.github/workflows/ci-cd.yml#L470-L558)

**Purpose**: Deploy to environment-specific locations

**Deployment Decision Tree**:

```
if [ branch = 'main' ]
  Deploy to: /var/www/html/ (Production)
  Steps:
    1. Download build artifacts
    2. Backup current production
    3. scp -r build/* prod-server:/var/www/html/
    4. ssh prod-server 'systemctl restart app'
    5. Run health checks
    6. Verify uptime

elif [ branch = 'test' ]
  Deploy to: /var/www/test/ (Staging)
  Steps:
    1. Download build artifacts
    2. scp -r build/* test-server:/var/www/test/
    3. ssh test-server 'systemctl restart app'
    4. Run smoke tests

elif [ branch = 'dev' ]
  Deploy to: /var/www/dev/ (Development)
  Steps:
    1. Download build artifacts
    2. scp -r build/* dev-server:/var/www/dev/
    3. ssh dev-server 'systemctl restart app'

elif [ branch matches 'branch-*' ]
  Deploy to: /var/www/features/{branch}/ (Isolated)
  Steps:
    1. Download build artifacts
    2. mkdir -p /var/www/features/{branch}
    3. scp -r build/* server:/var/www/features/{branch}/
fi
```

**Real Implementation Example**:

```bash
# (In actual deployment, replace with real credentials)
scp -r build/* $DEPLOY_USER@$DEPLOY_HOST:/var/www/html/
ssh $DEPLOY_USER@$DEPLOY_HOST "systemctl restart app"

# With GitHub Secrets:
env:
  DEPLOY_USER: ${{ secrets.DEPLOY_USER }}
  DEPLOY_HOST: ${{ secrets.DEPLOY_HOST }}
```

**Deployment Report**:
```
## Deployment Summary

Branch: branch-1
Commit: abc123def456...
Timestamp: 2025-12-29 12:34:56 UTC

Location: /var/www/features/branch-1/
✓ Files deployed (3)
✓ Service restarted
✓ Health checks passed
```

---

### Stage 6: Summary

**File**: [.github/workflows/ci-cd.yml](.github/workflows/ci-cd.yml#L560-L629)

**Purpose**: Provide final pipeline status and next steps

**Summary Template**:

```markdown
# CI/CD Pipeline Complete

## Status Summary

| Stage | Status |
|-------|--------|
| Detect Branch | ✓ |
| Build & Validate | ✓ |
| Tests & Quality | ✓ |
| Deployment Gates | ✓ |
| Deploy | ✓ |

## Branch Information

- **Active Branch**: branch-1
- **Event**: push
- **Triggering Commit**: abc123
- **Author**: developer-name

## Next Steps

1. Continue feature development
2. Push additional commits to feature branch
3. When complete, create pull request to dev branch
```

---

## Branch Detection Logic

### Event Type Detection

```yaml
on:
  push:
    branches: [main, test, dev, 'branch-*']
  pull_request:
    branches: [main, test, dev, 'branch-*']
```

### Branch Name Extraction

```bash
if [ "${{ github.event_name }}" = "pull_request" ]
  # For PR events, use head_ref (source branch)
  BRANCH="${{ github.head_ref }}"
else
  # For push events, use ref_name (branch name)
  BRANCH="${{ github.ref_name }}"
fi
```

### Type Classification

```bash
# Using bash pattern matching
case "$BRANCH" in
  main)
    TYPE="production"
    ENVIRONMENT="/var/www/html"
    ;;
  test)
    TYPE="staging"
    ENVIRONMENT="/var/www/test"
    ;;
  dev)
    TYPE="development"
    ENVIRONMENT="/var/www/dev"
    ;;
  branch-*)
    TYPE="feature"
    ENVIRONMENT="/var/www/features/$BRANCH"
    ;;
  *)
    TYPE="other"
    ENVIRONMENT="/var/www/other"
    ;;
esac
```

---

## Environment-Specific Behavior

### Main Branch (Production)

```yaml
Triggers: merge to main
Validations:
  - Full test suite must pass
  - Code review required (1+ approval)
  - All status checks must pass
  - No dismissible reviews allowed

Actions:
  - Build with production markers
  - Full deployment validation
  - Backup current production
  - Deploy to /var/www/html/
  - Run health checks
  - Send notifications

Deployment: Automatic after merge
Rollback: Manual (git revert)
Monitoring: Critical
```

### Test Branch (Staging)

```yaml
Triggers: merge to test (from dev)
Validations:
  - Integration tests must pass
  - Code review required (1+ approval)

Actions:
  - Build application
  - Deploy to /var/www/test/
  - Run smoke tests
  - Notify team

Deployment: Automatic after merge
Rollback: Automatic (revert commit)
Monitoring: High
```

### Dev Branch (Development)

```yaml
Triggers: merge to dev (from feature)
Validations:
  - Unit tests pass
  - Code review (1+ approval)
  - Linting passes

Actions:
  - Build application
  - Deploy to /var/www/dev/
  - Run integration tests

Deployment: Automatic after merge
Rollback: Manual
Monitoring: Medium
```

### Feature Branches (branch-*)

```yaml
Triggers: any push to branch-*
Validations:
  - Basic validations
  - HTML/CSS/JS syntax check

Actions:
  - Build application
  - Deploy to /var/www/features/{branch}/
  - Generate report

Deployment: Automatic on push
Rollback: Delete branch
Monitoring: Low
Isolation: Complete (independent environment)
```

---

## Artifact Management

### Upload Strategy

```bash
# After build completes:
uses: actions/upload-artifact@v3
with:
  name: build-${{ branch }}
  path: build/
  retention-days: 30
  if-no-files-found: error
```

### Artifact Lifecycle

```
1. Build Stage
   ↓
2. Upload (30-day retention)
   ├─ build-main
   ├─ build-test
   ├─ build-dev
   └─ build-branch-1
   ↓
3. Download (in Deploy stage)
   ↓
4. Deploy to environment
   ↓
5. Auto-delete after 30 days
```

### Storage Optimization

```yaml
env:
  ARTIFACT_RETENTION_DAYS: 30

# Can be modified to:
# - 7 days (aggressive cleanup)
# - 60 days (extended rollback window)
# - 90 days (compliance requirement)
```

### Artifact Contents

```
build-branch-1/
├── index.html
│   └── [injected metadata]
│       ├── <meta name="branch" content="branch-1">
│       ├── <meta name="build-time" content="...">
│       └── <meta name="commit-sha" content="...">
├── styles.css
│   └── [validated, no changes]
└── app.js
    └── [validated, no changes]
```

---

## Deployment Matrix

### Trigger Conditions

```yaml
Deploy Stage Trigger:
  condition: github.event_name == 'push'
  reason: Only deploy on push (not on PR)
  
Substep Conditions:
  Deploy to Dev:
    condition: needs.detect-branch.outputs.is-dev == 'true'
  Deploy to Test:
    condition: needs.detect-branch.outputs.is-test == 'true'
  Deploy to Prod:
    condition: needs.detect-branch.outputs.is-main == 'true'
  Deploy to Feature:
    condition: needs.detect-branch.outputs.is-feature == 'true'
```

### Deployment Commands

```bash
# Dev Environment
scp -r build/* $DEPLOY_USER@dev-server:/var/www/dev/
ssh $DEPLOY_USER@dev-server 'systemctl restart app'

# Test Environment
scp -r build/* $DEPLOY_USER@test-server:/var/www/test/
ssh $DEPLOY_USER@test-server 'systemctl restart app'

# Production Environment
# Step 1: Backup
scp -r /var/www/html/* $DEPLOY_USER@prod-server:/var/www/html-backup-$(date +%s)/

# Step 2: Deploy
scp -r build/* $DEPLOY_USER@prod-server:/var/www/html/

# Step 3: Verify
ssh $DEPLOY_USER@prod-server 'systemctl restart app'
ssh $DEPLOY_USER@prod-server 'curl http://localhost:8080 | grep "Hello World"'

# Feature Branch
mkdir -p /var/www/features/$BRANCH_NAME
scp -r build/* $DEPLOY_USER@server:/var/www/features/$BRANCH_NAME/
```

---

## Integration Points

### GitHub Actions Built-in

```yaml
Contexts Used:
  github.event_name        # 'push' or 'pull_request'
  github.ref_name          # Current branch (push)
  github.head_ref          # PR source branch
  github.sha               # Commit SHA
  github.actor             # Username
  github.workspace         # Working directory

Actions Used:
  actions/checkout@v4      # Get code
  actions/setup-node@v4    # Setup Node.js
  actions/upload-artifact@v3   # Upload artifacts
  actions/download-artifact@v3 # Download artifacts
```

### Environment Secrets

```yaml
secrets:
  DEPLOY_USER      # SSH username
  DEPLOY_HOST      # Server hostname
  DEPLOY_KEY       # Private SSH key
  SLACK_WEBHOOK    # (Optional) Slack notifications
  API_KEY          # (Optional) Other integrations
```

### File System

```
Repository Root
├── .github/
│   └── workflows/
│       └── ci-cd.yml          ← Workflow definition
├── src/
│   ├── index.html             ← Source
│   ├── styles.css             ← Source
│   └── app.js                 ← Source
└── build/                     ← Generated (not in git)
    ├── index.html             ← With metadata injected
    ├── styles.css             ← Copy of source
    └── app.js                 ← Copy of source
```

---

## Error Handling

### Build Stage Errors

```bash
# Missing element
Error: ✗ Missing app title element
Fix: Ensure <div id="app-title"> exists in index.html

# CSS file missing
Error: CSS file not found
Fix: Verify styles.css exists in src/

# JavaScript syntax error
Error: node: command not found
Fix: Install Node.js (included in ubuntu-latest)

Action: Workflow stops, Step Summary shows error
```

### Test Stage Errors

```bash
# Large file warning
Warning: ⚠ HTML file is large (>100KB)
Action: Workflow continues (non-blocking)

# Missing metadata
Warning: ⚠ Viewport meta tag missing
Action: Workflow continues with warning
```

### Deployment Errors

```bash
# SSH connection failed
Error: scp: command not found
Cause: Server unreachable or SSH not configured
Fix: Check DEPLOY_HOST and DEPLOY_KEY in secrets

# Permission denied
Error: Permission denied (publickey)
Cause: SSH key doesn't match server
Fix: Verify SSH key and user permissions (600)

# Disk full
Error: No space left on device
Cause: Server storage full
Fix: Clean up old deployments
```

### Handling Failures

```yaml
on Failure:
  - Workflow marked as failed (red)
  - Summary job still runs (always: true)
  - Notifications sent (optional)
  - Previous version remains live
  - No automatic rollback
  
Recovery Steps:
  1. Check workflow logs
  2. Fix issue locally
  3. Push corrected code
  4. Workflow re-runs automatically
```

---

## Performance Metrics

### Typical Execution Times

```
Stage 1: Detect Branch        ~10 seconds
  └─ Branch detection
  └─ Output variables

Stage 2: Build & Validate     ~15 seconds
  └─ Checkout code
  └─ Copy files
  └─ Validate HTML/CSS/JS
  └─ Upload artifacts

Stage 3: Test & Quality       ~20 seconds
  └─ Download artifacts
  └─ HTML linting
  └─ Accessibility checks
  └─ Performance analysis

Stage 4: Deployment Gates     ~5 seconds
  └─ Rule evaluation
  └─ Status check

Stage 5: Deploy               ~30 seconds
  └─ Download artifacts
  └─ File transfer
  └─ Service restart
  └─ Health checks

Stage 6: Summary              ~5 seconds
  └─ Report generation

Total: 85 seconds (~1-2 minutes)
```

### Resource Usage

```
CPU: Low (static content only)
Memory: 256MB
Disk: 100MB (artifact storage)
Network: ~1MB/job (small HTML app)
```

### Parallelization

```
Sequential Stages: 1→2→3→4→5→6
  (Each stage must complete before next)

Within Stage: Some steps can parallel
  - Download artifact + Prepare deployment (test)
  - Validate HTML + Validate CSS + Validate JS (parallel)

Overall Workflow: 
  - All 6 jobs scheduled immediately
  - Dependency graph determines execution order
  - GitHub Actions manages optimal scheduling
```

### Optimization Tips

```
To Speed Up:
- Remove expensive tests (not recommended)
- Skip artifact upload for non-deploy branches
- Cache Node.js modules (if added)
- Use self-hosted runners (for faster execution)

To Reduce Artifacts:
- Set ARTIFACT_RETENTION_DAYS to 7
- Delete old workflow runs manually
- Use artifact cleanup action

To Improve Reliability:
- Add retry logic for network operations
- Implement health checks
- Use failure notifications
```

---

## Advanced Configuration

### Conditional Deployments

```yaml
# Deploy only on main branch
- name: Deploy Production
  if: needs.detect-branch.outputs.is-main == 'true'
  run: deploy-to-production.sh

# Skip on pull requests
- name: Real Deploy
  if: github.event_name == 'push'
  run: deploy.sh

# Only on specific commits
- name: Deploy on Release
  if: contains(github.ref, 'refs/tags/v')
  run: deploy-to-production.sh
```

### Environment Variables

```yaml
env:
  # Global
  ARTIFACT_RETENTION_DAYS: 30
  NODE_VERSION: '18'
  
  # Job-specific
  jobs:
    deploy:
      env:
        DEPLOY_USER: ${{ secrets.DEPLOY_USER }}
        DEPLOY_HOST: ${{ secrets.DEPLOY_HOST }}
```

### Matrix Strategies

```yaml
# Future enhancement: multiple Node versions
strategy:
  matrix:
    node-version: [16, 18, 20]
    os: [ubuntu-latest, windows-latest]
  fail-fast: false
```

---

## Security Considerations

### Secrets Management

```
✓ Use GitHub Secrets for sensitive data
✓ Rotate credentials regularly
✓ Use fine-grained personal access tokens
✓ Restrict secret usage by environment
✗ Never commit secrets
✗ Don't log secrets in step summaries
```

### Access Control

```
Branch Protection (main):
  - Require pull request review
  - Restrict who can merge
  - Require up-to-date branch before merge
  - Require status checks

Role-Based:
  - Admin: Can merge to main
  - Dev: Can merge to dev/test
  - Everyone: Can create feature branches
```

### Audit Trail

```
All workflow executions logged:
  - Branch name
  - Commit SHA
  - Author
  - Timestamp
  - Stage results
  - Deployment details

Accessible via:
  - GitHub UI (Actions tab)
  - GitHub API
  - Audit logs (org-level)
```

---

**Version**: 1.0  
**Last Updated**: December 29, 2025
