CREATE TYPE "public"."rider_vehicle_type" AS ENUM('bicycle', 'motorcycle', 'car', 'van');--> statement-breakpoint
CREATE TABLE "rider_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"vehicle_type" "rider_vehicle_type" NOT NULL,
	"vehicle_make" varchar(100),
	"vehicle_model" varchar(100),
	"vehicle_color" varchar(50),
	"plate_number" varchar(30),
	"license_number" varchar(100),
	"is_available" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rider_profiles" ADD CONSTRAINT "rider_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "rider_profiles_user_id_unique" ON "rider_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "rider_profiles_plate_number_unique" ON "rider_profiles" USING btree ("plate_number");--> statement-breakpoint
CREATE UNIQUE INDEX "rider_profiles_license_number_unique" ON "rider_profiles" USING btree ("license_number");--> statement-breakpoint
CREATE INDEX "rider_profiles_is_available_idx" ON "rider_profiles" USING btree ("is_available");