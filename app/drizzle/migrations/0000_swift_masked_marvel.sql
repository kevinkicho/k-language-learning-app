CREATE TABLE `quiz_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`sentence_id` text NOT NULL,
	`score` integer NOT NULL,
	`total_words` integer NOT NULL,
	`completed_at` text NOT NULL,
	FOREIGN KEY (`sentence_id`) REFERENCES `sentences`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sentences` (
	`id` text PRIMARY KEY NOT NULL,
	`english_sentence` text NOT NULL,
	`spanish_translation` text,
	`audio_path` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `translation_cache` (
	`id` text PRIMARY KEY NOT NULL,
	`english_text` text NOT NULL,
	`spanish_text` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `word_audio_cache` (
	`id` text PRIMARY KEY NOT NULL,
	`word` text NOT NULL,
	`language` text NOT NULL,
	`audio_path` text NOT NULL,
	`created_at` text NOT NULL
);
