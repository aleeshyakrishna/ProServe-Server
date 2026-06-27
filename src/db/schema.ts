import { pgTable, text, boolean, real, timestamp, integer } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").$type<"USER" | "PROVIDER" | "ADMIN">().default("USER").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  rating: real("rating"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const services = pgTable("services", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").$type<"PLUMBING" | "ELECTRICAL" | "CLEANING" | "SALON" | "CONSULTATION">().notNull(),
  price: integer("price").notNull(),
  providerId: text("provider_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  isAvailable: boolean("is_available").default(true).notNull(),
});

export const bookings = pgTable("bookings", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  serviceId: text("service_id").references(() => services.id, { onDelete: "cascade" }).notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  status: text("status").$type<"PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED">().default("PENDING").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
