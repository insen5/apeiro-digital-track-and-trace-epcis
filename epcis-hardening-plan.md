# OpenEPCIS Production Hardening Plan for Kenya National TNT

## Overview
Transform OpenEPCIS from development/demo configuration to production-ready system capable of handling 100K-1M events/day in an on-premises government data center with 24/7 availability, 5+ year data retention, and integration with Kenyan government systems (KRA, KEBS, PPB).

## Critical Security Hardening

### 1. Authentication & Authorization
**Current State:** Anonymous authentication enabled, OIDC disabled
**Files to Modify:**
- `epcis-service/modules/quarkus-rest-application-ce/src/main/java/io/openepcis/quarkus/ce/AnonAuthMechanism.java`
- `epcis-service/modules/quarkus-rest-application-ce/src/main/resources/application.yml`

**Actions:**
- Remove/disable AnonAuthMechanism (currently allows all requests as "admin")
- Enable OIDC/OAuth2 integration with Keycloak (already in your stack)
- Implement JWT token validation
- Configure role-based access control (RBAC) for capture, query, admin roles
- Add API key authentication for service-to-service communication
- Implement request signing for government system integrations

### 2. OpenSearch Security
**Current State:** Security plugin disabled, HTTP only, no authentication
**Files to Modify:**
- `epcis-service/docker/docker-compose.yml`
- `epcis-service/modules/quarkus-rest-application-ce/src/main/resources/application.yml`

**Actions:**
- Enable OpenSearch Security Plugin (remove DISABLE_SECURITY_PLUGIN)
- Configure TLS/SSL for OpenSearch communication
- Set up OpenSearch user authentication (admin, read-only, write roles)
- Configure certificate-based authentication for Quarkus → OpenSearch
- Enable audit logging in OpenSearch
- Configure network security (bind to specific interfaces, not 0.0.0.0)

### 3. Kafka Security
**Current State:** PLAINTEXT protocol, no authentication
**Files to Modify:**
- `epcis-service/docker/docker-compose.yml`
- `epcis-service/modules/quarkus-capture-topology-ce/src/main/resources/application.yml`

**Actions:**
- Enable SASL/SSL authentication for Kafka
- Configure SSL/TLS encryption for Kafka brokers
- Set up Kafka ACLs (Access Control Lists) for topic access
- Configure Kafka user authentication
- Enable encryption at rest for Kafka logs
- Configure network isolation for Kafka

### 4. Network Security
**Current State:** CORS wide open, no rate limiting, public endpoints
**Files to Modify:**
- `epcis-service/modules/quarkus-rest-application-ce/src/main/resources/application.yml`

**Actions:**
- Restrict CORS to specific origins (government domains, frontend domains)
- Implement rate limiting per IP/user/API key
- Configure request size limits (currently 100KB, may need adjustment)
- Add IP whitelisting for sensitive endpoints
- Configure reverse proxy (nginx/traefik) for additional security layers
- Enable HTTPS/TLS termination at load balancer

### 5. Data Encryption
**Actions:**
- Enable TLS 1.3 for all inter-service communication
- Encrypt data at rest in OpenSearch (use encrypted filesystem or OpenSearch encryption)
- Encrypt Kafka message payloads
- Secure credential storage (use secrets management, not environment variables)
- Implement certificate management and rotation

## Scalability & Performance (100K-1M events/day)

### 6. OpenSearch Clustering & Performance
**Current State:** Single node, 512MB heap, no persistence
**Files to Modify:**
- `epcis-service/docker/docker-compose.yml`

**Actions:**
- Configure multi-node OpenSearch cluster (3+ nodes for HA)
- Increase heap size (4-8GB per node based on data volume)
- Configure persistent volumes for data retention (5+ years)
- Set up index lifecycle management (ILM) policies
- Configure sharding strategy for epcis-event index
- Implement index templates for optimal performance
- Set up hot/warm/cold data tiers for cost optimization
- Configure snapshot/backup strategy

### 7. Kafka Scalability
**Current State:** Single broker, no replication
**Files to Modify:**
- `epcis-service/docker/docker-compose.yml`

**Actions:**
- Configure Kafka cluster (3+ brokers for HA)
- Set replication factor to 3 for critical topics
- Configure partition strategy for parallel processing
- Set up Kafka retention policies (align with 5-year requirement)
- Configure Kafka consumer groups for load distribution
- Implement Kafka monitoring (lag, throughput, errors)

### 8. Application Performance
**Files to Modify:**
- `epcis-service/modules/quarkus-rest-application-ce/src/main/resources/application.yml`
- `epcis-service/modules/quarkus-capture-topology-ce/src/main/resources/application.yml`

**Actions:**
- Increase Kafka Streams thread pool (currently 1 thread)
- Configure connection pooling for OpenSearch
- Implement caching strategy (currently minimal)
- Add request queuing and backpressure handling
- Configure async processing for high-volume captures
- Set up horizontal scaling (multiple Quarkus instances)

## High Availability & Disaster Recovery

### 9. Infrastructure HA
**Actions:**
- Deploy OpenSearch cluster across multiple availability zones
- Configure Kafka with replication across nodes
- Set up load balancer for Quarkus REST API (multiple instances)
- Implement health checks and auto-restart policies
- Configure graceful shutdown and startup sequences
- Set up monitoring and alerting (Prometheus + Grafana)

