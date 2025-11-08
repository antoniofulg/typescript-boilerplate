#!/bin/bash

# Script to create a new release
# Usage: ./scripts/create-release.sh <version>
# Example: ./scripts/create-release.sh 1.0.0

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

VERSION=$1

if [ -z "$VERSION" ]; then
  echo -e "${RED}❌ Error: Version is required${NC}"
  echo "Usage: ./scripts/create-release.sh <version>"
  echo "Example: ./scripts/create-release.sh 1.0.0"
  exit 1
fi

# Validate version format (semver)
if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo -e "${RED}❌ Error: Invalid version format${NC}"
  echo "Version must follow semantic versioning (e.g., 1.0.0)"
  exit 1
fi

TAG="v${VERSION}"

echo -e "${GREEN}🚀 Creating release ${TAG}${NC}"
echo ""

# Check if working directory is clean
if ! git diff-index --quiet HEAD --; then
  echo -e "${YELLOW}⚠️  Warning: You have uncommitted changes${NC}"
  echo "Please commit or stash your changes before creating a release"
  read -p "Continue anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Check if tag already exists
if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo -e "${RED}❌ Error: Tag ${TAG} already exists${NC}"
  exit 1
fi

# Check if CHANGELOG.md has the version
if ! grep -q "## \[${VERSION}\]" CHANGELOG.md; then
  echo -e "${YELLOW}⚠️  Warning: CHANGELOG.md doesn't have entry for version ${VERSION}${NC}"
  read -p "Continue anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Create annotated tag
echo -e "${GREEN}📝 Creating tag ${TAG}...${NC}"
git tag -a "$TAG" -m "Release version ${VERSION}"

echo -e "${GREEN}✅ Tag ${TAG} created locally${NC}"
echo ""
echo -e "${YELLOW}📤 To publish the release, run:${NC}"
echo "  git push origin ${TAG}"
echo ""
echo -e "${YELLOW}💡 Or push all tags:${NC}"
echo "  git push origin --tags"
echo ""
echo -e "${GREEN}🎉 Release ${TAG} is ready!${NC}"
echo "After pushing the tag, GitHub Actions will automatically create the release."

