import { Controller, Get, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { GS1Service } from '../../shared/gs1/gs1.service';

/**
 * Demo Controller
 *
 * Provides demo endpoints to showcase Phase 5 functionality
 */
@ApiTags('Demo')
@Controller('demo')
export class DemoController {
  constructor(private readonly gs1Service: GS1Service) {}

  @Get('gs1/sscc')
  async generateDemoSSCC() {
    const sscc = await this.gs1Service.generateSSCC();
    return {
      sscc,
      epcURI: this.gs1Service.formatSSCCAsEPCURI(sscc),
      message: 'SSCC generated using GS1 Service',
    };
  }

  @Get('gs1/batch')
  async generateDemoBatch() {
    const batchNo = await this.gs1Service.generateBatchNumber({
      product_id: 1,
      user_id: 'demo-user',
    });
    return {
      batchNumber: batchNo,
      message: 'Batch number generated using GS1 Service',
      note: 'Batch numbers are stored as-is, not as EPC URIs',
    };
  }

  @Get('gs1/sgtin')
  generateDemoSGTIN() {
    const sgtin = this.gs1Service.generateSGTIN({
      gtin: '01234567890123',
      serial_number: 'SN123456',
    });
    return {
      sgtin,
      parsed: this.gs1Service.parseSGTIN(sgtin),
      message: 'SGTIN generated using GS1 Service',
    };
  }

  @Get('gs1/qrcode')
  async generateDemoQRCode() {
    const sscc = await this.gs1Service.generateSSCC();
    const qrCode = await this.gs1Service.generateQRCode(sscc, {
      width: 200,
      height: 200,
    });
    return {
      sscc,
      qrCodeBase64: `data:image/png;base64,${qrCode.toString('base64')}`,
      message: 'QR Code generated for SSCC',
    };
  }

  @Get('architecture')
  getArchitecture(@Res() res: Response) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kenya TNT System Architecture</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      line-height: 1.6;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 2rem;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
      color: white;
      padding: 3rem 2rem;
      text-align: center;
    }
    .header h1 {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
      font-weight: 700;
    }
    .header p {
      font-size: 1.2rem;
      opacity: 0.9;
    }
    .content {
      padding: 2rem;
    }
    .section {
      margin-bottom: 2.5rem;
    }
    .section h2 {
      color: #2a5298;
      font-size: 1.8rem;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 3px solid #667eea;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .info-card {
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      padding: 1.5rem;
      border-radius: 12px;
      border-left: 4px solid #667eea;
    }
    .info-card h3 {
      color: #1e3c72;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 0.5rem;
      font-weight: 600;
    }
    .info-card p {
      color: #2d3748;
      font-size: 1.1rem;
      font-weight: 500;
    }
    .module {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      border: 2px solid #e9ecef;
      transition: all 0.3s ease;
    }
    .module:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.2);
      border-color: #667eea;
    }
    .module h3 {
      color: #2a5298;
      font-size: 1.4rem;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .module-emoji {
      font-size: 1.8rem;
    }
    .module p {
      color: #495057;
      margin-bottom: 1rem;
      font-style: italic;
    }
    .endpoints, .features {
      margin-top: 1rem;
    }
    .endpoints h4, .features h4 {
      color: #495057;
      font-size: 0.9rem;
      text-transform: uppercase;
      margin-bottom: 0.5rem;
      font-weight: 600;
    }
    .endpoint-list, .feature-list {
      list-style: none;
    }
    .endpoint-list li {
      background: white;
      padding: 0.6rem 1rem;
      margin: 0.3rem 0;
      border-radius: 6px;
      border-left: 3px solid #667eea;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 0.9rem;
      color: #2d3748;
    }
    .feature-list li {
      padding: 0.4rem 0;
      padding-left: 1.5rem;
      position: relative;
      color: #495057;
    }
    .feature-list li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #28a745;
      font-weight: bold;
      font-size: 1.2rem;
    }
    .improvements {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
    }
    .improvement-item {
      background: linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%);
      padding: 1rem;
      border-radius: 8px;
      border-left: 4px solid #00acc1;
      color: #00695c;
      font-weight: 500;
    }
    .shared-services {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }
    .service-card {
      background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
      padding: 1.2rem;
      border-radius: 10px;
      border-left: 4px solid #ff9800;
    }
    .service-card h4 {
      color: #e65100;
      font-size: 1.1rem;
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .service-card p {
      color: #bf360c;
      font-size: 0.95rem;
    }
    @media (max-width: 768px) {
      body {
        padding: 1rem;
      }
      .header h1 {
        font-size: 2rem;
      }
      .content {
        padding: 1rem;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏗️ Kenya TNT System Architecture</h1>
      <p>Modular Monolith with Hexagonal Architecture</p>
    </div>
    
    <div class="content">
      <div class="info-grid">
        <div class="info-card">
          <h3>Architecture Pattern</h3>
          <p>Modular Monolith with Hexagonal Architecture</p>
        </div>
        <div class="info-card">
          <h3>Database</h3>
          <p>Single PostgreSQL database (all modules share)</p>
        </div>
      </div>

      <div class="section">
        <h2>📦 System Modules</h2>
        
        <div class="module">
          <h3><span class="module-emoji">🏛️</span> Regulator Module</h3>
          <p>PPB - Product catalog source of truth</p>
          <div class="endpoints">
            <h4>Endpoints:</h4>
            <ul class="endpoint-list">
              <li>/api/master-data/products</li>
              <li>/api/analytics/journey</li>
              <li>/api/regulator/recall</li>
              <li>/api/regulator/analytics</li>
            </ul>
          </div>
        </div>

        <div class="module">
          <h3><span class="module-emoji">🏭</span> Manufacturer Module</h3>
          <p>Manufacturer operations</p>
          <div class="endpoints">
            <h4>Endpoints:</h4>
            <ul class="endpoint-list">
              <li>/api/manufacturer/batches</li>
              <li>/api/manufacturer/cases</li>
              <li>/api/manufacturer/packages</li>
              <li>/api/manufacturer/shipments</li>
            </ul>
          </div>
          <div class="features">
            <h4>Features:</h4>
            <ul class="feature-list">
              <li>Calls PPB API for products</li>
              <li>Uses GS1 Service for SSCC generation</li>
              <li>Uses GS1 Service for EPCIS events</li>
              <li>Numeric quantities (can do math!)</li>
            </ul>
          </div>
        </div>

        <div class="module">
          <h3><span class="module-emoji">🚚</span> Distributor Module</h3>
          <p>Distributor/Supplier operations</p>
          <div class="endpoints">
            <h4>Endpoints:</h4>
            <ul class="endpoint-list">
              <li>/api/distributor/shipments</li>
            </ul>
          </div>
          <div class="features">
            <h4>Features:</h4>
            <ul class="feature-list">
              <li>Receive shipments (direct DB query)</li>
              <li>Forward shipments (new SSCC)</li>
              <li>Parent SSCC tracking</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>🔧 Shared Services</h2>
        <div class="shared-services">
          <div class="service-card">
            <h4>GS1 Service</h4>
            <p>SSCC, SGTIN, Batch Number, Barcode generation</p>
          </div>
          <div class="service-card">
            <h4>EPCIS Service</h4>
            <p>Vendor-agnostic EPCIS adapter</p>
          </div>
          <div class="service-card">
            <h4>PPB API Client</h4>
            <p>PPB product catalog client</p>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>✨ Key Improvements</h2>
        <div class="improvements">
          <div class="improvement-item">Single database - SQL joins possible</div>
          <div class="improvement-item">Journey tracking - single query (no HTTP calls)</div>
          <div class="improvement-item">Numeric quantities - math operations work</div>
          <div class="improvement-item">GS1 Service Layer - centralized functionality</div>
          <div class="improvement-item">Vendor-agnostic EPCIS - switch providers easily</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
    `;
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }
}

