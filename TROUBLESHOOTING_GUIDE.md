# Claude Code Plugin Installation Troubleshooting Guide

**Date:** January 14, 2026  
**Session:** Claude Code Plugin Marketplace Setup and Installation

## Table of Contents
1. [Prerequisites Check](#prerequisites-check)
2. [Claude Code CLI Installation](#claude-code-cli-installation)
3. [SSH Authentication Issues](#ssh-authentication-issues)
4. [Marketplace Configuration Issues](#marketplace-configuration-issues)
5. [Plugin Installation Errors](#plugin-installation-errors)
6. [Common Solutions](#common-solutions)

---

## Prerequisites Check

### Issue: Claude Code CLI Not Found

**Error:**
```powershell
PS> claude --version
claude : The term 'claude' is not recognized as the name of a cmdlet, function, script file, or operable program.
Check the spelling of the name, or if a path was included, verify that the path is correct and try again.
```

**Solution:**
Install Claude Code CLI globally using npm:

```bash
npm install -g @anthropic-ai/claude-code
```

**Verification:**
```bash
claude --version
```

**Expected Output:**
```
2.1.7 (Claude Code)
```

**Alternative Approach:**
If npm is not available, download the binary directly from the Claude Code releases page or use package managers like:
- Windows: `winget install Anthropic.ClaudeCode` (if available)
- macOS: `brew install claude-code` (if available)

---

## SSH Authentication Issues

### Issue: HTTPS Authentication Failed for Private Repositories

**Error:**
```powershell
PS> claude plugin marketplace add anthropic-ai/claude-code-plugins
Adding marketplace...
Cloning via SSH: git@github.com:anthropic-ai/claude-code-plugins.git
Cloning repository: git@github.com:anthropic-ai/claude-code-plugins.git
SSH clone failed, retrying with HTTPS: https://github.com/anthropic-ai/claude-code-plugins.git
Cloning repository: https://github.com/anthropic-ai/claude-code-plugins.git
× Failed to add marketplace: Failed to clone marketplace repository: HTTPS authentication failed. 
For private repos, set GITHUB_TOKEN, GITLAB_TOKEN, or BITBUCKET_TOKEN environment variable.

Original error: Cloning into 'C:\Users\Lenovo\.claude\plugins\marketplaces\anthropic-ai-claude-code-plugins'...
fatal: could not read Username for 'https://github.com': terminal prompts disabled
```

**Root Cause:**
- Repository doesn't exist or is private
- SSH key not properly configured
- Git credentials not set up

**Solution 1: Configure Git User Credentials**

```bash
git config --global user.email "your-email@example.com"
git config --global user.name "Your Name"
```

**Solution 2: Verify SSH Key Setup**

```bash
# Check if SSH key exists
cat ~/.ssh/id_rsa.pub

# Test SSH connection to GitHub
ssh -T git@github.com
```

**Expected Output:**
```
Hi username! You've successfully authenticated, but GitHub does not provide shell access.
```

**Solution 3: Use Correct Repository Name**

The correct repository is `anthropics/claude-plugins-official` (not `anthropic-ai/claude-code-plugins`):

```bash
claude plugin marketplace add anthropics/claude-plugins-official
```

**Expected Output:**
```
Adding marketplace...
Cloning via SSH: git@github.com:anthropics/claude-plugins-official.git
Cloning repository: git@github.com:anthropics/claude-plugins-official.git
Clone complete, validating marketplace…
√ Successfully added marketplace: claude-plugins-official
```

**Alternative Approach:**
For private repositories, set environment variables:

```powershell
# PowerShell
$env:GITHUB_TOKEN = "ghp_your_token_here"

# Or permanently in profile
[System.Environment]::SetEnvironmentVariable("GITHUB_TOKEN", "ghp_your_token_here", "User")
```

---

## Marketplace Configuration Issues

### Issue: Invalid Marketplace Source Format

**Error:**
```powershell
PS> claude plugin marketplace add "C:/Users/Lenovo/claude-marketplace"
× Invalid marketplace source format. Try: owner/repo, https://..., or ./path
```

**Root Cause:**
Claude Code expects relative paths when adding local marketplaces, not absolute paths.

**Solution:**
Use relative path from current directory or home directory:

```bash
# From home directory
cd ~
claude plugin marketplace add "./claude-marketplace"

# Or from project directory with relative path
claude plugin marketplace add "../claude-marketplace"
```

**Expected Output:**
```
Adding marketplace...
√ Successfully added marketplace: local-dev-tools
```

**Alternative Approach:**
Use GitHub repository format even for local testing:

```bash
# Create a git repository
cd claude-marketplace
git init
git add .
git commit -m "Initial marketplace"

# Then add via git URL
claude plugin marketplace add https://github.com/username/claude-marketplace.git
```

---

## Plugin Installation Errors

### Issue: Plugin Source Path Not Found

**Error:**
```powershell
PS> claude plugin install review-plugin@local-dev-tools
Installing plugin "review-plugin@local-dev-tools"...
× Failed to install plugin "review-plugin@local-dev-tools": Source path does not exist: 
C:\Users\Lenovo\claude-marketplace\review-plugin
```

**Root Cause:**
Marketplace JSON uses incorrect source path. The `pluginRoot` metadata field or relative paths are not resolving correctly.

**Solution:**
Fix the marketplace.json file to use correct relative paths:

**Before (Incorrect):**
```json
{
  "metadata": {
    "pluginRoot": "./plugins"
  },
  "plugins": [
    {
      "name": "review-plugin",
      "source": "./review-plugin"
    }
  ]
}
```

**After (Correct):**
```json
{
  "plugins": [
    {
      "name": "review-plugin",
      "source": "./plugins/review-plugin"
    }
  ]
}
```

**Update Marketplace:**
```bash
claude plugin marketplace update local-dev-tools
```

**Expected Output:**
```
Updating marketplace: local-dev-tools...
Validating local marketplace
√ Successfully updated marketplace: local-dev-tools
```

**Alternative Approach:**
Remove `pluginRoot` from metadata and use full relative paths from marketplace root for all plugin sources.

---

### Issue: Marketplace Validation Errors

**Error:**
```powershell
PS> claude plugin validate .
× File not found: .claude-plugin/marketplace.json
```

**Solution:**
Ensure you're in the correct directory and the marketplace.json file exists:

```bash
# Check current directory structure
ls -la .claude-plugin/

# Or on Windows
dir .claude-plugin

# Validate from marketplace root
cd path/to/marketplace
claude plugin validate .
```

**Expected Output:**
```
Validating marketplace manifest: C:\Users\Lenovo\claude-marketplace\.claude-plugin\marketplace.json
√ Validation passed
```

---

## Common Solutions

### Solution 1: List All Marketplaces

**Command:**
```bash
claude plugin marketplace list
```

**Expected Output:**
```
Configured marketplaces:

  > claude-plugins-official
    Source: GitHub (anthropics/claude-plugins-official)

  > local-dev-tools
    Source: Directory (C:\Users\Lenovo\claude-marketplace)
```

---

### Solution 2: Update Marketplace

**Command:**
```bash
# Update specific marketplace
claude plugin marketplace update claude-plugins-official

# Update all marketplaces
claude plugin marketplace update
```

**Expected Output:**
```
Updating marketplace: claude-plugins-official...
√ Successfully updated marketplace: claude-plugins-official
```

---

### Solution 3: Remove Marketplace

**Command:**
```bash
claude plugin marketplace remove marketplace-name
```

**Use Case:**
When marketplace is misconfigured or no longer needed.

---

### Solution 4: Check Installed Plugins

**Command:**
```bash
# View installed plugins file
cat ~/.claude/plugins/installed_plugins.json

# Or on Windows PowerShell
Get-Content "$HOME\.claude\plugins\installed_plugins.json" | ConvertFrom-Json
```

**Expected Output:**
```json
{
  "version": 2,
  "plugins": {
    "plugin-name@marketplace-name": [
      {
        "scope": "user",
        "installPath": "C:\\Users\\...",
        "version": "1.0.0",
        "installedAt": "2026-01-14T08:46:25.713Z"
      }
    ]
  }
}
```

---

### Solution 5: Enable/Disable Plugins

**Commands:**
```bash
# Disable a plugin
claude plugin disable plugin-name@marketplace-name

# Enable a plugin
claude plugin enable plugin-name@marketplace-name
```

---

### Solution 6: Uninstall Plugin

**Command:**
```bash
claude plugin uninstall plugin-name@marketplace-name
```

**Expected Output:**
```
Uninstalling plugin "plugin-name@marketplace-name"...
√ Successfully uninstalled plugin: plugin-name@marketplace-name
```

---

## Error Code Reference

| Error Code | Description | Solution |
|------------|-------------|----------|
| `CommandNotFoundException` | CLI not installed | Install via `npm install -g @anthropic-ai/claude-code` |
| `HTTPS authentication failed` | Git credentials missing | Configure git user or set GITHUB_TOKEN |
| `Invalid marketplace source format` | Wrong path format | Use relative paths (`./path`) or GitHub format |
| `Source path does not exist` | Plugin path incorrect | Fix marketplace.json source paths |
| `File not found: marketplace.json` | Wrong directory | Run validate from marketplace root |
| `Failed to clone marketplace repository` | Repository access issue | Check SSH keys or repository URL |

---

## Best Practices

1. **Always validate marketplace before adding:**
   ```bash
   claude plugin validate .
   ```

2. **Use relative paths in marketplace.json:**
   ```json
   "source": "./plugins/plugin-name"
   ```

3. **Test locally before distributing:**
   ```bash
   claude plugin marketplace add ./local-marketplace
   claude plugin install test-plugin@local-marketplace
   ```

4. **Keep marketplace updated:**
   ```bash
   claude plugin marketplace update
   ```

5. **Verify SSH keys before cloning:**
   ```bash
   ssh -T git@github.com
   ```

---

## Additional Resources

- [Claude Code Plugin Documentation](https://code.claude.com/docs/en/plugins)
- [Marketplace Creation Guide](https://code.claude.com/docs/en/plugin-marketplaces)
- [GitHub SSH Setup](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)
- [Claude Code CLI Reference](https://code.claude.com/docs/en/cli)

---

## Session Summary

**Date:** January 14, 2026  
**Total Plugins Installed:** 48  
**Marketplaces Configured:** 2  
**Issues Resolved:** 5  
**Status:** ✅ All plugins successfully installed
