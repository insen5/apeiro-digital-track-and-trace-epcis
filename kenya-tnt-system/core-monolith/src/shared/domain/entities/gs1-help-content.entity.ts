import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('gs1_help_content')
@Index(['topicKey'], { unique: true })
@Index(['category'])
export class GS1HelpContent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'topic_key', unique: true })
  topicKey: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ nullable: true })
  category?: string; // 'identifiers', 'workflows', 'concepts'

  @Column({ name: 'related_topics', type: 'text', array: true, default: '{}' })
  relatedTopics: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
