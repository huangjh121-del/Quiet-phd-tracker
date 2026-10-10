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
