#!/usr/bin/env ts-node
/**
 * Bootstrap PPB Product Catalog
 * 
 * Syncs the entire product catalog from PPB Terminology API to ppb_products table.
 * This script can be run manually or scheduled.
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { MasterDataService } from '../src/modules/shared/master-data/master-data.service';

async function bootstrap() {
  console.log('🚀 Starting PPB Product Catalog Bootstrap...\n');

  // Suppress Kafka errors during bootstrap
  const originalError = console.error;
  console.error = (...args: any[]) => {
    if (args[0]?.includes?.('Kafka') || args[0]?.includes?.('kafkajs')) {
      // Suppress Kafka connection errors
      return;
    }
    originalError(...args);
  };

  let app;
  try {
    app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn', 'log'],
    });
  } catch (error: any) {
    // Continue even if Kafka fails
    if (error?.message?.includes('Kafka')) {
      console.log('⚠️  Kafka connection failed (expected if Kafka is not running), continuing...\n');
      // Try to get the app context anyway
      try {
        app = await NestFactory.createApplicationContext(AppModule, {
          logger: false, // Disable all logging to avoid Kafka errors
        });
      } catch (e: any) {
        console.error('Failed to create app context:', e.message);
        process.exit(1);
      }
    } else {
      throw error;
    }
  }

  const masterDataService = app.get(MasterDataService);

  try {
    console.log('📡 Fetching products from PPB Terminology API...');
    console.log('   This may take several minutes depending on catalog size...\n');

    const result = await masterDataService.syncProductCatalog();

    console.log('\n✅ Bootstrap completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Results:`);
    console.log(`   • Total fetched: ${result.total}`);
    console.log(`   • Inserted: ${result.inserted}`);
    console.log(`   • Updated: ${result.updated}`);
    console.log(`   • Errors: ${result.errors}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Get stats
    const stats = await masterDataService.getProductCatalogStats();
    console.log(`📈 Catalog Statistics:`);
    console.log(`   • Total products in catalog: ${stats.total}`);
    console.log(`   • Last synced: ${stats.lastSynced || 'Never'}`);
    console.log(`   • Last modified (PPB): ${stats.lastModified || 'N/A'}\n`);

    await app.close();
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Bootstrap failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    await app.close();
    process.exit(1);
  }
}

bootstrap();

