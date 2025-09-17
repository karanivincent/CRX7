import { pgTable, text, uuid, timestamp, numeric, boolean, integer } from "drizzle-orm/pg-core";

export const profileTable = pgTable("profile", {
  id: uuid("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
});

export const drawTable = pgTable("draw", {
  id: uuid("id").primaryKey(),
  drawNumber: integer("draw_number").notNull().unique(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  executedAt: timestamp("executed_at"),
  completedAt: timestamp("completed_at"),
  status: text("status").notNull().default("scheduled"), // 'scheduled', 'active', 'completed', 'cancelled'
  // Final round data (only set on completion)
  totalPrizePool: numeric("total_prize_pool", { precision: 20, scale: 9 }),
  roundDurationMs: integer("round_duration_ms"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const participantTable = pgTable("participant", {
  id: uuid("id").primaryKey(),
  drawId: uuid("draw_id").notNull().references(() => drawTable.id),
  walletAddress: text("wallet_address").notNull(),
  tokenBalance: numeric("token_balance", { precision: 20, scale: 9 }).notNull(),
  animalName: text("animal_name").notNull(),
  animalEmoji: text("animal_emoji").notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const winnerTable = pgTable("winner", {
  id: uuid("id").primaryKey(),
  drawId: uuid("draw_id").notNull().references(() => drawTable.id),
  participantId: uuid("participant_id").references(() => participantTable.id), // Made optional
  walletAddress: text("wallet_address").notNull(),
  prizeAmount: numeric("prize_amount", { precision: 20, scale: 9 }).notNull(),
  // New fields for better tracking
  drawSequence: integer("draw_sequence").notNull(), // Which draw (1-7) this winner came from
  sequenceNumber: integer("sequence_number").notNull(), // Overall order (1st, 2nd, 3rd winner)
  animalName: text("animal_name").notNull(),
  animalEmoji: text("animal_emoji").notNull(),
  wonAt: timestamp("won_at").notNull(),
  // Payment tracking
  transactionHash: text("transaction_hash"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const distributionHistoryTable = pgTable("distribution_history", {
  id: uuid("id").primaryKey(),
  totalAmount: numeric("total_amount", { precision: 20, scale: 9 }).notNull(),
  winnersAmount: numeric("winners_amount", { precision: 20, scale: 9 }).notNull(),
  holdingAmount: numeric("holding_amount", { precision: 20, scale: 9 }).notNull(),
  charityAmount: numeric("charity_amount", { precision: 20, scale: 9 }).notNull(),
  // Round reference
  roundId: uuid("round_id").references(() => drawTable.id),
  roundNumber: integer("round_number"), // Denormalized for easier querying
  // Transaction tracking
  winnersTransactionHash: text("winners_transaction_hash"),
  holdingTransactionHash: text("holding_transaction_hash"),
  charityTransactionHash: text("charity_transaction_hash"),
  // Enhanced failure tracking
  failureReason: text("failure_reason"),
  failedTransactions: text("failed_transactions"), // JSON array of failed transaction types
  retryCount: integer("retry_count").default(0),
  lastRetryAt: timestamp("last_retry_at"),
  // Metadata
  executedBy: text("executed_by").notNull(), // admin wallet address
  executedAt: timestamp("executed_at").defaultNow().notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'completed', 'failed', 'partial_success', 'retrying'
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
