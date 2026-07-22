CREATE TABLE `ingredientScanCache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`imageUrlHash` varchar(64) NOT NULL,
	`imageUrl` text NOT NULL,
	`ingredientsDetected` int NOT NULL DEFAULT 0,
	`rawIngredientText` text,
	`flaggedIngredients` text,
	`ingredientQuality` enum('good','moderate','poor','unknown') NOT NULL DEFAULT 'unknown',
	`imageQualityOk` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ingredientScanCache_id` PRIMARY KEY(`id`),
	CONSTRAINT `ingredientScanCache_imageUrlHash_unique` UNIQUE(`imageUrlHash`)
);
--> statement-breakpoint
CREATE INDEX `hash_idx` ON `ingredientScanCache` (`imageUrlHash`);