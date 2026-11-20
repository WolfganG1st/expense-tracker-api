#!/bin/bash
# Security testing script for Credit Expenses
# This script runs all security tests and generates a report

# Display start message
echo "🔒 Starting Credit Expenses Security Testing Suite"
echo "=================================================="
echo

# Set report date
REPORT_DATE=$(date "+%Y-%m-%d %H:%M:%S")

# Define colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create reports directory if it doesn't exist
mkdir -p ./reports/security

# Run security tests
echo -e "${BLUE}Running security tests...${NC}"

# Use a separate node process to avoid module resolution issues
NODE_OPTIONS="--no-warnings" pnpm test --config=jest.security.config.js --silent || {
    echo -e "${RED}Security tests failed. See output above for details.${NC}"
    exit 1
}

echo -e "${GREEN}✓ Security tests completed successfully${NC}"

# Generate a timestamped report file
REPORT_FILE="./reports/security/security-report-$(date +%Y%m%d%H%M%S).md"
cp ./src/__tests__/security/security-summary.md $REPORT_FILE

# Update the date in the report
sed -i "s/\[DATE\]/$REPORT_DATE/g" $REPORT_FILE

echo
echo -e "${GREEN}Security testing completed!${NC}"
echo -e "Report generated: ${BLUE}$REPORT_FILE${NC}"
echo
echo "=================================================="
echo "🛡️  Security testing summary:"
echo "- JWT Authentication tested"
echo "- Password hashing security verified"
echo "- Data encryption validated"
echo "- Input validation checked"
echo "=================================================="