### 10. Backup & Recovery
**Actions:**
- Configure OpenSearch snapshots to S3-compatible storage (daily)
- Set up Kafka log retention with replication
- Implement point-in-time recovery capability
- Create backup verification and restore procedures
- Document disaster recovery runbooks
- Test backup restoration quarterly

### 11. Data Retention (5+ years)
**Actions:**
- Configure OpenSearch ILM policies for long-term retention
- Set up cold storage tier for archived data (>2 years)
- Implement data archival strategy (move old indices to cold storage)
- Configure index rollover policies
- Set up data export capabilities for regulatory compliance
- Document data retention and deletion policies

## Observability & Monitoring

### 12. Logging & Audit Trail
**Current State:** Basic logging, no audit trail
**Files to Modify:**
- `epcis-service/modules/quarkus-rest-application-ce/src/main/resources/application.yml`

**Actions:**
- Enable structured logging (JSON format)
- Implement audit logging for all capture/query operations
- Log all authentication attempts (success/failure)
- Configure log aggregation (ELK stack or similar)
- Set up log retention policies (align with 5-year requirement)
- Implement log rotation and archival

### 13. Metrics & Monitoring
**Current State:** OTEL disabled, no metrics collection
**Files to Modify:**
- `epcis-service/modules/quarkus-rest-application-ce/src/main/resources/application.yml`

**Actions:**
- Enable OpenTelemetry (OTEL) for distributed tracing
- Expose Prometheus metrics endpoint
- Configure health check endpoints (liveness, readiness)
- Set up Grafana dashboards for:
  - Event capture rate and latency
  - Query performance
  - Kafka lag and throughput
  - OpenSearch cluster health
  - System resource usage
- Configure alerting rules (high error rate, high latency, disk space, etc.)

## Compliance & Integration

### 14. Audit & Compliance Features
**Actions:**
- Implement immutable audit log (append-only)
- Add data lineage tracking
- Configure access logging (who accessed what, when)
- Implement data integrity checks (checksums, hashing)
- Set up compliance reporting endpoints
- Document security controls and compliance measures

### 15. Kenyan Government System Integration
**Actions:**
- Design API interfaces for KRA integration (tax/tariff data)
- Design API interfaces for KEBS integration (standards compliance)
- Design API interfaces for PPB integration (regulatory oversight)
- Implement secure API gateway for external integrations
- Configure mutual TLS (mTLS) for government system connections
- Set up data exchange formats (JSON, XML as needed)
- Implement webhook/notification system for real-time updates

### 16. Data Export & Reporting
**Actions:**
- Implement bulk data export API (for regulatory reporting)
- Support multiple export formats (JSON, CSV, XML)
- Add filtering and date range capabilities
- Implement scheduled report generation
- Set up secure file transfer for large exports
- Configure data anonymization options for exports

## Operational Readiness

### 17. Configuration Management
**Actions:**
- Move all hardcoded values to environment variables
- Create production configuration templates
- Implement configuration validation on startup
- Set up secrets management (HashiCorp Vault or similar)
- Document all configuration parameters
- Create configuration change management process

### 18. Deployment & CI/CD
**Actions:**
- Create production Docker images with security scanning
- Set up automated deployment pipelines
- Implement blue-green or canary deployment strategy
- Create rollback procedures
- Document deployment runbooks
- Set up staging environment that mirrors production

### 19. Documentation
**Actions:**
- Create production deployment guide
- Document security architecture
- Create operational runbooks (startup, shutdown, maintenance)
- Document integration APIs for government systems
- Create troubleshooting guide
- Document backup and recovery procedures

## Priority Implementation Order

**Phase 1 (Critical - Week 1-2):**
- Security hardening (auth, encryption, network security)
- Basic monitoring and logging
- Configuration management

**Phase 2 (High Priority - Week 3-4):**
- Scalability improvements (clustering, performance tuning)
- High availability setup
- Backup and recovery

**Phase 3 (Medium Priority - Week 5-6):**
- Advanced monitoring and observability
- Data retention and archival
- Integration APIs design

**Phase 4 (Ongoing):**
- Government system integrations
- Compliance reporting
- Documentation and training

## Implementation Todos

### Security
- [ ] Remove AnonAuthMechanism and enable OIDC/OAuth2 with Keycloak integration
- [ ] Enable OpenSearch Security Plugin with TLS/SSL and user authentication
- [ ] Configure Kafka with SASL/SSL authentication and encryption
- [ ] Restrict CORS, implement rate limiting, and configure network security
- [ ] Enable TLS encryption for all inter-service communication and data at rest

### Scalability
- [ ] Configure multi-node OpenSearch cluster with persistent volumes and ILM policies
- [ ] Set up Kafka cluster with replication and proper partitioning strategy
- [ ] Optimize Quarkus application performance (thread pools, connection pooling, caching)

### High Availability
- [ ] Deploy infrastructure with HA across multiple nodes/zones
- [ ] Configure backup and disaster recovery procedures
- [ ] Implement data retention policies for 5+ years with archival strategy

### Observability
- [ ] Enable structured logging and audit trail for all operations
- [ ] Enable OpenTelemetry and Prometheus metrics with Grafana dashboards

### Compliance
- [ ] Implement immutable audit log and data integrity checks
- [ ] Design and implement API interfaces for KRA, KEBS, PPB integration
- [ ] Implement data export API with multiple formats for regulatory reporting

### Operations
- [ ] Move all configuration to environment variables and implement secrets management
- [ ] Create production deployment pipeline and documentation

