# Sentinel Journal 🛡️

## 2025-05-01 - CI/CD Script Injection
**Vulnerability:** Unsanitized branch name injection in CI/CD pipeline leading to Stored XSS in build artifacts.
**Learning:** Build pipelines often trust git metadata (like branch names) implicitly, but these are user-controlled inputs that end up in the final product.
**Prevention:** Always sanitize or HTML-encode any variable from the build environment (branch names, commit messages, author names) before injecting them into HTML/JS files.
