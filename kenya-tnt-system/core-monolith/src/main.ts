import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });
    
    // Enable CORS for frontend (allow all for demo)
    app.enableCors({
      origin: true, // Allow all origins for demo
      credentials: true,
    });
    
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false, // Allow query parameters without DTO validation
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
    
    app.setGlobalPrefix('api');
    
    // Setup Swagger/OpenAPI documentation
    const config = new DocumentBuilder()
      .setTitle('Kenya TNT System API')
      .setDescription('Kenya National Track & Trace System - Core Monolith API')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'access-token',
      )
      .addApiKey(
        {
          type: 'apiKey',
          name: 'X-API-Key',
          in: 'header',
          description: 'API key for facility integration authentication',
        },
        'api-key',
      )
      .build();
    
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      customSiteTitle: 'Kenya TNT API Docs',
    });
    
    const port = process.env.PORT || 4000;
    await app.listen(port);
    
    console.log('\n' + '='.repeat(60));
    console.log('🚀 Kenya TNT System is running!');
    console.log('='.repeat(60));
    console.log(`📍 API Base URL: ${await app.getUrl()}/api`);
    console.log(`📚 Swagger Docs:  ${await app.getUrl()}/api/docs`);
    console.log(`❤️  Health Check:  ${await app.getUrl()}/api/health`);
    console.log(`🎯 Demo Endpoints: ${await app.getUrl()}/api/demo`);
    console.log('='.repeat(60) + '\n');
  } catch (error) {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
  }
}
bootstrap();

