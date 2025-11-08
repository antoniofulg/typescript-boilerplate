# 🚀 Creating a Release

This guide explains how to create a new release for this boilerplate.

## Prerequisites

- All changes committed and pushed
- All CI checks passing
- CHANGELOG.md updated with new version

## Steps

### 1. Update Version Numbers (if needed)

Update version in:

- `package.json` (root)
- `backend/package.json`
- `frontend/package.json`

### 2. Update CHANGELOG.md

Add a new section for the release version with all changes.

### 3. Commit and Push Changes

```bash
git add .
git commit -m "chore: prepare release 1.0.0"
git push origin main
```

### 4. Create and Push Tag

```bash
# Create annotated tag
git tag -a v1.0.0 -m "Release version 1.0.0"

# Push tag to remote
git push origin v1.0.0
```

### 5. GitHub Actions Will Create Release

The `.github/workflows/release.yml` workflow will automatically:

- Detect the new tag
- Create a GitHub Release
- Use CHANGELOG.md as release notes

### Alternative: Manual Release

If you prefer to create the release manually:

1. Go to **Releases** → **Draft a new release**
2. Choose tag: `v1.0.0`
3. Release title: `Release v1.0.0`
4. Copy content from CHANGELOG.md
5. Publish release

## Version Format

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (0.1.0): New features, backward compatible
- **PATCH** (0.0.1): Bug fixes, backward compatible

## Tag Format

Tags must follow the format: `v1.0.0` (with 'v' prefix)
