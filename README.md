# Apeiro Digital Track and Trace EPCIS

This is the parent repository that manages all microservices as git submodules.

## Microservices

- `epcis-auth-service` - Authentication service
- `epcis-supplier-service` - Supplier service
- `epcis-manufacturer-service` - Manufacturer service
- `epcis-user-facility-service` - User facility service
- `epcis-ppb-service` - PPB service
- `epcis-notification-service` - Notification service
- `epcis_track_and_trace_webapp` - Web application
- `epcis-service` - Core EPCIS service
- `keycloak-login-theme-TnT` - Keycloak login theme

## Getting Started

### Initial Setup

If you're cloning this repository for the first time:

```bash
git clone --recursive git@github.com:apeiro-digital-track-and-trace-epcis/apeiro-digital-track-and-trace-epcis.git
```

Or if you've already cloned:

```bash
git submodule update --init --recursive
```

### Working with Submodules

**Update all submodules to latest:**
```bash
git submodule update --remote
```

**Update a specific submodule:**
```bash
cd epcis-auth-service
git pull origin main
cd ..
git add epcis-auth-service
git commit -m "Update epcis-auth-service"
```

**Add changes in a submodule:**
```bash
cd epcis-auth-service
# Make your changes
git add .
git commit -m "Your changes"
git push origin main
cd ..
git add epcis-auth-service
git commit -m "Update submodule reference"
```

## Using with Cursor

Open the workspace file in Cursor:
```bash
cursor ~/apeiro-digital-track-and-trace.code-workspace
```

This will open all microservices in a single workspace, allowing you to:
- Search across all repositories
- Use Cursor AI with context from all microservices
- Navigate between services easily
- Build features that span multiple microservices

