# Visual Workflow Reference

## 🎯 Complete Pipeline Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     GitHub Push/PR Event                                │
│                    (any branch: main/test/dev/*)                        │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
        ┌──────────────────────────────────────────────────┐
        │    JOB 1: DETECT BRANCH                          │
        │    • Identify branch type                         │
        │    • Set environment-specific flags              │
        │    • Output: branch, is-main, is-test, is-dev    │
        └──────────────────┬───────────────────────────────┘
                           │
                ┌──────────┴──────────┐
                │                     │
        ┌───────▼──────────┐  ┌──────▼──────────┐
        │  JOB 2: BUILD    │  │  JOB 3: TEST    │
        ├──────────────────┤  ├─────────────────┤
        │ ✓ Checkout code  │  │ ✓ HTML linting  │
        │ ✓ Copy files     │  │ ✓ CSS validate  │
        │ ✓ Inject meta    │  │ ✓ JS syntax     │
        │ ✓ Validate HTML  │  │ ✓ Accessibility │
        │ ✓ Validate CSS   │  │ ✓ Performance   │
        │ ✓ Validate JS    │  └─────────────────┘
        │ ✓ Upload artifact│
        └──────────────────┘
                │
                ▼
        ┌──────────────────────────────────────────────────┐
        │    JOB 4: DEPLOYMENT GATES                       │
        │    • Check promotion rules                        │
        │    • Enforce branch policies                      │
        │    • Output: gate status                          │
        └──────────────────┬───────────────────────────────┘
                           │
                ┌──────────┴──────────────────────────────┐
                │                                         │
        ┌───────▼──────────────────────────────────┐    │
        │    JOB 5: DEPLOY                        │    │
        │                                         │    │
        │  if branch == main:                     │    │
        │    Deploy to: /var/www/html/           │    │
        │                                         │    │
        │  elif branch == test:                   │    │
        │    Deploy to: /var/www/test/           │    │
        │                                         │    │
        │  elif branch == dev:                    │    │
        │    Deploy to: /var/www/dev/            │    │
        │                                         │    │
        │  elif branch matches branch-*:         │    │
        │    Deploy to: /var/www/features/{name} │    │
        │                                         │    │
        │  ✓ Download artifacts                  │    │
        │  ✓ Transfer files                      │    │
        │  ✓ Restart service                     │    │
        │  ✓ Verify deployment                   │    │
        └───────┬──────────────────────────────────┘    │
                │                                         │
                └─────────────────┬──────────────────────┘
                                  │
                                  ▼
        ┌──────────────────────────────────────────────────┐
        │    JOB 6: SUMMARY                                │
        │    • Generate final report                        │
        │    • Show next steps                              │
        │    • Always runs (even on failure)                │
        └──────────────────────────────────────────────────┘
                                  │
                                  ▼
                    ✅ Pipeline Complete
```

---

## 🌳 Branch Topology

```
main (Production)
  │  ← Merges from test only
  │  ← Deployment: /var/www/html/
  │
test (Staging)
  │  ← Merges from dev only
  │  ← Deployment: /var/www/test/
  │
dev (Development)
  │  ← Merges from feature branches
  │  ← Deployment: /var/www/dev/
  │
  ├─ branch-1
  │  └─ Deployment: /var/www/features/branch-1/
  │
  ├─ branch-2
  │  └─ Deployment: /var/www/features/branch-2/
  │
  └─ feature/user-auth
     └─ Deployment: /var/www/features/feature-user-auth/
```

---

## 📊 Job Dependency Graph

```
                    detect-branch
                          │
              ┌───────────┼───────────┐
              │           │           │
            build        test   deployment-gates
              │           │           │
              └─────┬─────┴─────┬─────┘
                    │           │
                  deploy        │
                    │           │
                    └─────┬─────┘
                          │
                       summary
                    (always runs)
```

**Execution Order**:
1. `detect-branch` (starts first)
2. `build`, `test` (start after detect-branch)
3. `deployment-gates` (waits for build + test)
4. `deploy` (waits for all previous)
5. `summary` (runs always, even on failure)

---

## 🔄 Code Promotion Journey

### Scenario: Developing Feature

```
1. Developer creates feature branch
   git checkout -b branch-1

2. Pushes changes
   git push origin branch-1
   ↓
   CI/CD Pipeline Triggers:
   ├─ Build & validate
   ├─ Run tests
   ├─ Deploy to /var/www/features/branch-1/
   └─ Generate report
   ✓ COMPLETE

3. Creates PR to dev
   Base: dev | Compare: branch-1
   ↓
   Workflow runs on PR:
   ├─ All checks must pass ✓
   └─ Request review

4. After review & approval
   Clicks "Merge pull request"
   ↓
   CI/CD Pipeline Triggers:
   ├─ Build & validate
   ├─ Deploy to /var/www/dev/
   └─ Generate report
   ✓ COMPLETE (branch-1 merged to dev)

5. Developer creates PR: dev → test
   Base: test | Compare: dev
   ↓
   Workflow checks status
   After approval: Merge to test
   ↓
   CI/CD Pipeline Triggers:
   ├─ Build & validate
   ├─ Deploy to /var/www/test/
   └─ Generate report
   ✓ COMPLETE (code in staging)

6. QA tests in staging (2-7 days)
   Confirms ready for production

7. Create PR: test → main
   Base: main | Compare: test
   ↓
   Workflow checks status
   After approval: Merge to main
   ↓
   CI/CD Pipeline Triggers:
   ├─ Build & validate
   ├─ Deploy to /var/www/html/ ← PRODUCTION
   └─ Generate report
   ✓ COMPLETE ✨ LIVE IN PRODUCTION
```

---

## 🎯 Branch Detection Decision Tree

```
Start: git push origin <branch>
│
├─ Is branch named "main"?
│  ├─ YES → Type: PRODUCTION
│  │        Env: /var/www/html/
│  │        Approval: Required
│  │        Deploy: Auto after approval
│  │
│  └─ NO → Continue
│
├─ Is branch named "test"?
│  ├─ YES → Type: STAGING
│  │        Env: /var/www/test/
│  │        Approval: Code review
│  │        Deploy: Auto after merge
│  │
│  └─ NO → Continue
│
├─ Is branch named "dev"?
│  ├─ YES → Type: DEVELOPMENT
│  │        Env: /var/www/dev/
│  │        Approval: Code review
│  │        Deploy: Auto after merge
│  │
│  └─ NO → Continue
│
└─ Does branch match pattern "branch-*"?
   ├─ YES → Type: FEATURE
   │        Env: /var/www/features/{branch}/
   │        Approval: None (isolated)
   │        Deploy: Auto on push
   │
   └─ NO → ERROR (Unknown branch)
```

---

## 📈 Timing Breakdown

```
Timeline (seconds):
│
├─ 0-5s     : Workflow queued
│
├─ 5-15s    : Stage 1: Detect Branch
│  └─ Output: branch flags
│
├─ 15-30s   : Stage 2: Build
│  └─ Output: build artifacts
│
├─ 30-50s   : Stage 3: Test
│  └─ Output: test results
│
├─ 50-55s   : Stage 4: Gates
│  └─ Output: gate status
│
├─ 55-85s   : Stage 5: Deploy
│  └─ Output: deployment log
│
└─ 85-90s   : Stage 6: Summary
   └─ Output: final report

Total: ~90 seconds (1-2 minutes)
```

---

## 🔐 Security & Approval Flow

```
Feature Branch (branch-1)
  ├─ Push commit
  └─ No approval needed ✓
     Auto-deploys to feature environment

Dev Branch (dev)
  ├─ Create PR from feature
  ├─ Request code review
  ├─ Reviewer approves or requests changes
  └─ After approval: Merge allowed ✓
     Auto-deploys to dev environment

Test Branch (test)
  ├─ Create PR from dev
  ├─ Request code review
  ├─ Reviewer approves
  └─ After approval: Merge allowed ✓
     Auto-deploys to test environment

Main Branch (main) 🔴 PROTECTED
  ├─ Create PR from test
  ├─ Request review from maintainer
  ├─ All status checks must pass ✓
  ├─ Maintainer must approve
  └─ After approval: Merge allowed ✓
     Auto-deploys to PRODUCTION 🚀
```

---

## 📋 Artifact Lifecycle

```
Build Stage (2:00 PM)
  ├─ Files compiled
  ├─ Metadata injected
  └─ Uploaded: build-branch-1
     └─ Name: build-branch-1
        Size: ~50KB
        Retention: 30 days

Deploy Stage (2:05 PM)
  ├─ Download: build-branch-1
  ├─ Extract contents
  └─ Deploy to server

Archive (Day 30)
  └─ Auto-deleted by GitHub
     Space reclaimed
```

---

## 🚨 Error & Recovery Flow

```
Commit pushed
  │
  ├─ Build fails
  │  └─ ✗ Status: RED
  │     └─ Workflow stops
  │        └─ Fix code locally
  │           └─ Push fix
  │              └─ Workflow re-runs
  │
  ├─ Tests fail
  │  └─ ✗ Status: RED
  │     └─ Cannot merge to main
  │        └─ Fix code
  │           └─ Push fix
  │              └─ Tests re-run
  │
  ├─ Deployment fails
  │  └─ ✗ Status: RED
  │     └─ Previous version remains live
  │        └─ Fix issue
  │           └─ Push corrected code
  │              └─ Re-deploy
  │
  └─ All pass
     └─ ✅ Status: GREEN
        └─ Ready to merge
           └─ PR approved
              └─ Merge allowed
                 └─ Auto-deploy
```

---

## 🎬 Live Scenario: Hello City Feature

```
Developer: "I want to add Hello City feature to branch-1"

1. Local Development (Day 1)
   └─ git checkout -b branch-1
      └─ Edit src/index.html
         └─ Add: <h1>Hello City</h1>
            └─ git add . && git commit -m "feat: Hello City"
               └─ git push origin branch-1
                  └─ GitHub: Workflow starts ⚙️

2. Workflow Execution (0-2 minutes)
   └─ Stage 1: Detect branch as 'branch-1' ✓
      └─ Stage 2: Build & validate ✓
         └─ Stage 3: Tests pass ✓
            └─ Stage 4: Gates check ✓
               └─ Stage 5: Deploy to /var/www/features/branch-1/ ✓
                  └─ Stage 6: Summary generated ✓
                     └─ Workflow: ✅ PASS

3. Feature Promotion (Day 1-2)
   └─ GitHub: Create PR branch-1 → dev
      └─ Team reviews code
         └─ Approver: "Looks good!"
            └─ Click "Merge pull request"
               └─ Workflow: Deploy to /var/www/dev/ ✓

4. Development Testing (Day 2)
   └─ Team verifies in /var/www/dev/
      └─ "Hello City feature working! Ready for staging."
         └─ Create PR dev → test
            └─ Approved and merged
               └─ Workflow: Deploy to /var/www/test/ ✓

5. Staging/QA Testing (Day 2-5)
   └─ QA team tests in /var/www/test/
      └─ Verifies: "Hello City displays correctly"
         └─ Approves for production
            └─ Create PR test → main
               └─ Review + Approval required
                  └─ Merge to main
                     └─ Workflow: Deploy to /var/www/html/ ✓

6. Production (Day 5 - Live)
   └─ /var/www/html/ displays "Hello City"
      └─ Users see the feature ✨
         └─ Success! 🎉
```

---

## 📊 Environment Matrix

```
┌──────────────┬──────────────┬─────────────────────────┬──────────────┐
│ Branch       │ Environment  │ Location                │ Purpose      │
├──────────────┼──────────────┼─────────────────────────┼──────────────┤
│ main         │ Production   │ /var/www/html/          │ Live         │
│ test         │ Staging      │ /var/www/test/          │ QA testing   │
│ dev          │ Development  │ /var/www/dev/           │ Integration  │
│ branch-*     │ Feature      │ /var/www/features/{}/    │ Isolated dev │
└──────────────┴──────────────┴─────────────────────────┴──────────────┘

Access:
  Public → /var/www/html/ (production)
  Internal → /var/www/test/ (staging)
  Developers → /var/www/dev/ (development)
  Developers → /var/www/features/branch-1/ (feature-specific)
```

---

## 🔄 Rollback Scenario

```
Production Issue Detected (Day 5, 3:00 PM)
  │
  ├─ User reports: "Hello City displaying incorrectly"
  │
  └─ Immediate Action:
     │
     ├─ Developer checks code
     │  └─ Finds issue in index.html
     │
     ├─ Create hotfix branch
     │  └─ git checkout main
     │     └─ git checkout -b hotfix/city-display
     │
     ├─ Fix the issue
     │  └─ Edit src/index.html
     │     └─ git commit -m "fix: Hello City display"
     │
     ├─ Quick promotion path:
     │  └─ PR to dev → approved → merge
     │  └─ PR to test → approved → merge
     │  └─ PR to main → approved → merge
     │
     ├─ Workflow runs
     │  └─ Deploy to /var/www/html/
     │
     └─ Issue resolved ✅
        Rollback complete: 5-10 minutes

Alternative: Direct Revert
  │
  ├─ Find problematic commit: abc123def
  │
  ├─ git revert -m 1 abc123def
  │  └─ Creates new commit that undoes changes
  │
  ├─ git push origin main
  │  └─ Workflow auto-runs
  │     └─ Deploys previous version
  │
  └─ Issue resolved ✅
     Previous code live again
```

---

## 📱 Multi-Device Deployment Check

```
After deployment to main:

Desktop Browser (Desktop /var/www/html/)
  └─ URL: http://example.com
     └─ Display: "Hello World" ✓
        └─ Styles: Full CSS applied ✓
           └─ Functions: JavaScript active ✓

Mobile Browser (same /var/www/html/)
  └─ URL: http://example.com
     └─ Display: Responsive design ✓
        └─ Touch: Interactive elements work ✓

Tablet Browser (same /var/www/html/)
  └─ URL: http://example.com
     └─ Display: Optimized layout ✓

API Client / Curl
  └─ Command: curl http://example.com
     └─ Response: HTML with meta tags ✓
        └─ Headers: Correct content-type ✓
```

---

**Visual Reference Version**: 1.0  
**Created**: December 29, 2025
