# Security Policy

## Supported Versions

Currently, we support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0.0 | :x:                |

## Reporting a Vulnerability

We take the security of Metal seriously. If you believe you have found a security vulnerability, please report it to us as described below.

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to security@metal.dev.

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

Please include the following information in your report:

- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

## Security Updates

Security updates will be released as patch versions (e.g., 1.0.1, 1.0.2) and will be clearly marked in the changelog.

## Best Practices

To help ensure the security of your Metal installation:

1. Always use the latest version
2. Keep your dependencies up to date
3. Use secure configuration settings
4. Follow the principle of least privilege
5. Regularly audit your usage

## Security Features

Metal includes several security features:

- Secure configuration management
- Environment variable handling
- API key management
- Rate limiting
- Input validation
- Error handling

For more information about security features, please refer to the documentation.
