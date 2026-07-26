import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const campaigns = sqliteTable("campaigns", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  adminToken: text("admin_token").notNull(),
  creatorUserId: integer("creator_user_id"),
  title: text("title").notNull(),
  question: text("question").notNull(),
  offerTitle: text("offer_title").notNull().default(""),
  offerDescription: text("offer_description").notNull().default(""),
  offerUrl: text("offer_url").notNull().default(""),
  offerButton: text("offer_button").notNull().default("Conhecer a oferta"),
  hideResults: integer("hide_results", { mode: "boolean" }).notNull().default(true),
  closed: integer("closed", { mode: "boolean" }).notNull().default(false),
  feedbackOpen: integer("feedback_open", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const options = sqliteTable("options", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id),
  name: text("name").notNull(),
  category: text("category").notNull(),
  price: text("price").notNull(),
  position: integer("position").notNull(),
});

export const participants = sqliteTable("participants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id),
  voterId: text("voter_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, table => ({ uniqueEmail: uniqueIndex("one_email_per_campaign").on(table.campaignId, table.email) }));

export const votes = sqliteTable("votes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id),
  optionId: integer("option_id").notNull().references(() => options.id),
  category: text("category").notNull().default(""),
  voterId: text("voter_id").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, table => ({ oneVote: uniqueIndex("one_vote_per_category").on(table.campaignId, table.voterId, table.category) }));

export const raffles = sqliteTable("raffles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  adminToken: text("admin_token").notNull(),
  creatorUserId: integer("creator_user_id"),
  title: text("title").notNull(),
  prizeTitle: text("prize_title").notNull().default(""),
  prizeDescription: text("prize_description").notNull().default(""),
  winnersCount: integer("winners_count").notNull().default(1),
  closed: integer("closed", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const raffleEntries = sqliteTable("raffle_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  raffleId: integer("raffle_id").notNull().references(() => raffles.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  isWinner: integer("is_winner", { mode: "boolean" }).notNull().default(false),
  winnerPosition: integer("winner_position"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, table => ({ uniqueEmail: uniqueIndex("one_email_per_raffle").on(table.raffleId, table.email) }));

export const raffleWinnerHistory = sqliteTable("raffle_winner_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  raffleId: integer("raffle_id").notNull().references(() => raffles.id),
  drawId: text("draw_id").notNull(),
  entryId: integer("entry_id").references(() => raffleEntries.id),
  winnerName: text("winner_name").notNull(),
  position: integer("position").notNull(),
  drawnAt: text("drawn_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  company: text("company").notNull().default(""),
  subscriptionStatus: text("subscription_status").notNull().default("inactive"),
  subscriptionExpiresAt: text("subscription_expires_at"),
  mpSubscriptionId: text("mp_subscription_id").notNull().default(""),
  totalPaidCents: integer("total_paid_cents").notNull().default(0),
  isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const sessions = sqliteTable("sessions", {
  token: text("token").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const loginRateLimits = sqliteTable("login_rate_limits", {
  key: text("key").primaryKey(),
  failures: integer("failures").notNull().default(0),
  windowStartedAt: text("window_started_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  blockedUntil: text("blocked_until"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  provider: text("provider").notNull().default("mercado_pago"),
  externalReference: text("external_reference").notNull().unique(),
  providerPreferenceId: text("provider_preference_id").notNull().default(""),
  providerPaymentId: text("provider_payment_id").notNull().default(""),
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").notNull().default("BRL"),
  status: text("status").notNull().default("created"),
  approvedAt: text("approved_at"),
  accessGrantedAt: text("access_granted_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const rooms = sqliteTable("rooms", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  hostKey: text("host_key").notNull(),
  creatorUserId: integer("creator_user_id"),
  status: text("status").notNull().default("lobby"),
  questionIndex: integer("question_index").notNull().default(-1),
  startedAt: integer("started_at"),
  createdAt: integer("created_at").notNull(),
});

export const quizConfigs = sqliteTable("quiz_configs", {
  roomId: integer("room_id").primaryKey(),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  questionsJson: text("questions_json"),
  musicTrack: text("music_track").notNull().default("tic-tac-quiz"),
  musicScope: text("music_scope").notNull().default("all"),
});

export const savedQuizzes = sqliteTable("saved_quizzes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  questionsJson: text("questions_json").notNull(),
  musicTrack: text("music_track").notNull().default("tic-tac-quiz"),
  musicScope: text("music_scope").notNull().default("all"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, table => ({ uniqueUserTitle: uniqueIndex("saved_quiz_user_title").on(table.userId, table.title) }));

export const players = sqliteTable("players", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  roomId: integer("room_id").notNull(),
  playerKey: text("player_key").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().default(""),
  score: integer("score").notNull().default(0),
  joinedAt: integer("joined_at").notNull(),
}, table => ({ uniqueName: uniqueIndex("player_room_name").on(table.roomId, table.name) }));

export const quizAnswers = sqliteTable("answers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  roomId: integer("room_id").notNull(),
  playerId: integer("player_id").notNull(),
  questionIndex: integer("question_index").notNull(),
  option: integer("option").notNull(),
  correct: integer("correct", { mode: "boolean" }).notNull(),
  points: integer("points").notNull(),
  answeredAt: integer("answered_at").notNull(),
}, table => ({ oneAnswer: uniqueIndex("one_answer_per_question").on(table.roomId, table.playerId, table.questionIndex) }));

export const feedback = sqliteTable("feedback", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id),
  optionId: integer("option_id").notNull().references(() => options.id),
  category: text("category").notNull(),
  voterId: text("voter_id").notNull(),
  comment: text("comment").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, table => ({ oneOpinion: uniqueIndex("one_opinion_per_category").on(table.campaignId, table.voterId, table.category) }));
