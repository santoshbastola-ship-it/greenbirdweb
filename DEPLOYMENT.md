# Deployment Guide

## Overview
This project has two deployment workflows to accommodate different deployment scenarios.

---

## 🚀 Deployment Commands

### Full Deploy to Production
**Command**: `npm run deploy:full "Release summary"`

**Use this when**: You want to do a complete, production-ready deployment with all safety checks.

**What it does**:
1. ✅ Cleans up test data from database
2. ✅ Bumps version number (patch version)
3. ✅ Updates release notes
4. ✅ Commits and pushes to git
5. ✅ Runs all automated tests
6. ✅ Builds the project
7. ✅ Verifies PWA assets (service worker & manifest)
8. ✅ Builds Firebase functions
9. ✅ Deploys to production

**Example**:
```bash
npm run deploy:full "Fixed cart calculation bug and improved UI"
```

---

### Quick Deploy to Production
**Command**: `npm run deploy:quick`

**Use this when**: You need to deploy a hotfix or minor change quickly without running tests.

**What it does**:
1. ✅ Builds the project
2. ✅ Verifies PWA assets (service worker & manifest)
3. ✅ Builds Firebase functions
4. ✅ Deploys to production

**⚠️ Warning**: This skips:
- Test data cleanup
- Version bumping
- Release notes
- Git push
- Automated tests

**Example**:
```bash
npm run deploy:quick
```

---

## 🧹 Test Data Cleanup

### Manual Cleanup
**Command**: `npm run cleanup:test-data`

**Use this when**: You want to manually remove test data from the database.

**What it removes**:
- Transactions with partyName containing "Test"
- Products named "Test Product"
- Categories named "Test Category"
- Notifications sent to test users
- All data associated with test user accounts

**Example**:
```bash
npm run cleanup:test-data
```

---

## 📋 Deployment Workflow Comparison

| Feature | Full Deploy | Quick Deploy | Manual Cleanup |
|---------|-------------|--------------|----------------|
| Test Data Cleanup | ✅ | ❌ | ✅ |
| Version Bump | ✅ | ❌ | ❌ |
| Release Notes | ✅ | ❌ | ❌ |
| Git Push | ✅ | ❌ | ❌ |
| Run Tests | ✅ | ❌ | ❌ |
| Build Project | ✅ | ✅ | ❌ |
| PWA Verification | ✅ | ✅ | ❌ |
| Deploy to Prod | ✅ | ✅ | ❌ |

---

## 📝 Best Practices

### When to use Full Deploy
- ✅ Regular feature releases
- ✅ Bug fixes that need testing
- ✅ Any changes that affect core functionality
- ✅ When you want a complete audit trail

### When to use Quick Deploy
- ⚡ Emergency hotfixes
- ⚡ Content updates (text, images)
- ⚡ Minor UI tweaks
- ⚡ Configuration changes

### When to use Manual Cleanup
- 🧹 After running manual tests
- 🧹 Before full deployment
- 🧹 When you notice test data in production

---

## 🔧 Legacy Commands

The old deployment command is still available for backward compatibility:

```bash
npm run deploy
```

This runs tests, builds, and deploys but does NOT:
- Clean up test data
- Bump version
- Update release notes
- Push to git

**Recommendation**: Use `npm run deploy:full` instead for complete deployments.

---

## 📦 Version Management

Versions follow semantic versioning: `MAJOR.MINOR.PATCH`

- **Full Deploy** automatically increments the PATCH version
- **Quick Deploy** does NOT change the version
- Manual version changes can be made in `package.json`

---

## 📄 Release Notes

Release notes are automatically generated during **Full Deploy** and stored in:
```
RELEASE_NOTES.md
```

Format:
```markdown
## [0.2.12] - 2026-02-11
- Fixed cart calculation bug and improved UI
```

---

## 🚨 Troubleshooting

### Test Data Cleanup Fails
- Ensure test users exist in Firebase Authentication
- Check Firebase credentials in `.env.local`
- Verify network connection to Firebase

### Deployment Fails
- Check Firebase CLI is installed: `npm install -g firebase-tools`
- Verify you're logged in: `firebase login`
- Check project configuration: `firebase use --add`

### Tests Fail During Full Deploy
- Review test output for specific failures
- Fix issues before deploying
- Use Quick Deploy for emergency fixes (not recommended)

### PWA Assets Not Generated
- Ensure `next-pwa` is installed: `npm install next-pwa`
- Check `next.config.ts` has `withPWA` wrapper
- Verify `NODE_ENV=production` during build
- Check `public/manifest.json` exists
- Ensure PWA icons are in `public/icons/` directory

---

## 📞 Support

For deployment issues, check:
1. Firebase Console for deployment logs
2. GitHub Actions (if configured)
3. Local build logs in terminal
