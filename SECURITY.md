# Security Guidelines - NextPik

## Incident Report: February 23, 2026

**Issue:** SEO spam links appeared on production site
**Root Cause:** Failed production build (Next.js 15 compatibility issue) caused stale build to remain deployed
**Resolution:** Fixed build error, redeployed clean build
**Lesson:** Failing builds can leave vulnerable/stale code in production

---

## Security Measures Implemented

### 1. Build & Deployment Monitoring

- **Always monitor build status** - Failed builds = stale code in production
- **Enable deployment notifications** (Slack, email, Discord)
- **Set up build status badges** in repository README
- **Use Vercel/Netlify deployment protections** - prevent deploying broken builds

### 2. Content Security Policy (CSP)

See `next.config.js` for CSP headers that prevent:

- Unauthorized script injection
- Cross-site scripting (XSS)
- Clickjacking attacks
- Unauthorized resource loading

### 3. Security Headers

Implemented security headers:

- `X-Frame-Options: DENY` - Prevent clickjacking
- `X-Content-Type-Options: nosniff` - Prevent MIME sniffing
- `Referrer-Policy: origin-when-cross-origin` - Protect user privacy
- `Strict-Transport-Security` - Enforce HTTPS

### 4. Dependency Security

```bash
# Run regularly (weekly)
pnpm audit
pnpm audit --fix

# Update dependencies
pnpm update --latest

# Check for known vulnerabilities
npx npm-check-updates
```

### 5. File Integrity Monitoring

**What to monitor:**

- Footer component (`apps/web/src/components/layout/footer.tsx`)
- Root layout (`apps/web/src/app/layout.tsx`)
- SEO config (`apps/web/src/lib/seo.tsx`)
- Build output (`.next/` directory size and file count)

**How to monitor:**

```bash
# Create baseline checksums
find apps/web/src/components/layout -type f -exec sha256sum {} \; > .security/checksums.txt

# Verify later
sha256sum -c .security/checksums.txt
```

### 6. Access Control

**Repository:**

- Enable branch protection for `main` and `production` branches
- Require pull request reviews before merging
- Require status checks to pass before merging
- Enable "Require signed commits" (optional but recommended)

**Deployment:**

- Rotate API keys quarterly
- Use environment-specific secrets (dev, staging, prod)
- Never commit secrets to repository
- Use secret scanning tools (GitHub Secret Scanning, GitGuardian)

**Team Access:**

- Review team member access quarterly
- Remove access for inactive members immediately
- Use principle of least privilege

### 7. Third-Party Script Safety

**Current external resources:**

```
- Stripe (payment processing)
- Supabase (image storage)
- Google Fonts
- PayPal (payment processing)
- Unsplash (images)
```

**Safety measures:**

- Use Subresource Integrity (SRI) for external scripts when possible
- Regularly audit third-party scripts
- Prefer self-hosting critical dependencies
- Monitor for supply chain attacks

### 8. Monitoring & Alerts

**Set up alerts for:**

- Failed deployments
- Unusual traffic patterns
- Error rate spikes
- New external resources being loaded
- Changes to critical files (footer, layout)

**Tools:**

- Vercel Analytics (if on Vercel)
- Sentry for error tracking
- Google Search Console for SEO monitoring
- Cloudflare Analytics (if using Cloudflare)

### 9. Regular Security Audits

**Monthly:**

- [ ] Run `pnpm audit`
- [ ] Review deployment logs
- [ ] Check Google Search Console for SEO issues
- [ ] Review team access permissions

**Quarterly:**

- [ ] Update all dependencies
- [ ] Review and rotate API keys
- [ ] Security code review
- [ ] Penetration testing (if budget allows)

**Annually:**

- [ ] Third-party security audit
- [ ] Review and update security policies
- [ ] Team security training

---

## Incident Response Plan

If you suspect a security incident:

### 1. Immediate Actions (First 15 minutes)

```bash
# 1. Take the site offline or revert to last known good deployment
git revert HEAD
git push

# 2. Preserve evidence
git log --all --oneline > incident-$(date +%Y%m%d).log
pnpm list > dependencies-$(date +%Y%m%d).log

# 3. Check for malicious code
grep -r "eval\|Function\|dangerouslySetInnerHTML" apps/web/src/
grep -r "script.*src=" apps/web/src/
```

### 2. Investigation (First hour)

- Check recent git commits: `git log --all --since="1 week ago"`
- Review deployment logs
- Check for new/modified files: `git diff HEAD~10 --name-only`
- Search for suspicious patterns: `grep -r "http\|https\|<script" apps/web/src/`
- Review recent dependency changes: `git diff HEAD~10 package.json pnpm-lock.yaml`

### 3. Remediation

- Identify attack vector
- Remove malicious code
- Rotate all secrets and API keys
- Update vulnerable dependencies
- Deploy clean build
- Verify with multiple browsers and devices

### 4. Post-Incident

- Document what happened (add to this file)
- Implement preventive measures
- Notify users if data was compromised (GDPR requirement)
- Review and update security policies

---

## Code Review Checklist

Before merging any PR, verify:

**Security:**

- [ ] No hardcoded secrets or API keys
- [ ] No `dangerouslySetInnerHTML` without sanitization
- [ ] No `eval()` or `Function()` constructors
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] User input is validated and sanitized
- [ ] Authentication/authorization checks are in place

**Dependencies:**

- [ ] No new dependencies without review
- [ ] Dependencies are from trusted sources
- [ ] No known vulnerabilities (`pnpm audit`)

**Build:**

- [ ] Build passes locally
- [ ] TypeScript checks pass (`pnpm type-check`)
- [ ] Tests pass (when implemented)

---

## Quick Security Scan

Run this before each deployment:

```bash
#!/bin/bash
# security-check.sh

echo "🔍 Running security checks..."

# 1. TypeScript check
echo "1/5 TypeScript check..."
pnpm type-check || exit 1

# 2. Dependency audit
echo "2/5 Dependency audit..."
pnpm audit --audit-level=high || echo "⚠️ High severity vulnerabilities found"

# 3. Check for secrets
echo "3/5 Checking for exposed secrets..."
git diff --cached | grep -E "API_KEY|SECRET|PASSWORD|TOKEN" && echo "⚠️ Possible secret found" || echo "✅ No secrets found"

# 4. Check for dangerous patterns
echo "4/5 Checking for dangerous code patterns..."
grep -r "dangerouslySetInnerHTML\|eval(" apps/web/src/ && echo "⚠️ Dangerous patterns found" || echo "✅ No dangerous patterns"

# 5. Build test
echo "5/5 Build test..."
pnpm build || exit 1

echo "✅ All security checks passed!"
```

Make it executable:

```bash
chmod +x security-check.sh
```

---

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/deploying/production-checklist)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning/about-secret-scanning)

---

**Last Updated:** February 23, 2026
**Version:** 1.0.0
