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
  status: text("status").notNull().default("scheduled"), // 'scheduled', 'active', 'completed', 'cancelled'
  totalParticipants: integer("total_participants").default(0),
  totalPrizePool: numeric("total_prize_pool", { precision: 20, scale: 9 }).default("0"),
  winnersCount: integer("winners_count").default(0),
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
  participantId: uuid("participant_id").notNull().references(() => participantTable.id),
  walletAddress: text("wallet_address").notNull(),
  prizeAmount: numeric("prize_amount", { precision: 20, scale: 9 }).notNull(),
  position: integer("position").notNull(), // 1st, 2nd, 3rd place etc.
  transactionHash: text("transaction_hash"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
