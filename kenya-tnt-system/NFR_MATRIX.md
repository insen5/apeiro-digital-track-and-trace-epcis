# Non-Functional Requirements (NFR) Matrix - Kenya TNT System

**Last Updated**: December 19, 2025  
**Project**: Kenya Track and Trace System  
**Version**: 1.0

---

## 📊 Environment-Specific Requirements

| **Category**             | **Development**                  | **Staging**                      | **Production**                   |
|--------------------------|----------------------------------|----------------------------------|----------------------------------|
| **Purpose**              | Fast iteration                   | QA & Performance testing         | Live system                      |
| **Uptime**               | Best effort                      | 95%                              | 99.5%                            |
| **Response Time**        | < 5s (P95)                       | < 2s (P95)                       | < 1s (P95)                       |
| **Startup Time**         | < 60s                            | < 45s                            | < 30s                            |
| **Memory Limit**         | 1GB (backend), 512MB (frontend)  | 2GB (backend), 1GB (frontend)    | 4GB (backend), 2GB (frontend)    |
| **CPU Limit**            | 1 core                           | 2 cores                          | 4 cores                          |
| **Concurrent Users**     | 10                               | 100                              | 1000                             |
| **Test Coverage**        | No requirement                   | 70%                              | 80%                              |
| **Logging Level**        | `debug`                          | `info`                           | `warn`                           |
| **Error Tracking**       | Console only                     | Sentry/CloudWatch                | Sentry/CloudWatch (alerts)       |
| **Metrics**              | None                             | Basic (Prometheus)               | Full (Prometheus + Grafana)      |
| **Backups**              | None                             | Daily                            | Hourly (automated)               |
| **HTTPS**                | Not required                     | Let's Encrypt                    | Let's Encrypt + WAF              |
| **Secrets Management**   | `.env` files                     | AWS Secrets Manager              | AWS Secrets Manager + rotation   |
| **Rate Limiting**        | None                             | 100 req/min                      | 1000 req/min                     |

---

## 🎯 Performance Requirements

### Backend API (NestJS)

| **Endpoint**                  | **Target Response Time (P95)** | **Max Response Time (P99)** | **Expected Load**         |
|-------------------------------|--------------------------------|-----------------------------|---------------------------|
| `/api/health`                 | 50ms                           | 100ms                       | 1000 req/sec              |
| `/api/auth/login`             | 500ms                          | 1000ms                      | 50 req/sec                |
| `/api/consignments`           | 1000ms                         | 2000ms                      | 100 req/sec               |
| `/api/batches`                | 1000ms                         | 2000ms                      | 100 req/sec               |
| `/api/epcis-events`           | 1500ms                         | 3000ms                      | 50 req/sec                |
| `/api/master-data/*`          | 500ms                          | 1000ms                      | 200 req/sec               |

### Frontend (Next.js)

| **Metric**                    | **Target**                     |
|-------------------------------|--------------------------------|
| First Contentful Paint (FCP)  | < 1.5s                         |
| Largest Contentful Paint (LCP)| < 2.5s                         |
| Time to Interactive (TTI)     | < 3s                           |
| Cumulative Layout Shift (CLS) | < 0.1                          |

### Database (PostgreSQL)

| **Metric**                    | **Target**                     |
|-------------------------------|--------------------------------|
| Query response time (P95)     | < 100ms                        |
| Connection pool size          | 20 (dev), 50 (staging), 100 (prod) |
| Max connections               | 100 (dev), 200 (staging), 500 (prod) |
| Backup frequency              | None (dev), Daily (staging), Hourly (prod) |

---

## 🛡️ Security Requirements

### Authentication & Authorization

| **Requirement**               | **Implementation**             |
|-------------------------------|--------------------------------|
| Password hashing              | bcrypt (cost factor: 12)       |
| JWT expiry                    | 7 days                         |
| Refresh token expiry          | 30 days                        |
| Session management            | Redis (production)             |
| Role-based access control     | NestJS Guards                  |

### Data Protection

| **Requirement**               | **Implementation**             |
|-------------------------------|--------------------------------|
| Data at rest encryption       | PostgreSQL TDE (production)    |
| Data in transit encryption    | TLS 1.3                        |
| Sensitive field encryption    | AES-256                        |
| API key rotation              | Every 90 days                  |
| Secret scanning               | GitHub Secret Scanning         |

---

## 🧪 Testing Requirements

### Code Coverage

| **Environment**  | **Minimum Coverage** | **Test Types**                          |
|------------------|----------------------|-----------------------------------------|
| Development      | No requirement       | Unit tests only                         |
| Staging          | 70%                  | Unit + Integration + E2E                |
| Production       | 80%                  | Unit + Integration + E2E + Load         |

### Test Execution

| **Test Type**     | **Frequency**        | **Environment**       | **Tool**              |
|-------------------|----------------------|-----------------------|-----------------------|
| Unit Tests        | Every commit         | Dev, Staging, Prod    | Jest                  |
| Integration Tests | Every PR             | Staging, Prod         | Jest + Supertest      |
| E2E Tests         | Before deployment    | Staging, Prod         | Playwright            |
| Load Tests        | Before prod deploy   | Staging, Prod         | k6                    |
| Security Scan     | Every PR             | All                   | npm audit, Trivy      |

---

## 📈 Monitoring & Alerting

### Metrics to Track

