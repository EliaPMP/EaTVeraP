CREATE TABLE `avoidedIngredients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`ingredient` varchar(255) NOT NULL,
	`reason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `avoidedIngredients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `productFavorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`barcode` varchar(128),
	`productName` text NOT NULL,
	`brand` varchar(255),
	`imageUrl` text,
	`healthScore` int NOT NULL,
	`grade` varchar(2) NOT NULL,
	`category` varchar(512),
	`savedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `productFavorites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scanHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`barcode` varchar(128),
	`productName` text NOT NULL,
	`brand` varchar(255),
	`imageUrl` text,
	`healthScore` int NOT NULL,
	`grade` varchar(2) NOT NULL,
	`category` varchar(512),
	`scannedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scanHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `user_idx` ON `avoidedIngredients` (`userId`);--> statement-breakpoint
CREATE INDEX `user_ingredient_idx` ON `avoidedIngredients` (`userId`,`ingredient`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `productFavorites` (`userId`);--> statement-breakpoint
CREATE INDEX `user_barcode_idx` ON `productFavorites` (`userId`,`barcode`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `scanHistory` (`userId`);--> statement-breakpoint
CREATE INDEX `user_scanned_idx` ON `scanHistory` (`userId`,`scannedAt`);