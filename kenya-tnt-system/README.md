# Kenya Track & Trace System

**Last Updated:** December 17, 2025  
**Version:** 2.0  
**Status:** Production Ready

---

## 📋 Overview

The Kenya Track & Trace System is a comprehensive pharmaceutical supply chain visibility platform implementing EPCIS 2.0 standards for product traceability from manufacture to consumption.

### Key Capabilities

- ✅ **EPCIS 2.0** compliance
- ✅ **GS1 Standards** (GTIN, GLN, SSCC, SGTIN)
- ✅ **Master Data Management** with quality monitoring
- ✅ **Multi-stakeholder** support (Manufacturers, Distributors, Regulators, Facilities)
- ✅ **Real-time tracking** from batch to serial number
- ✅ **Regulatory oversight** (PPB integration)
- ✅ **Facility integration** (FLMIS/LMIS)
- ✅ **Level 5 Traceability** (Tatmeen standard)

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+
- PostgreSQL 14+ with PostGIS extension
- Keycloak (for authentication)

### Quick Deploy

```bash
# Clone repository
git clone <repo-url>
cd kenya-tnt-system

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
# Keycloak: http://localhost:8080
```

See **[core-monolith/docs/deployment/QUICK_DEPLOY.md](./core-monolith/docs/deployment/QUICK_DEPLOY.md)** for detailed instructions.

---

## 📚 Documentation

### Getting Started
- **[core-monolith/docs/deployment/QUICK_DEPLOY.md](./core-monolith/docs/deployment/QUICK_DEPLOY.md)** - Quick deployment guide
- **[core-monolith/docs/deployment/SETUP.md](./core-monolith/docs/deployment/SETUP.md)** - Detailed setup guide
- **[core-monolith/docs/deployment/SETUP_AUTH_AND_RUN.md](./core-monolith/docs/deployment/SETUP_AUTH_AND_RUN.md)** - Authentication setup

### Architecture & Design
- **[../ARCHITECTURE.md](../ARCHITECTURE.md)** - System architecture
- **[core-monolith/docs/FEATURE_GAP_ANALYSIS.md](./core-monolith/docs/FEATURE_GAP_ANALYSIS.md)** - Tatmeen Level 5 comparison
- **[core-monolith/docs/LEVEL_5_FEATURES_GUIDE.md](./core-monolith/docs/LEVEL_5_FEATURES_GUIDE.md)** - Level 5 T&T features

### Module Documentation
- **[core-monolith/src/modules/shared/master-data/README.md](./core-monolith/src/modules/shared/master-data/README.md)** - Master data & quality system
- **[core-monolith/src/modules/manufacturer/README.md](./core-monolith/src/modules/manufacturer/README.md)** - Manufacturer operations
- **[core-monolith/src/modules/regulator/README.md](./core-monolith/src/modules/regulator/README.md)** - PPB regulatory oversight
- **[core-monolith/src/modules/integration/facility/README.md](./core-monolith/src/modules/integration/facility/README.md)** - Facility integration

### Data Quality
- **[../DATA_QUALITY_INDEX.md](../DATA_QUALITY_INDEX.md)** - 🔍 **SEARCH HERE** for all quality documentation
- **[../DATA_QUALITY_README.md](../DATA_QUALITY_README.md)** - Quick start guide
- **[../DATA_QUALITY_EXECUTIVE_SUMMARY.md](../DATA_QUALITY_EXECUTIVE_SUMMARY.md)** - Executive overview

### Deployment
- **[core-monolith/docs/deployment/ORACLE_CLOUD_DEPLOYMENT.md](./core-monolith/docs/deployment/ORACLE_CLOUD_DEPLOYMENT.md)** - Oracle Cloud deployment
- **[core-monolith/docs/deployment/DOCKER_WORKFLOW_README.md](./core-monolith/docs/deployment/DOCKER_WORKFLOW_README.md)** - Docker workflow
- **[core-monolith/docs/deployment/DEPLOYMENT_STATUS.md](./core-monolith/docs/deployment/DEPLOYMENT_STATUS.md)** - Current deployment status

### Complete Index
- **[../DOCUMENTATION_INDEX.md](../DOCUMENTATION_INDEX.md)** - Complete documentation navigation

---

## 🏗️ Architecture

