import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HelpService } from './help.service';
import { HelpController } from './help.controller';
import { GS1HelpContent } from '../../../shared/domain/entities/gs1-help-content.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([GS1HelpContent]),
  ],
  controllers: [HelpController],
  providers: [HelpService],
  exports: [HelpService],
})
export class HelpModule {}
