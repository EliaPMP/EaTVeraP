CREATE TABLE `bodyWeightLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`weightKg` int NOT NULL,
	`weightRaw` varchar(16) NOT NULL,
	`unit` enum('kg','lbs') NOT NULL DEFAULT 'kg',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bodyWeightLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `bw_user_idx` ON `bodyWeightLogs` (`userId`);--> statement-breakpoint
CREATE INDEX `bw_user_date_idx` ON `bodyWeightLogs` (`userId`,`date`);