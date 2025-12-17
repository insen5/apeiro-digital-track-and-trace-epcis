import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { HelpService } from './help.service';
import { GS1HelpContent } from '../../../shared/domain/entities/gs1-help-content.entity';

@ApiTags('GS1 Help System')
@Controller('help')
export class HelpController {
  constructor(private readonly helpService: HelpService) {}

  @Get('topic/:topicKey')
  @ApiOperation({ summary: 'Get help content by topic key' })
  async getHelpContent(@Param('topicKey') topicKey: string) {
    return this.helpService.getHelpContent(topicKey);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search help content' })
  @ApiQuery({ name: 'q', description: 'Search query' })
  async searchHelp(@Query('q') query: string) {
    return this.helpService.searchHelp(query);
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Get help topics by category' })
  async getByCategory(@Param('category') category: string) {
    return this.helpService.getByCategory(category);
  }

  @Get('topic/:topicKey/related')
  @ApiOperation({ summary: 'Get related topics' })
  async getRelatedTopics(@Param('topicKey') topicKey: string) {
    return this.helpService.getRelatedTopics(topicKey);
  }

  @Get()
  @ApiOperation({ summary: 'Get all help topics' })
  async getAllTopics() {
    return this.helpService.getAllTopics();
  }

  @Post()
  @ApiOperation({ summary: 'Create or update help content (admin only)' })
  async upsertHelpContent(@Body() data: Partial<GS1HelpContent>) {
    return this.helpService.upsertHelpContent(data);
  }

  @Delete('topic/:topicKey')
  @ApiOperation({ summary: 'Delete help content (admin only)' })
  async deleteHelpContent(@Param('topicKey') topicKey: string) {
    await this.helpService.deleteHelpContent(topicKey);
    return { message: 'Help content deleted successfully' };
  }
}
