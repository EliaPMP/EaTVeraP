CREATE TABLE `nutritionGoals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`nutrientKey` varchar(64) NOT NULL,
	`nutrientLabel` varchar(128) NOT NULL,
	`targetType` enum('min','max') NOT NULL,
	`targetValue` int NOT NULL,
	`unit` varchar(16) NOT NULL DEFAULT 'g',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `nutritionGoals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `user_idx` ON `nutritionGoals` (`userId`);--> statement-breakpoint
CREATE INDEX `user_nutrient_idx` ON `nutritionGoals` (`userId`,`nutrientKey`);