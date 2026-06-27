import { db } from "../db/index";
import { roles, userRoles } from "../db/schema";
import { eq } from "drizzle-orm";

export class RoleRepository {
  static async findByName(name: string) {
    const result = await db.select().from(roles).where(eq(roles.name, name)).limit(1);
    return result[0];
  }

  static async assignRoleToUser(userId: string, roleId: string) {
    const [assigned] = await db.insert(userRoles).values({
      userId,
      roleId,
    }).returning();
    return assigned;
  }

  static async findRolesByUserId(userId: string) {
    const result = await db
      .select({
        id: roles.id,
        name: roles.name,
        description: roles.description,
      })
      .from(roles)
      .innerJoin(userRoles, eq(roles.id, userRoles.roleId))
      .where(eq(userRoles.userId, userId));
    return result;
  }

  static async createRole(id: string, name: string, description?: string) {
    const [newRole] = await db.insert(roles).values({
      id,
      name,
      description: description || null,
    }).returning();
    return newRole;
  }
}
