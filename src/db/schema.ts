import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const savedWords = sqliteTable('saved_words', {
  word: text('word').primaryKey(),
  htmlDefinition: text('html_definition'),
  savedAt: integer('saved_at', { mode: 'timestamp' }).notNull(),
  nextReviewAt: integer('next_review_at', { mode: 'timestamp' }).notNull(),
  interval: integer('interval').notNull().default(0), // in days
  repetition: integer('repetition').notNull().default(0),
  easeFactor: real('ease_factor').notNull().default(2.5),
});

export const documents = sqliteTable('documents', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  type: text('type').notNull(), // 'book' or 'article'
  title: text('title').notNull(),
  author: text('author'),
  fileName: text('file_name'),
  fileKey: text('file_key'),
  content: text('content'), // For pure text articles
  readingProgress: text('reading_progress'), // JSON string or CFI
  totalProgress: text('total_progress'),
  percentage: integer('percentage').default(0),
  createdAt: integer('created_at').notNull(),
  lastReadAt: integer('last_read_at').notNull()
});
