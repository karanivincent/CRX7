CREATE TABLE IF NOT EXISTS "draw" (
	"id" uuid PRIMARY KEY NOT NULL,
	"draw_number" integer NOT NULL,
	"scheduled_at" timestamp NOT NULL,
	"executed_at" timestamp,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"total_participants" integer DEFAULT 0,
	"total_prize_pool" numeric(20, 9) DEFAULT '0',
	"winners_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "draw_draw_number_unique" UNIQUE("draw_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "participant" (
	"id" uuid PRIMARY KEY NOT NULL,
	"draw_id" uuid NOT NULL,
	"wallet_address" text NOT NULL,
	"token_balance" numeric(20, 9) NOT NULL,
	"animal_name" text NOT NULL,
	"animal_emoji" text NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "winner" (
	"id" uuid PRIMARY KEY NOT NULL,
	"draw_id" uuid NOT NULL,
	"participant_id" uuid NOT NULL,
	"wallet_address" text NOT NULL,
	"prize_amount" numeric(20, 9) NOT NULL,
	"position" integer NOT NULL,
	"transaction_hash" text,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "participant" ADD CONSTRAINT "participant_draw_id_draw_id_fk" FOREIGN KEY ("draw_id") REFERENCES "public"."draw"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "winner" ADD CONSTRAINT "winner_draw_id_draw_id_fk" FOREIGN KEY ("draw_id") REFERENCES "public"."draw"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "winner" ADD CONSTRAINT "winner_participant_id_participant_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participant"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
