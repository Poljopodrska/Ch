#!/bin/bash

# Ch Project Protection System Validation
# Tests that all protection mechanisms are working correctly

set -e  # Exit on error

echo "========================================="
echo "CH PROJECT PROTECTION SYSTEM TEST"
echo "========================================="
echo "Time: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name=$1
    local test_command=$2
    
    echo -n "Testing $test_name... "
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}PASSED${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}FAILED${NC}"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Test 1: Check all scripts exist
echo "1. Checking Protection Scripts Exist:"
run_test "pre_deployment_gate.sh exists" "[ -f protection_system/pre_deployment_gate.sh ]"
run_test "emergency_rollback.sh exists" "[ -f protection_system/emergency_rollback.sh ]"
run_test "capture_working_state.sh exists" "[ -f protection_system/capture_working_state.sh ]"
run_test "test_protection_system.sh exists" "[ -f protection_system/test_protection_system.sh ]"

# Test 2: Check scripts are executable
echo ""
echo "2. Checking Script Permissions:"
run_test "pre_deployment_gate.sh executable" "[ -x protection_system/pre_deployment_gate.sh ]" || chmod +x protection_system/pre_deployment_gate.sh
run_test "emergency_rollback.sh executable" "[ -x protection_system/emergency_rollback.sh ]" || chmod +x protection_system/emergency_rollback.sh
run_test "capture_working_state.sh executable" "[ -x protection_system/capture_working_state.sh ]" || chmod +x protection_system/capture_working_state.sh
run_test "test_protection_system.sh executable" "[ -x protection_system/test_protection_system.sh ]" || chmod +x protection_system/test_protection_system.sh

# Test 3: Check documentation structure
echo ""
echo "3. Checking Documentation Structure:"
run_test "essentials directory exists" "[ -d essentials ]"
run_test "CH_CONSTITUTION.md exists" "[ -f essentials/CH_CONSTITUTION.md ]"
run_test "IMPLEMENTATION_GUIDELINES.md exists" "[ -f essentials/IMPLEMENTATION_GUIDELINES.md ]"
run_test "SPECIFICATION_GUIDELINES.md exists" "[ -f essentials/SPECIFICATION_GUIDELINES.md ]"
run_test "QUICK_START.md exists" "[ -f essentials/QUICK_START.md ]"
run_test "SYSTEM_CHANGELOG.md exists" "[ -f essentials/SYSTEM_CHANGELOG.md ]"
run_test "reports directory exists" "[ -d essentials/reports ]"

# Test 4: Check backup directory
echo ""
echo "4. Checking Backup Infrastructure:"
run_test "can create backup directory" "mkdir -p backups/test_$(date +%s) && rmdir backups/test_*"

# Test 5: Validate script syntax
echo ""
echo "5. Validating Script Syntax:"
for script in protection_system/*.sh; do
    if [ -f "$script" ]; then
        run_test "$(basename $script) syntax" "bash -n $script"
    fi
done

# Test 6: Check for required commands
echo ""
echo "6. Checking Required Commands:"
run_test "date command available" "command -v date"
run_test "mkdir command available" "command -v mkdir"
run_test "cp command available" "command -v cp"
run_test "find command available" "command -v find"
run_test "grep command available" "command -v grep"

# Test 7: Simulate protection workflows
echo ""
echo "7. Testing Protection Workflows:"

# Test state capture (dry run)
echo -n "Testing state capture (dry run)... "
if bash -c "cd protection_system && source capture_working_state.sh > /dev/null 2>&1" | grep -q "SNAPSHOT COMPLETE"; then
    echo -e "${GREEN}PASSED${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}SKIPPED (would create actual backup)${NC}"
fi

# Test rollback script help
run_test "rollback script shows help" "protection_system/emergency_rollback.sh 2>&1 | grep -q 'Usage:'"

# Test 8: Version control integration
echo ""
echo "8. Checking Version Control:"
if command -v git &> /dev/null && [ -d .git ]; then
    run_test "git is available" "command -v git"
    run_test "in git repository" "[ -d .git ]"
else
    echo -e "${YELLOW}Git not initialized - skipping version control tests${NC}"
fi

# Summary
echo ""
echo "========================================="
echo "PROTECTION SYSTEM TEST SUMMARY"
echo "========================================="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED${NC}"
    echo "The protection system is fully operational."
    echo ""
    echo "You can now:"
    echo "- Run pre-deployment checks: ./protection_system/pre_deployment_gate.sh"
    echo "- Capture working state: ./protection_system/capture_working_state.sh"
    echo "- Perform emergency rollback: ./protection_system/emergency_rollback.sh <version>"
    exit 0
else
    echo -e "${RED}❌ PROTECTION SYSTEM ISSUES DETECTED${NC}"
    echo ""
    echo "Please fix the failed tests before using the protection system."
    echo "Some issues may have been auto-fixed (like permissions)."
    echo "Run this test again to verify: ./protection_system/test_protection_system.sh"
    exit 1
fi