| **Metric**                    | **Tool**               | **Alert Threshold**            |
|-------------------------------|------------------------|--------------------------------|
| API response time (P95)       | Prometheus             | > 2s                           |
| Error rate                    | Sentry                 | > 5%                           |
| Memory usage                  | Docker stats           | > 80%                          |
| CPU usage                     | Docker stats           | > 80%                          |
| Database connections          | pg_stat_activity       | > 90% of max                   |
| Disk usage                    | CloudWatch             | > 80%                          |
| Failed logins                 | Application logs       | > 10 per minute                |
| EPCIS event ingestion rate    | Kafka metrics          | < 10 events/minute (alert)     |

### Alerting Channels

| **Severity**  | **Channel**           | **Response Time**     |
|---------------|-----------------------|-----------------------|
| Critical      | PagerDuty + Slack     | Immediate             |
| High          | Slack + Email         | Within 15 minutes     |
| Medium        | Email                 | Within 1 hour         |
| Low           | Jira ticket           | Within 24 hours       |

---

## 🔄 Availability & Disaster Recovery

### Uptime Requirements

| **Environment**  | **Target Uptime** | **Downtime Budget (per month)** |
|------------------|-------------------|---------------------------------|
| Development      | Best effort       | N/A                             |
| Staging          | 95%               | 36 hours                        |
| Production       | 99.5%             | 3.6 hours                       |

### Backup & Recovery

| **Data Type**         | **Backup Frequency** | **Retention**     | **RTO**   | **RPO**   |
|-----------------------|----------------------|-------------------|-----------|-----------|
| PostgreSQL database   | Hourly (prod)        | 30 days           | 4 hours   | 1 hour    |
| EPCIS events          | Real-time (Kafka)    | 7 days            | 1 hour    | 0 (no loss)|
| Application logs      | Real-time            | 90 days           | N/A       | N/A       |
| Configuration files   | Git (version control)| Forever           | Immediate | 0         |

---

## 🚀 Scalability Requirements

### Horizontal Scaling

| **Service**       | **Min Instances** | **Max Instances** | **Trigger**                   |
|-------------------|-------------------|-------------------|-------------------------------|
| Backend API       | 2                 | 10                | CPU > 70% or Request rate > 500/sec |
| Frontend          | 2                 | 5                 | CPU > 70%                     |
| PostgreSQL        | 1 (primary)       | 1 primary + 2 replicas | Manual                   |

### Database Growth

| **Year**  | **Expected Records**  | **Estimated Storage** |
|-----------|-----------------------|-----------------------|
| Year 1    | 1M consignments       | 100 GB                |
| Year 2    | 5M consignments       | 500 GB                |
| Year 3    | 10M consignments      | 1 TB                  |

---

## 📝 Logging Requirements

### Log Levels by Environment

| **Environment**  | **Level**  | **Retention** | **Destination**               |
|------------------|------------|---------------|-------------------------------|
| Development      | `debug`    | 7 days        | Console + local files         |
| Staging          | `info`     | 30 days       | CloudWatch + S3               |
| Production       | `warn`     | 90 days       | CloudWatch + S3 + Sentry      |

### What to Log

| **Event Type**                | **Log Level** | **Include**                          |
|-------------------------------|---------------|--------------------------------------|
| User login/logout             | `info`        | User ID, timestamp, IP address       |
| API request                   | `info`        | Method, path, status, duration       |
| Database query (slow)         | `warn`        | Query, duration (if > 1s)            |
| Application error             | `error`       | Stack trace, request context         |
| External API call             | `info`        | Endpoint, status, duration           |
| EPCIS event ingestion         | `info`        | Event type, EPCIS document ID        |

### What NOT to Log

- ❌ Passwords (plaintext or hashed)
- ❌ JWT tokens
- ❌ API keys
- ❌ Credit card numbers
- ❌ Personal health information (PHI)

---

## 🔒 Compliance Requirements

### Data Retention

| **Data Type**         | **Retention Period**  | **Reason**                        |
|-----------------------|-----------------------|-----------------------------------|
| User accounts         | Indefinite            | Business requirement              |
| Audit logs            | 7 years               | Regulatory compliance             |
| EPCIS events          | 10 years              | GS1 EPCIS standard                |
| Personal data (GDPR)  | User-controlled       | Right to be forgotten             |

### Standards Compliance

| **Standard**      | **Status**    | **Notes**                             |
|-------------------|---------------|---------------------------------------|
| GS1 EPCIS 2.0     | ✅ Compliant  | Full implementation                   |
| GS1 CBV           | ✅ Compliant  | Core Business Vocabulary              |
| GDPR              | ⚠️ Partial    | Pending privacy policy                |
| ISO 27001         | 🔄 In Progress| Security management system            |
| OpenEPCIS         | ✅ Compliant  | Using OpenEPCIS CE                    |

---

## ✅ Acceptance Criteria

### Before Staging Deployment

- [ ] All unit tests passing (70% coverage)
- [ ] Integration tests passing
- [ ] Security scan passed (no CRITICAL or HIGH vulnerabilities)
- [ ] Load test completed (100 concurrent users)
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] Monitoring dashboards created

### Before Production Deployment

- [ ] All staging tests passing (80% coverage)
- [ ] E2E tests passing
- [ ] Load test completed (1000 concurrent users)
- [ ] Security audit completed
- [ ] Performance benchmarks met (P95 < 1s)
- [ ] Disaster recovery plan tested
- [ ] Manual QA approval
- [ ] Stakeholder sign-off

---

**Maintained By**: Kenya TNT Team  
**Review Frequency**: Quarterly  
**Next Review**: March 2026


