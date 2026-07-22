CREATE TABLE `pendingProductImages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`barcode` varchar(128) NOT NULL,
	`userId` int NOT NULL,
	`imageUrl` text NOT NULL,
	`imageKey` text NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`productName` text,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	CONSTRAINT `pendingProductImages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `barcode_idx` ON `pendingProductImages` (`barcode`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `pendingProductImages` (`userId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `pendingProductImages` (`status`);