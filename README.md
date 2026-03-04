# DASI

## Summary

DASI is a multi-service platform. The **Identity service** (`services/identity/`) is the central component for user accounts and authentication: it handles sign-up, sign-in, JWT issuance, and token validation. Other services can call it over HTTP (REST) or RabbitMQ (e.g. `validate_token`). See `services/identity/README.md` for full documentation.