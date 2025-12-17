import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { MasterDataService } from '../src/modules/shared/master-data/master-data.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const masterDataService = app.get(MasterDataService);

  console.log('Starting PPB Terminology API products bootstrap...');
  const result = await masterDataService.syncProductCatalog();
  
  console.log(`Bootstrap complete!`);
  console.log(`Total products fetched: ${result.total}`);
  console.log(`Inserted: ${result.inserted}`);
  console.log(`Updated: ${result.updated}`);
  console.log(`Errors: ${result.errors}`);

  await app.close();
}

bootstrap().catch((error) => {
  console.error('Bootstrap failed:', error);
  process.exit(1);
});