### Tech Stack

**Backend:**
- NestJS (Node.js framework)
- TypeORM (PostgreSQL ORM)
- PostgreSQL 14+ with PostGIS
- EPCIS 2.0 event model

**Frontend:**
- Next.js 14
- React 18
- Tailwind CSS
- shadcn/ui components

**Infrastructure:**
- Docker & Docker Compose
- Nginx (reverse proxy)
- Keycloak (authentication)
- Cron (scheduled tasks)

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│         http://localhost:3000                            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Backend API (NestJS)                        │
│         http://localhost:3001/api                        │
├─────────────────────────────────────────────────────────┤
│  Modules:                                                │
│  • Master Data (Products, Premises, Facilities)          │
│  • Manufacturer (Batches, Consignments, Shipments)      │
│  • Regulator (PPB Analytics, Recalls)                    │
│  • Integration (Facility/LMIS events)                    │
│  • EPCIS (Event capture & query)                         │
│  • Hierarchy (Packaging relationships)                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│         PostgreSQL + PostGIS Database                    │
│                                                           │
│  • Consignments, Batches, Serial Numbers                 │
│  • EPCIS Events (Object, Aggregation, Transformation)    │
│  • Master Data (Products, Premises, Facilities)          │
│  • Quality Audits & Reports                              │
└─────────────────────────────────────────────────────────┘
```

### External Integrations

- **PPB APIs** - Product catalog & premise registrations
- **Safaricom HIE** - Facility master data (UAT & Prod)
- **FLMIS/LMIS** - Facility-level logistics events
- **Keycloak** - Authentication & authorization

---

## 📊 Key Features

### 1. Master Data Management
- Automated sync from PPB, Safaricom HIE
- Quality monitoring with 4 dimensions (completeness, validity, consistency, timeliness)
- Automated quality alerts
- Real-time and scheduled sync strategies

### 2. Product Traceability
- Batch-to-serial-number tracking
- EPCIS 2.0 event model
- GS1 identifiers (GTIN, GLN, SSCC, SGTIN)
- Complete supply chain visibility

### 3. Regulatory Oversight
- PPB batch validation
- Product recall management
- Supply chain analytics
- Counterfeit detection

### 4. Facility Integration
- FLMIS/LMIS event ingestion
- API key authentication
- Event validation & enrichment
- Real-time stock visibility

### 5. Packaging Hierarchy
- Pallet → Case → Package → Serial Number
- Aggregation events
- Pack/unpack operations
- Complete hierarchy tracking

---

## 🎯 Current Implementation Status

See **[../IMPLEMENTATION_STATUS_CONSOLIDATED.md](../IMPLEMENTATION_STATUS_CONSOLIDATED.md)** for detailed status.

### ✅ Completed
- [x] Core EPCIS 2.0 implementation
- [x] Master data sync (Products, Premises, Facilities)
- [x] Quality monitoring & alerting
- [x] Manufacturer module (batches, consignments)
- [x] PPB regulatory module
- [x] Facility integration (FLMIS)
- [x] Packaging hierarchy
- [x] Level 5 traceability features
- [x] Automated scheduling
- [x] Oracle Cloud deployment

### 🚧 In Progress
- [ ] Real-time webhook support for syncs
- [ ] Advanced anomaly detection
- [ ] Mobile app for field operations
- [ ] Enhanced analytics dashboards

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific module tests
npm test master-data
npm test manufacturer
npm test regulator

# Run with coverage
npm test -- --coverage
```

See **[core-monolith/docs/testing/](./core-monolith/docs/testing/)** for testing documentation.

---

## 🚀 Deployment

### Development
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### Production
```bash
docker-compose -f docker-compose.production.yml up -d
```

See **[core-monolith/docs/deployment/](./core-monolith/docs/deployment/)** for deployment guides.

---

## 📞 Support

- **Documentation**: [../DOCUMENTATION_INDEX.md](../DOCUMENTATION_INDEX.md)
- **Data Quality**: [../DATA_QUALITY_INDEX.md](../DATA_QUALITY_INDEX.md)
- **Issues**: GitHub Issues
- **Email**: support@example.com

---

## 📖 License

[License information]

---

**Maintained By**: Development Team  
**Last Updated**: December 17, 2025  
**Version**: 2.0
