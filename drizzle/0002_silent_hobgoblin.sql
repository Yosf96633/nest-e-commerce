ALTER TABLE "stores" ADD COLUMN "profile_image_url" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "profile_image_public_id" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "cover_image_url" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "cover_image_public_id" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "images" jsonb DEFAULT '[]'::jsonb NOT NULL;