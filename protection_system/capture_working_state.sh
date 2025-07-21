#!/bin/bash

# Ch Project Working State Capture
# Captures current working state as a baseline for recovery

set -e  # Exit on error

echo "========================================="
echo "CH PROJECT WORKING STATE CAPTURE"
echo "========================================="
echo "Time: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Generate snapshot name
SNAPSHOT_NAME="snapshot_$(date +%Y%m%d_%H%M%S)"
SNAPSHOT_DIR="backups/$SNAPSHOT_NAME"

echo "Creating snapshot: $SNAPSHOT_NAME"
echo ""

# Create snapshot directory
mkdir -p "$SNAPSHOT_DIR"

# Function to capture directory
capture_directory() {
    local dir=$1
    local desc=$2
    
    if [ -d "$dir" ]; then
        echo -n "Capturing $desc... "
        cp -r "$dir" "$SNAPSHOT_DIR/"
        echo -e "${GREEN}✓${NC}"
        return 0
    else
        echo -e "${YELLOW}Skipping $desc (not found)${NC}"
        return 1
    fi
}

# Function to capture file
capture_file() {
    local file=$1
    local desc=$2
    
    if [ -f "$file" ]; then
        echo -n "Capturing $desc... "
        cp "$file" "$SNAPSHOT_DIR/"
        echo -e "${GREEN}✓${NC}"
        return 0
    else
        echo -e "${YELLOW}Skipping $desc (not found)${NC}"
        return 1
    fi
}

# Capture essential directories
echo "1. Capturing Directories:"
capture_directory "essentials" "documentation"
capture_directory "modules" "modules"
capture_directory "tests" "tests"
capture_directory "scripts" "scripts"
capture_directory "protection_system" "protection system"

# Capture configuration files
echo ""
echo "2. Capturing Configuration:"
capture_file "package.json" "package.json"
capture_file "package-lock.json" "package-lock.json"
capture_file ".env" "environment variables"
capture_file "tsconfig.json" "TypeScript config"

# Run tests and capture results
echo ""
echo "3. Running System Checks:"
TEST_RESULTS="$SNAPSHOT_DIR/test_results.txt"

echo -n "Running tests... "
if [ -f "package.json" ] && grep -q '"test"' package.json; then
    if npm test > "$TEST_RESULTS" 2>&1; then
        echo -e "${GREEN}✓ (passed)${NC}"
        echo "TESTS: PASSED" >> "$SNAPSHOT_DIR/snapshot_status.txt"
    else
        echo -e "${YELLOW}⚠ (failed - see test_results.txt)${NC}"
        echo "TESTS: FAILED" >> "$SNAPSHOT_DIR/snapshot_status.txt"
    fi
else
    echo -e "${YELLOW}skipped (no test script)${NC}"
    echo "TESTS: NOT CONFIGURED" >> "$SNAPSHOT_DIR/snapshot_status.txt"
fi

# Capture git information if available
echo ""
echo "4. Capturing Version Information:"
if command -v git &> /dev/null && [ -d .git ]; then
    echo -n "Git status... "
    git status > "$SNAPSHOT_DIR/git_status.txt" 2>&1
    echo -e "${GREEN}✓${NC}"
    
    echo -n "Git log... "
    git log --oneline -20 > "$SNAPSHOT_DIR/git_log.txt" 2>&1
    echo -e "${GREEN}✓${NC}"
    
    echo -n "Current commit... "
    git rev-parse HEAD > "$SNAPSHOT_DIR/git_commit.txt" 2>&1
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}Git not available${NC}"
fi

# Create snapshot metadata
echo ""
echo "5. Creating Snapshot Metadata:"
cat > "$SNAPSHOT_DIR/snapshot_info.md" << EOF
# Ch Project Snapshot

**Created**: $(date -u '+%Y-%m-%d %H:%M:%S UTC')
**Snapshot ID**: $SNAPSHOT_NAME
**Created By**: $(whoami)
**Host**: $(hostname)

## Snapshot Contents

### Directories Captured
$(find "$SNAPSHOT_DIR" -type d -name "*" | grep -v "^$SNAPSHOT_DIR$" | sed "s|$SNAPSHOT_DIR/|- |")

### System State
$(cat "$SNAPSHOT_DIR/snapshot_status.txt" 2>/dev/null || echo "No status captured")

## Purpose
This snapshot captures a known working state of the Ch project.
It can be used for:
- Emergency recovery
- Deployment verification
- State comparison
- Debugging

## Usage

### To restore this snapshot:
\`\`\`bash
./protection_system/restore_snapshot.sh $SNAPSHOT_NAME
\`\`\`

### To compare with current state:
\`\`\`bash
diff -r backups/$SNAPSHOT_NAME/essentials essentials
\`\`\`

## Notes
[Add any relevant notes about the system state at capture time]
EOF

echo -e "${GREEN}✅ Metadata created${NC}"

# Create restore script
echo ""
echo "6. Creating Restore Script:"
cat > "$SNAPSHOT_DIR/restore.sh" << 'EOF'
#!/bin/bash
# Auto-generated restore script for this snapshot

SNAPSHOT_DIR="$(dirname "$0")"
TARGET_DIR="../.."

echo "Restoring snapshot from $SNAPSHOT_DIR"
echo "Target directory: $TARGET_DIR"
echo ""
echo "WARNING: This will overwrite current files!"
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Restore cancelled"
    exit 1
fi

# Restore directories
for dir in essentials modules tests scripts protection_system; do
    if [ -d "$SNAPSHOT_DIR/$dir" ]; then
        echo "Restoring $dir..."
        rm -rf "$TARGET_DIR/$dir"
        cp -r "$SNAPSHOT_DIR/$dir" "$TARGET_DIR/"
    fi
done

# Restore files
for file in package.json package-lock.json .env tsconfig.json; do
    if [ -f "$SNAPSHOT_DIR/$file" ]; then
        echo "Restoring $file..."
        cp "$SNAPSHOT_DIR/$file" "$TARGET_DIR/"
    fi
done

echo ""
echo "Restore complete!"
echo "Remember to:"
echo "1. Run npm install if package.json was restored"
echo "2. Check git status for changes"
echo "3. Update SYSTEM_CHANGELOG.md"
EOF

chmod +x "$SNAPSHOT_DIR/restore.sh"
echo -e "${GREEN}✅ Restore script created${NC}"

# Summary
echo ""
echo "========================================="
echo "SNAPSHOT COMPLETE"
echo "========================================="
echo -e "${GREEN}✅ Working state captured successfully${NC}"
echo ""
echo "Snapshot location: $SNAPSHOT_DIR"
echo "Snapshot size: $(du -sh "$SNAPSHOT_DIR" | cut -f1)"
echo ""
echo "This snapshot includes:"
ls -la "$SNAPSHOT_DIR" | grep -E "(essentials|modules|tests|scripts|protection_system)" | awk '{print "  - " $9}'
echo ""
echo "To restore this snapshot later:"
echo "  $SNAPSHOT_DIR/restore.sh"
echo ""
echo -e "${YELLOW}Remember to update SYSTEM_CHANGELOG.md with this snapshot event${NC}"