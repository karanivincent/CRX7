-- Create distribution_history table for tracking SOL distributions
CREATE TABLE IF NOT EXISTS "distribution_history" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "total_amount" NUMERIC(20,9) NOT NULL,
    "winners_amount" NUMERIC(20,9) NOT NULL,
    "holding_amount" NUMERIC(20,9) NOT NULL,
    "charity_amount" NUMERIC(20,9) NOT NULL,
    "winners_transaction_hash" TEXT,
    "holding_transaction_hash" TEXT,
    "charity_transaction_hash" TEXT,
    "executed_by" TEXT NOT NULL,
    "executed_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    "status" TEXT DEFAULT 'pending' NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_distribution_history_executed_at" ON "distribution_history" ("executed_at");
CREATE INDEX IF NOT EXISTS "idx_distribution_history_status" ON "distribution_history" ("status");
CREATE INDEX IF NOT EXISTS "idx_distribution_history_executed_by" ON "distribution_history" ("executed_by");

-- Add comments for documentation
COMMENT ON TABLE "distribution_history" IS 'Tracks SOL distribution transactions to winners, holding wallet, and charity wallet';
COMMENT ON COLUMN "distribution_history"."total_amount" IS 'Total SOL amount distributed in this transaction';
COMMENT ON COLUMN "distribution_history"."winners_amount" IS 'Amount sent to winners (50% of total)';
COMMENT ON COLUMN "distribution_history"."holding_amount" IS 'Amount sent to holding wallet (40% of total)';
COMMENT ON COLUMN "distribution_history"."charity_amount" IS 'Amount sent to charity wallet (10% of total)';
COMMENT ON COLUMN "distribution_history"."executed_by" IS 'Admin wallet address that executed the distribution';