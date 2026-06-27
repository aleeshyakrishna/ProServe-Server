import { db } from "../db/index";
import { profiles } from "../db/schema";
import { eq } from "drizzle-orm";

export interface CreateProfileDTO {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  avatar?: string;
  bio?: string;
  city?: string;
  country?: string;
}

export class ProfileRepository {
  static async findByUserId(userId: string) {
    const result = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
    return result[0];
  }

  static async create(data: CreateProfileDTO) {
    const [newProfile] = await db.insert(profiles).values({
      id: data.id,
      userId: data.userId,
      fullName: data.fullName,
      phone: data.phone,
      avatar: data.avatar || null,
      bio: data.bio || null,
      city: data.city || null,
      country: data.country || null,
    }).returning();
    return newProfile;
  }

  static async updateByUserId(userId: string, data: Partial<typeof profiles.$inferInsert>) {
    const [updatedProfile] = await db
      .update(profiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(profiles.userId, userId))
      .returning();
    return updatedProfile;
  }
}
