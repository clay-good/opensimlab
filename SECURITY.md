# Security policy

Open Sim Lab is a static, offline-capable educational simulator. Security includes conventional
software vulnerabilities plus privacy leakage, real-patient input paths, unsafe report handling,
content-integrity bypasses, and ways to expose internal calculations as clinical tools.

## Reporting

Do not include patient, learner, credential, exploit-secret, or other sensitive data. Once the
repository is public, use GitHub's private vulnerability-reporting form on the repository Security
tab. The repository is currently private and has no public security intake; invited collaborators
should use the private Security tab rather than an issue.

The in-product report service is specified but not implemented. It is not a security-reporting
channel and no current control transmits a report.

Include the affected commit/version, surface, impact, minimal reproduction, and suggested severity.
Maintainers will acknowledge a usable report within 5 working days, avoid public disclosure while a
fix is prepared, and publish educational-content corrections under [CORRECTIONS.md](CORRECTIONS.md).

Only the latest main-branch build is supported during alpha. Never test against real patient data,
production accounts, third-party systems, or infrastructure you do not own. Safe local proof is
enough.
