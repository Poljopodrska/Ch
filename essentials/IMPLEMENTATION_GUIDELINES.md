# Ch Project Implementation Guidelines for Claude Code

## Core Principles

### 1. TS (Task Specification) Recognition
- TS = Task Specification (NOT TypeScript in this context)
- Every development task starts with a TS
- TS drives implementation, not the other way around

### 2. Zero Tolerance for Regression
- If something worked before, it MUST continue working
- Breaking existing functionality = EMERGENCY
- Test before changing, test after changing

### 3. Version & Deployment Rules
- ALWAYS show version numbers in responses
- NEVER deploy without protection gates
- ALWAYS have rollback capability
- ECS-only deployment (prepare infrastructure from start)

#### ❌ NO HARDCODING OF VERSIONS - CRITICAL RULE!
**Problem**: Hardcoded versions cause deployments to always show the same version, breaking version tracking and making it impossible to verify successful deployments.

**Examples of what NOT to do:**
```javascript
// ❌ NEVER DO THIS
const VERSION = "1.0.0";  // Hardcoded - will never update!

// ❌ NEVER DO THIS  
function getVersion() {
    return "1.0.0";  // Hardcoded!
}

// ❌ NEVER DO THIS
app.get('/version', (req, res) => {
    res.json({ version: "1.0.0" });  // Hardcoded!
});
```

**✅ CORRECT Approach:**
```javascript
// ✅ Always use dynamic version from package.json
const packageJson = require('./package.json');
const VERSION = packageJson.version;

// ✅ Or from environment variable
const VERSION = process.env.APP_VERSION || 'development';

// ✅ Or from a version file that gets updated
const fs = require('fs');
const VERSION = fs.readFileSync('version.txt', 'utf8').trim();

// ✅ Or from git tags
const { execSync } = require('child_process');
const VERSION = execSync('git describe --tags').toString().trim();
```

**Version Update Process:**
1. Update version in ONE central location (package.json, version.txt, or environment)
2. All modules import/read from that single source
3. Deploy scripts update the central version
4. Verification confirms the new version is live

### 4. Task Completion Verification
Before marking any task complete:
1. Run all tests
2. Verify no regressions
3. Update SYSTEM_CHANGELOG.md
4. Confirm success metrics met

### 5. Report Creation Rules
- Investigation reports go in: essentials/reports/YYYY-MM-DD/
- Format: report_XXX_description.md
- Include: Problem, Investigation, Solution, Verification

## Development Workflow

### Starting a New Task
1. Read the TS completely
2. Check SYSTEM_CHANGELOG.md for context
3. Verify no conflicts with existing features
4. Plan implementation approach
5. Create test cases first (TDD approach)

### During Development
- Commit frequently with clear messages
- Test continuously
- Document decisions
- Update changelog for significant changes

### Completing a Task
1. Run all tests
2. Verify success criteria
3. Update SYSTEM_CHANGELOG.md
4. Create report if investigation was needed
5. Confirm no regressions

## Emergency Procedures

### If Regression Detected
1. STOP all current work
2. Run emergency_rollback.sh
3. Create incident report
4. Fix regression
5. Add regression test
6. Update protection systems

### If Deployment Fails
1. DO NOT retry immediately
2. Check pre_deployment_gate.sh output
3. Fix identified issues
4. Re-run protection tests
5. Attempt deployment again

## Change Types for SYSTEM_CHANGELOG.md

- 🐛 BUG - Bug fixes
- ✨ FEATURE - New features
- 🔧 CONFIG - Configuration changes
- 📝 DOCS - Documentation updates
- 🏗️ INFRASTRUCTURE - System architecture changes
- 🚨 EMERGENCY - Critical fixes
- ♻️ REFACTOR - Code improvements
- 🧪 TEST - Test additions/modifications

## Communication Standards

### With Users
- Be concise and precise
- Show version numbers
- Confirm understanding of requirements
- Report completion with metrics

### In Documentation
- Clear, simple language
- Examples for complex concepts
- Version all documents
- Date all entries

### In Code
- Self-documenting code
- Clear variable names
- Comprehensive comments for complex logic
- Type hints where applicable

## Module Development Rules

1. **Independence**: No cross-module dependencies
2. **Isolation**: Errors contained within module
3. **Interface**: Clear, versioned APIs
4. **Testing**: 100% coverage for public interfaces
5. **Documentation**: README.md in each module

## Protection System Usage

### Pre-Deployment
```bash
./protection_system/pre_deployment_gate.sh
```

### Emergency Rollback
```bash
./protection_system/emergency_rollback.sh <version>
```

### Capture Baseline
```bash
./protection_system/capture_working_state.sh
```

## Remember

- **MANGO RULE**: Any feature works for any use case in any country
- **ECS Mandate**: All infrastructure designed for ECS deployment
- **Change Tracking**: Every change in SYSTEM_CHANGELOG.md
- **User First**: Every decision benefits the end user
- **Quality Over Speed**: Better to be right than fast