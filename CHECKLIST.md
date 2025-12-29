# Implementation Checklist & Deployment Guide

## 🚀 Pre-Deployment Checklist

### Repository Setup
- [ ] Repository cloned locally
- [ ] All files committed to git
- [ ] `.github/workflows/ci-cd.yml` present and valid
- [ ] `src/` directory contains index.html, styles.css, app.js
- [ ] README.md, QUICK_START.md, ARCHITECTURE.md present

### Branch Creation
- [ ] `test` branch created and pushed
- [ ] `dev` branch created and pushed
- [ ] `branch-1` created and pushed (test feature)
- [ ] `branch-2` created and pushed (test feature)
- [ ] All branches visible in GitHub UI

### GitHub Configuration

#### Branch Protection (main)
- [ ] Go to Settings → Branches → Add branch protection rule
- [ ] Pattern: `main`
- [ ] ✅ Require pull request reviews before merging
- [ ] ✅ Require status checks to pass before merging
- [ ] ✅ Include administrators
- [ ] Save rule

#### Deployment Secrets (Optional, for real deployments)
- [ ] Go to Settings → Secrets and variables → Actions
- [ ] Add `DEPLOY_HOST` (e.g., `192.168.1.100`)
- [ ] Add `DEPLOY_USER` (e.g., `deploy`)
- [ ] Add `DEPLOY_KEY` (SSH private key contents)

#### Actions Permissions
- [ ] Settings → Actions → General
- [ ] ✅ Allow all actions and reusable workflows
- [ ] ✅ Allow GitHub Actions to create pull requests

---

## 🧪 Testing the Pipeline

### Test 1: Feature Branch Push
```bash
# Step 1: Switch to feature branch
git checkout branch-1

# Step 2: Make a small change (optional)
echo "<!-- Test commit -->" >> src/index.html

# Step 3: Commit and push
git add .
git commit -m "test: Verify pipeline"
git push origin branch-1

# Step 4: Monitor
# Go to GitHub → Actions tab
# Watch workflow run through all 6 stages
# Expected: ✓ PASS (green checkmark)
```

**What to observe**:
- [x] Branch detected as `branch-1`
- [x] Build stage completes
- [x] Tests pass
- [x] Deployment gates pass
- [x] Deployment to `/var/www/features/branch-1/`
- [x] Step summary generated

### Test 2: Pull Request to dev
```bash
# Step 1: Create PR via GitHub UI
# Base: dev
# Compare: branch-1
# Title: "test: Feature 1"

# Step 2: Monitor workflow
# Go to Actions tab
# Watch PR status checks

# Expected: All checks ✓ PASS
```

### Test 3: Merge to dev
```bash
# (After PR approval)
# Click "Merge pull request" → "Create merge commit"

# Monitor:
# - Workflow triggers on merge
# - Deploy stage runs
# - Code deploys to /var/www/dev/
# - Summary shows "Ready for promotion to staging"
```

### Test 4: Full Promotion Chain
```bash
# Create PR: dev → test
git checkout test
git pull origin test
git merge dev
git push origin test

# After merge:
# 1. Workflow triggers
# 2. Deploy to /var/www/test/
# 3. Ready for production promotion

# Create PR: test → main
git checkout main
git pull origin main
git merge test
git push origin main

# After merge:
# 1. Workflow triggers
# 2. Deploy to /var/www/html/ (PRODUCTION)
# 3. Application live
```

---

## ✅ Verification Steps

### Workflow File
```bash
# Validate YAML syntax
yaml-lint .github/workflows/ci-cd.yml

# Or check in GitHub Actions (runs automatically)
```

### HTML Application
```bash
# Verify HTML structure
grep -q "app-title" src/index.html && echo "✓ app-title found"
grep -q "<!DOCTYPE html>" src/index.html && echo "✓ DOCTYPE found"
grep -q "<body>" src/index.html && echo "✓ Body tag found"

# Verify CSS
ls -la src/styles.css && echo "✓ CSS file present"

# Verify JavaScript
node -c src/app.js && echo "✓ JS syntax valid"
```

