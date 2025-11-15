# Security Policy

## Supported Versions

Currently supported versions of ANTARES with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Security Status

ANTARES is currently in active development. A comprehensive security assessment conducted in November 2025 identified several areas requiring attention before production deployment. See [ASSESSMENT_REPORT.md](ASSESSMENT_REPORT.md) for details.

### Known Security Considerations

**Current Status (v1.0.0):**
- ⚠️ No authentication on API endpoints
- ⚠️ Unrestricted CORS policy
- ⚠️ No TLS/SSL encryption (HTTP/WS only)
- ⚠️ Services bind to 0.0.0.0 by default
- ✅ No hardcoded credentials in code
- ✅ GitHub secrets properly configured
- ✅ Dependabot configured for dependency monitoring

**Recommendation:** Do not deploy to production or expose to untrusted networks until security hardening is complete.

## Reporting a Vulnerability

We take security seriously and appreciate responsible disclosure of security vulnerabilities.

### How to Report

**For security vulnerabilities, please DO NOT open a public issue.**

Instead, please report security issues via one of these channels:

1. **Email**: Send details to [SECURITY_EMAIL - TBD]
2. **GitHub Security Advisory**: Use the "Security" tab in the repository
3. **Private Disclosure**: Contact repository maintainers directly

### What to Include

Please include the following information in your report:

1. **Description** - Clear description of the vulnerability
2. **Impact** - Potential impact and severity assessment
3. **Steps to Reproduce** - Detailed reproduction steps
4. **Proof of Concept** - Code or commands demonstrating the issue (if safe to share)
5. **Suggested Fix** - Your thoughts on remediation (optional)
6. **Affected Versions** - Which versions are affected
7. **Your Contact Info** - How we can reach you for follow-up

### Example Report

```
Subject: [SECURITY] Authentication Bypass in API Endpoint

Description:
The /simulation/reset endpoint can be accessed without authentication,
allowing any user to reset the simulation.

Impact:
HIGH - Unauthorized users can disrupt simulations, causing denial of service.

Steps to Reproduce:
1. Start the ANTARES simulator
2. Send POST request to http://localhost:17394/simulation/reset
3. Simulation resets without authentication

Affected Versions:
All versions including 1.0.0

Suggested Fix:
Implement Bearer token authentication on all API endpoints.

Contact: researcher@example.com
```

## Response Process

### What to Expect

1. **Acknowledgment** - We will acknowledge receipt within 48 hours
2. **Initial Assessment** - We will assess severity within 5 business days
3. **Investigation** - We will investigate and develop a fix
4. **Communication** - We will keep you updated on progress
5. **Fix & Disclosure** - We will coordinate disclosure timing with you
6. **Credit** - We will credit you (if desired) in release notes

### Timeline

- **Critical vulnerabilities**: Patch within 7 days
- **High severity**: Patch within 30 days
- **Medium severity**: Patch within 90 days
- **Low severity**: Include in next scheduled release

### Coordinated Disclosure

We follow coordinated disclosure principles:

- We will work with you to understand and fix the issue
- We request 90 days before public disclosure to develop and deploy a fix
- We will credit researchers who report issues responsibly
- We will publish security advisories for confirmed vulnerabilities

## Security Best Practices for Users

If you're deploying ANTARES, please follow these security best practices:

### Network Security

1. **Use TLS/SSL** - Configure HTTPS for REST API and WSS for WebSocket
2. **Firewall** - Restrict access to only necessary ports
3. **Bind Address** - Use `127.0.0.1` for localhost-only access
4. **Network Segmentation** - Deploy on isolated network segments

### Configuration Security

1. **Authentication** - Implement authentication before production use
2. **Secrets Management** - Never commit secrets to version control
3. **Environment Variables** - Use `.env` files (gitignored) for sensitive config
4. **Minimal Permissions** - Run with least privilege necessary

### Deployment Security

1. **Updates** - Keep dependencies updated (use Dependabot)
2. **Monitoring** - Monitor for suspicious activity
3. **Rate Limiting** - Implement rate limiting to prevent abuse
4. **Input Validation** - Validate all input parameters
5. **Error Handling** - Don't expose internal details in error messages

### Example Secure Configuration

```toml
# config.toml - Production security hardening

[antares.simulation]
emission_interval = 20
# Bind to specific internal IP, not 0.0.0.0
controller_bind_addr = "10.0.1.5:17394"

[antares.radar.detector]
range = 1000.0
speed = 0.0
angle = 0.0
start_coordinates = [4.0, -72.0]
# Bind to specific internal IP, not 0.0.0.0
bind_addr = "10.0.1.5:17396"
```

### Security Checklist for Production

Before deploying to production:

- [ ] TLS/SSL certificates configured
- [ ] Authentication implemented on all endpoints
- [ ] CORS restricted to specific origins
- [ ] Rate limiting configured
- [ ] Security headers added
- [ ] Services bound to specific interfaces (not 0.0.0.0)
- [ ] Input validation implemented
- [ ] Error messages sanitized
- [ ] Logging and monitoring configured
- [ ] Secrets properly managed
- [ ] Dependencies updated
- [ ] Security audit completed

## Vulnerability Disclosure Policy

### Scope

Security issues in the following components are in scope:

**In Scope:**
- Authentication and authorization bypasses
- Remote code execution vulnerabilities
- SQL injection or other injection attacks
- Cross-site scripting (XSS)
- Cross-site request forgery (CSRF)
- Server-side request forgery (SSRF)
- Sensitive data exposure
- Denial of service vulnerabilities
- Cryptographic weaknesses

**Out of Scope:**
- Social engineering attacks
- Physical attacks
- Denial of service via resource exhaustion (unless severe)
- Issues requiring physical access to systems
- Issues in third-party dependencies (report to the respective projects)
- Theoretical issues without proof of concept

### Safe Harbor

We support safe harbor for security researchers who:

- Make a good faith effort to avoid privacy violations, data destruction, and service interruption
- Only interact with test accounts or your own accounts
- Do not exploit vulnerabilities beyond proof of concept
- Report issues promptly and responsibly
- Follow coordinated disclosure principles

We will not pursue legal action against researchers who follow these guidelines.

## Security Hall of Fame

We appreciate the security researchers who have helped make ANTARES more secure:

<!-- Will be populated as security reports are received and addressed -->

*No vulnerabilities have been reported through the security process yet.*

## Security Updates

Security updates will be published:

1. **GitHub Security Advisories** - For all confirmed vulnerabilities
2. **Release Notes** - Security fixes highlighted in release notes
3. **CHANGELOG.md** - Detailed change descriptions
4. **Email Notification** - To users who opt in (coming soon)

## Contact

For security-related questions or concerns:

- **Security Reports**: [SECURITY_EMAIL - TBD]
- **General Security Questions**: Open an issue with "security" label (for non-sensitive questions)
- **Project Maintainers**: See [CONTRIBUTING.md](CONTRIBUTING.md) for contact information

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [Security Assessment Report](ASSESSMENT_REPORT.md)

## Acknowledgments

This security policy is based on best practices from:

- [GitHub Security Policy Guidelines](https://docs.github.com/en/code-security/getting-started/adding-a-security-policy-to-your-repository)
- [OWASP Vulnerability Disclosure Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Vulnerability_Disclosure_Cheat_Sheet.html)
- [Coordinated Vulnerability Disclosure](https://vuls.cert.org/confluence/display/CVD/)

---

**Last Updated:** November 15, 2025

Thank you for helping keep ANTARES secure!
