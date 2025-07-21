# Ch Project Quick Start Guide

## Overview

Ch Project is built on proven collaboration frameworks and best practices, adapted from the AVA OLO system. This project follows constitutional principles with LLM-first development, comprehensive protection systems, and rigorous change tracking.

## Project Structure

```
Ch/
├── essentials/              # Core documentation and guidelines
│   ├── CH_CONSTITUTION.md   # 15 core principles
│   ├── IMPLEMENTATION_GUIDELINES.md
│   ├── SPECIFICATION_GUIDELINES.md
│   ├── QUICK_START.md       # You are here
│   ├── SYSTEM_CHANGELOG.md  # All changes tracked
│   └── reports/             # Investigation reports
├── protection_system/       # Deployment safety
├── modules/                 # Feature modules
├── tests/                   # Test suites
└── scripts/                 # Utilities
```

## Key Concepts

### 1. TS = Task Specification
- NOT TypeScript in this context
- Every feature starts with a TS
- Located in task specifications folder

### 2. MANGO TEST
"Any feature in Ch project works for any use case in any country"
- Universal compatibility
- No geographic limitations
- Cultural awareness

### 3. Protection Gates
- No deployment without verification
- Automated rollback capabilities
- State capture for recovery

## Getting Started

### For New Features
1. Write a Task Specification (TS)
2. Get TS approved
3. Implement following guidelines
4. Test thoroughly
5. Update SYSTEM_CHANGELOG.md
6. Deploy with protection gates

### For Bug Fixes
1. Document the issue
2. Create minimal TS
3. Fix with tests
4. Verify no regressions
5. Update changelog
6. Deploy safely

### For Investigations
1. Document in reports/YYYY-MM-DD/
2. Format: report_XXX_description.md
3. Include problem, process, solution
4. Update relevant documentation

## Development Workflow

### Daily Development
```bash
# 1. Check current state
cat essentials/SYSTEM_CHANGELOG.md

# 2. Work on feature
# ... implement ...

# 3. Test thoroughly
npm test  # or appropriate test command

# 4. Update changelog
# Add entry to SYSTEM_CHANGELOG.md

# 5. Prepare for deployment
./protection_system/pre_deployment_gate.sh
```

### Emergency Procedures
```bash
# If something breaks
./protection_system/emergency_rollback.sh <version>

# Capture current working state
./protection_system/capture_working_state.sh
```

## Core Principles Summary

1. **LLM-First**: Design for AI interaction
2. **Privacy-First**: Protect user data
3. **Module Independence**: No cross-dependencies
4. **Error Isolation**: Contain failures
5. **Version Visibility**: Always show versions
6. **Change Tracking**: Document everything
7. **Zero Regression**: Never break working features

## Important Commands

### Check System State
```bash
# View recent changes
head -50 essentials/SYSTEM_CHANGELOG.md

# Check protection system
./protection_system/test_protection_system.sh
```

### Development Tools
```bash
# Run tests
npm test

# Check code quality
npm run lint

# Build project
npm run build
```

## Communication Standards

### With Claude Code
- Provide clear TS documents
- Reference specific files with path:line
- Use precise language
- Verify understanding

### In Pull Requests
- Reference TS number
- List changes clearly
- Include test results
- Update changelog

## Next Steps

1. Read CH_CONSTITUTION.md
2. Study IMPLEMENTATION_GUIDELINES.md
3. Review recent SYSTEM_CHANGELOG.md entries
4. Explore existing modules
5. Start with a small feature

## Getting Help

- Check documentation in essentials/
- Review similar implementations
- Create investigation reports
- Follow emergency procedures if needed

## Remember

- **Quality over speed**
- **Test everything**
- **Document changes**
- **Protect deployments**
- **Help users succeed**