### Git Branches
```bash
git branch -a
# Output should include:
# * main
#   dev
#   test
#   branch-1
#   branch-2
#   origin/main
#   origin/dev
#   origin/test
#   origin/branch-1
#   origin/branch-2
```

### GitHub Status
```bash
# Using GitHub CLI (if installed)
gh repo view --web  # Opens repo in browser
gh run list         # Shows recent workflow runs
gh status          # Shows any issues
```

---

## 🔧 Configuration Options

### Modify Artifact Retention
Edit [.github/workflows/ci-cd.yml](.github/workflows/ci-cd.yml#L17):
```yaml
env:
  ARTIFACT_RETENTION_DAYS: 30  # Change to: 7, 14, 60, 90
```

### Change Node Version
Edit [.github/workflows/ci-cd.yml](.github/workflows/ci-cd.yml#L18):
```yaml
env:
  NODE_VERSION: '18'  # Change to: '16', '20', etc.
```

### Add Additional Validation
Edit build stage validation steps in [ci-cd.yml](.github/workflows/ci-cd.yml#L169-L200):
```bash
# Add new validation command
if grep -q "your-check" build/index.html; then
  echo "✓ Your check passed"
fi
```

### Enable Slack Notifications
Add to deploy stage:
```yaml
- name: Notify Slack
  if: always()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {
        "text": "Deployment to ${{ needs.detect-branch.outputs.branch }} complete"
      }
```

---

## 🚨 Troubleshooting Common Issues

### Issue: Workflow Not Triggering

**Symptoms**: Push to branch-1, but no workflow runs

**Solutions**:
1. Verify branch name matches pattern:
   ```bash
   git branch -a  # Check branch exists
   ```
2. Check GitHub Actions enabled:
   - Settings → Actions → General → Enabled ✓
3. Verify workflow file syntax:
   - `.github/workflows/ci-cd.yml` exists
   - YAML syntax is valid
4. Check branch protection:
   - If main requires checks, workflow must complete first

### Issue: Build Fails - "Missing element"

**Error**: `✗ Missing app title element`

**Solution**:
1. Verify HTML structure:
   ```bash
   grep "id=\"app-title\"" src/index.html
   # Should output: <h1 id="app-title">...</h1>
   ```
2. Fix if needed, commit, and push:
   ```bash
   git add src/index.html
   git commit -m "fix: Add missing app-title element"
   git push
   ```

### Issue: Deployment Fails

**Symbols**: ✗ in Deploy stage

**Causes**:
- [ ] SSH credentials not configured
- [ ] Server unreachable
- [ ] Insufficient permissions
- [ ] Disk space full

**Solutions**:
1. Verify secrets are set:
   ```bash
   # GitHub UI: Settings → Secrets
   # Should see DEPLOY_HOST, DEPLOY_USER, DEPLOY_KEY
   ```
2. Test SSH connection locally:
   ```bash
   ssh -i /path/to/key deploy@$HOST "ls -la /var/www/"
   ```
3. Check server disk space:
   ```bash
   ssh deploy@$HOST "df -h /var/www/"
   ```

### Issue: JavaScript Syntax Error

**Error**: `Error: SyntaxError: ...` in JS validation

**Solution**:
1. Test locally:
   ```bash
   node -c src/app.js
   ```
2. Fix errors:
   ```javascript
   // Common issues:
   // - Missing semicolons
   // - Unclosed brackets
   // - Incorrect function syntax
   ```
3. Commit and push:
   ```bash
   git add src/app.js
   git commit -m "fix: JS syntax error"
   git push
   ```

---

## 📊 Monitoring After Deployment

### Check Deployment Status
1. Go to Actions tab
2. Click latest workflow run
3. Scroll to "Deploy" stage
4. Verify all deployment steps show ✓

### Verify Application Running
```bash
# On production server
curl http://localhost:8080
# Should return HTML with "Hello World"

# Check service status
systemctl status app
# Should show "active (running)"
```

### View Logs
```bash
# Via GitHub Actions
Actions → Click run → Expand step → View logs

# Via GitHub CLI
gh run view <RUN_ID> --log > workflow.log
```

### Monitor Performance
```bash
# Response time
time curl http://localhost:8080

# Load testing (optional)
ab -n 100 -c 10 http://localhost:8080/
```

---

## 🔄 Ongoing Maintenance

### Weekly Tasks
- [ ] Review failed workflow runs
- [ ] Check artifact storage usage
- [ ] Verify all branches are up to date

### Monthly Tasks
- [ ] Review and rotate SSH keys if needed
- [ ] Clean up old branches
- [ ] Audit deployment logs
- [ ] Update dependencies if needed

### Quarterly Tasks
- [ ] Review branch protection rules
- [ ] Update GitHub Actions versions
- [ ] Performance optimization review
- [ ] Security audit

---

## 📋 Team Onboarding

### For New Developers

1. **Clone Repository**
   ```bash
   git clone https://github.com/selvar2/ci-cd-sample.git
   cd ci-cd-sample
   ```

2. **Read Documentation**
   - Read [QUICK_START.md](QUICK_START.md) (5 mins)
   - Read [README.md](README.md) (20 mins)

3. **Create Feature Branch**
   ```bash
   git checkout dev
   git checkout -b branch-name
   ```

4. **Make Changes**
   ```bash
   # Edit files in src/
   # Commit: git add . && git commit -m "description"
   # Push: git push origin branch-name
   ```

5. **Create Pull Request**
   - Go to GitHub → Compare & pull request
   - Set base: dev, compare: branch-name
   - Request review

6. **Watch Pipeline**
   - Go to Actions tab
   - Observe all 6 stages complete

### For DevOps Engineers

1. **Understand Architecture**
   - Read [ARCHITECTURE.md](ARCHITECTURE.md) (30 mins)

2. **Review Workflow File**
   - Study [.github/workflows/ci-cd.yml](.github/workflows/ci-cd.yml)
   - Understand job dependencies

3. **Configure Deployment**
   - Set up GitHub Secrets
   - Configure deployment servers
   - Test deployment process

4. **Monitor & Maintain**
   - Watch workflow runs
   - Debug issues as they arise
   - Optimize performance

---

## 🎓 Learning Resources

### GitHub Actions
- [Official Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax Reference](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Contexts Documentation](https://docs.github.com/en/actions/learn-github-actions/contexts)

### Git Workflows
- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Trunk Based Development](https://trunkbaseddevelopment.com/)

### CI/CD Best Practices
- [DevOps Handbook](https://itrevolution.com/book/the-devops-handbook/)
- [Continuous Integration](https://martinfowler.com/articles/continuousIntegration.html)
- [Deployment Patterns](https://martinfowler.com/bliki/BlueGreenDeployment.html)

---

## ✨ Success Criteria

Your CI/CD pipeline is working correctly when:

- [x] All 6 workflow stages complete successfully
- [x] Artifacts are created and uploaded
- [x] Code deploys to correct environments (dev/test/main)
- [x] Branch detection works accurately
- [x] Cross-branch conflicts are prevented
- [x] Promotion rules are enforced (feature→dev→test→main)
- [x] Rollback can be performed via git revert
- [x] Team members can create PRs and merge without errors
- [x] Monitoring shows successful deployments
- [x] Documentation is clear and comprehensive

---

## 🎉 You're Ready!

Congratulations! Your multi-branch CI/CD pipeline is now:

✅ Fully configured  
✅ Tested and verified  
✅ Ready for production use  
✅ Well documented  
✅ Monitored and maintained  

### Next Steps:
1. Have your team review the documentation
2. Run the test scenarios
3. Deploy your first real feature
4. Monitor the production deployment
5. Celebrate your automation! 🚀

---

**Created**: December 29, 2025  
**Version**: 1.0  
**Maintained By**: DevOps Team
