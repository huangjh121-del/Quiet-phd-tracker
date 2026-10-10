CREATE TABLE `saved_words` (
	`word` text PRIMARY KEY NOT NULL,
	`html_definition` text,
	`saved_at` integer NOT NULL,
	`next_review_at` integer NOT NULL,
	`interval` integer DEFAULT 0 NOT NULL,
	`repetition` integer DEFAULT 0 NOT NULL,
	`ease_factor` real DEFAULT 2.5 NOT NULL
);
