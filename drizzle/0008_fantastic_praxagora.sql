ALTER TABLE `cachedProducts` ADD `imageSource` varchar(64);--> statement-breakpoint
ALTER TABLE `cachedProducts` ADD `imageCacheTime` timestamp;--> statement-breakpoint
ALTER TABLE `cachedProducts` ADD `hasRealImage` smallint DEFAULT 0 NOT NULL;