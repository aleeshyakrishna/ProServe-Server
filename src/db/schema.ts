import { pgTable, text, boolean, real, timestamp, integer, primaryKey } from "drizzle-orm/pg-core";

// ------ Users Table -------------------------------------------
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  supabaseUserId: text("supabase_user_id").unique(), // Supabase Auth User ID reference
  email: text("email").notNull().unique(),
  status: text("status").default("active").notNull(), // e.g. "active", "suspended"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  
  // Backwards compatibility columns for existing logic
  name: text("name").notNull(),
  role: text("role").$type<"USER" | "PROVIDER" | "ADMIN">().default("USER").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  rating: real("rating"),
});

// ------ Profiles Table -----------------------------------------
export const profiles = pgTable("profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  avatar: text("avatar"),
  bio: text("bio"),
  city: text("city"),
  country: text("country"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ------ Roles Table -------------------------------------------
export const roles = pgTable("roles", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(), // "CUSTOMER" | "SERVICE_PROVIDER" | "ADMIN"
  description: text("description"),
});

// ------ User Roles Table (Many-to-Many Join Table) -------------
export const userRoles = pgTable("user_roles", {
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  roleId: text("role_id").references(() => roles.id, { onDelete: "cascade" }).notNull(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.roleId] })
]);

// ------ Services Table (Existing Table Retained) ----------------
export const services = pgTable("services", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").$type<"PLUMBING" | "ELECTRICAL" | "CLEANING" | "SALON" | "CONSULTATION">().notNull(),
  price: integer("price").notNull(),
  providerId: text("provider_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  isAvailable: boolean("is_available").default(true).notNull(),
});

// ------ Bookings Table (Existing Table Retained) ---------------
export const bookings = pgTable("bookings", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  serviceId: text("service_id").references(() => services.id, { onDelete: "cascade" }).notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  status: text("status").$type<"PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED">().default("PENDING").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ------ Categories Table (New Table) --------------------------
export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(), // e.g. "PLUMBING", "ELECTRICAL", "CLEANING", "SALON", "CONSULTATION"
  slug: text("slug").notNull().unique(), // e.g. "plumbing", "electrical"
  description: text("description"),
  iconName: text("icon_name"), // e.g. "Droplets", "Zap"
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
