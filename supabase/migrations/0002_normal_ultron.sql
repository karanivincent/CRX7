ALTER TABLE "draw" ADD COLUMN "current_stage" text DEFAULT 'IDLE';--> statement-breakpoint
ALTER TABLE "draw" ADD COLUMN "current_draw_number" integer DEFAULT 0;