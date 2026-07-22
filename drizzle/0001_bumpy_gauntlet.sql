CREATE TABLE `cachedProducts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`barcode` varchar(128) NOT NULL,
	`productName` text,
	`brand` varchar(255),
	`category` varchar(128),
	`imageUrl` text,
	`ingredients` text,
	`nutritionFacts` text,
	`healthScore` int,
	`harmfulIngredients` text,
	`aiAnalysis` text,
	`source` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cachedProducts_id` PRIMARY KEY(`id`),
	CONSTRAINT `cachedProducts_barcode_unique` UNIQUE(`barcode`)
);
--> statement-breakpoint
CREATE TABLE `userSubmittedProducts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`barcode` varchar(128) NOT NULL,
	`productName` text,
	`brand` varchar(255),
	`category` varchar(128),
	`imageUrl` text,
	`ingredients` text,
	`nutritionFacts` text,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`submittedBy` int NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userSubmittedProducts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `barcode_idx` ON `cachedProducts` (`barcode`);--> statement-breakpoint
CREATE INDEX `barcode_idx` ON `userSubmittedProducts` (`barcode`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `userSubmittedProducts` (`submittedBy`);