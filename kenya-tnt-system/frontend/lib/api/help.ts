import { ApiClient } from './client';

const client = new ApiClient();

export type HelpCategory = 
  | 'GS1_IDENTIFIERS' 
  | 'EPCIS_EVENTS' 
  | 'SUPPLY_CHAIN' 
  | 'WORKFLOW' 
  | 'COMPLIANCE';

export interface HelpContent {
  id: number;
  topicKey: string;
  title: string;
  description: string;
  category: HelpCategory;
  examples?: string[];
  relatedTopics?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UpsertHelpContentDto {
  topicKey: string;
  title: string;
  description: string;
  category: HelpCategory;
  examples?: string[];
  relatedTopics?: string[];
}

export const helpApi = {
  // Get help content
  async getByTopic(topicKey: string): Promise<HelpContent | null> {
    try {
      return await client.get(`/help/topic/${topicKey}`);
    } catch (error) {
      return null;
    }
  },

  async getAll(): Promise<HelpContent[]> {
    return client.get('/help');
  },

  async getByCategory(category: HelpCategory): Promise<HelpContent[]> {
    return client.get(`/help/category/${category}`);
  },

  async getRelated(topicKey: string): Promise<HelpContent[]> {
    return client.get(`/help/related/${topicKey}`);
  },

  // Search help content
  async search(query: string): Promise<HelpContent[]> {
    return client.get('/help/search', { q: query });
  },

  // Admin operations (create/update/delete)
  async upsert(dto: UpsertHelpContentDto): Promise<HelpContent> {
    return client.post('/help', dto);
  },

  async delete(topicKey: string): Promise<void> {
    return client.delete(`/help/topic/${topicKey}`);
  },
};
