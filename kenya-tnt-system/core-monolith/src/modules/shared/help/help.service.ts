import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { GS1HelpContent } from '../../../shared/domain/entities/gs1-help-content.entity';

@Injectable()
export class HelpService {
  private readonly logger = new Logger(HelpService.name);

  constructor(
    @InjectRepository(GS1HelpContent)
    private readonly helpRepo: Repository<GS1HelpContent>,
  ) {}

  /**
   * Get help content by topic key
   */
  async getHelpContent(topicKey: string): Promise<GS1HelpContent> {
    const content = await this.helpRepo.findOne({
      where: { topicKey },
    });

    if (!content) {
      throw new NotFoundException(`Help content not found for topic: ${topicKey}`);
    }

    return content;
  }

  /**
   * Search help content
   */
  async searchHelp(query: string): Promise<GS1HelpContent[]> {
    return this.helpRepo.find({
      where: [
        { title: Like(`%${query}%`) },
        { description: Like(`%${query}%`) },
        { topicKey: Like(`%${query}%`) },
      ],
      take: 10,
    });
  }

  /**
   * Get all help topics by category
   */
  async getByCategory(category: string): Promise<GS1HelpContent[]> {
    return this.helpRepo.find({
      where: { category },
      order: { title: 'ASC' },
    });
  }

  /**
   * Get related topics for a given topic
   */
  async getRelatedTopics(topicKey: string): Promise<GS1HelpContent[]> {
    const content = await this.getHelpContent(topicKey);

    if (!content.relatedTopics || content.relatedTopics.length === 0) {
      return [];
    }

    // Use IN operator instead of individual OR conditions
    const related = await this.helpRepo
      .createQueryBuilder('help')
      .where('help.topicKey IN (:...keys)', { keys: content.relatedTopics })
      .getMany();

    return related;
  }

  /**
   * Get all help topics
   */
  async getAllTopics(): Promise<GS1HelpContent[]> {
    return this.helpRepo.find({
      order: { category: 'ASC', title: 'ASC' },
    });
  }

  /**
   * Create or update help content (admin only)
   */
  async upsertHelpContent(data: Partial<GS1HelpContent>): Promise<GS1HelpContent> {
    if (!data.topicKey) {
      throw new Error('Topic key is required');
    }

    const existing = await this.helpRepo.findOne({
      where: { topicKey: data.topicKey },
    });

    if (existing) {
      // Update
      Object.assign(existing, data);
      existing.updatedAt = new Date();
      return this.helpRepo.save(existing);
    } else {
      // Create
      const newContent = this.helpRepo.create(data);
      return this.helpRepo.save(newContent);
    }
  }

  /**
   * Delete help content (admin only)
   */
  async deleteHelpContent(topicKey: string): Promise<void> {
    const content = await this.getHelpContent(topicKey);
    await this.helpRepo.remove(content);
  }
}
