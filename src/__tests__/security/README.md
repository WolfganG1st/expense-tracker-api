# Security Testing Framework

This directory contains security tests that verify the robustness of the credit transactions application's security measures.

## Available Tests

- **JWT Authentication**: Tests authentication and authorization mechanisms
- **Data Encryption**: Verifies proper encryption of sensitive data at rest
- **Input Validation**: Tests API input validation to prevent injection attacks
- **Password Security**: Confirms password hashing practices

## Running Tests

You can run security tests using either of these methods:

### Run security tests only

```bash
pnpm security:test
```

### Generate a comprehensive security report

```bash
pnpm security:report
```

This will execute all security tests and generate a report in the `reports/security` directory.

## Adding New Security Tests

To add new security tests:

1. Create a new test file in this directory following the naming convention `*-security.test.ts`
2. Implement tests based on the existing patterns
3. Run the tests to verify they work correctly

## Best Practices

- Keep security tests isolated from functional tests
- Focus on actual security vulnerabilities rather than implementation details
- Test both positive cases (security features working) and negative cases (attacks being prevented)
- Keep credentials used in tests separate from production credentials

## Security Testing Schedule

It's recommended to run the security tests:

- After any changes to authentication, data storage, or API endpoints
- As part of your CI/CD pipeline
- On a regular schedule (monthly) to confirm ongoing security
