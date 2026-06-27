import { db } from "../db/index";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export interface CreateUserDTO {
  id: string;
  supabaseUserId: string;
  email: string;
  name: string;
  role: "USER" | "PROVIDER" | "ADMIN";
  status?: string;
}

export class UserRepository {
  static async findById(id: string) {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  static async findByEmail(email: string) {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  static async findBySupabaseId(supabaseUserId: string) {
    const result = await db.select().from(users).where(eq(users.supabaseUserId, supabaseUserId)).limit(1);
    return result[0];
  }

  static async create(data: CreateUserDTO) {
    const [newUser] = await db.insert(users).values({
      id: data.id,
      supabaseUserId: data.supabaseUserId,
      email: data.email,
      name: data.name,
      role: data.role,
      status: data.status || "active",
      isActive: true,
    }).returning();
    return newUser;
  }

  static async update(id: string, data: Partial<typeof users.$inferInsert>) {
    const [updatedUser] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
}
