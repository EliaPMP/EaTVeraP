CREATE TABLE `workoutPrograms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`goal` varchar(64) NOT NULL,
	`fitnessLevel` varchar(32) NOT NULL,
	`daysPerWeek` int NOT NULL DEFAULT 3,
	`totalWeeks` int NOT NULL DEFAULT 8,
	`currentWeek` int NOT NULL DEFAULT 1,
	`programJson` text NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workoutPrograms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workoutSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`programId` int,
	`date` varchar(10) NOT NULL,
	`weekNumber` int,
	`dayNumber` int,
	`workoutName` varchar(255) NOT NULL,
	`exercisesJson` text NOT NULL,
	`durationMin` int,
	`caloriesBurned` int,
	`notes` text,
	`rating` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workoutSessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `wp_user_idx` ON `workoutPrograms` (`userId`);--> statement-breakpoint
CREATE INDEX `wp_user_active_idx` ON `workoutPrograms` (`userId`,`isActive`);--> statement-breakpoint
CREATE INDEX `ws_user_idx` ON `workoutSessions` (`userId`);--> statement-breakpoint
CREATE INDEX `ws_user_date_idx` ON `workoutSessions` (`userId`,`date`);--> statement-breakpoint
CREATE INDEX `ws_program_idx` ON `workoutSessions` (`programId`);