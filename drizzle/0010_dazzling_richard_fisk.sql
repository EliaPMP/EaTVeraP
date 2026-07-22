CREATE TABLE `fitnessLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`type` enum('cardio','weightlifting','described','manual') NOT NULL,
	`name` varchar(255) NOT NULL,
	`durationMin` int,
	`caloriesBurned` int NOT NULL DEFAULT 0,
	`distanceKm` int,
	`sets` int,
	`reps` int,
	`weightKg` int,
	`notes` text,
	`intensity` enum('low','moderate','high'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fitnessLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stepLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`steps` int NOT NULL DEFAULT 0,
	`distanceM` int,
	`caloriesBurned` int,
	`source` enum('manual','healthkit','pedometer') NOT NULL DEFAULT 'manual',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stepLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `user_idx` ON `fitnessLogs` (`userId`);--> statement-breakpoint
CREATE INDEX `user_date_idx` ON `fitnessLogs` (`userId`,`date`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `stepLogs` (`userId`);--> statement-breakpoint
CREATE INDEX `user_date_idx` ON `stepLogs` (`userId`,`date`);--> statement-breakpoint
CREATE INDEX `unique_user_date` ON `stepLogs` (`userId`,`date`);