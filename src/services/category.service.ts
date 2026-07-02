import { db } from "../db/index";
import { categories } from "../db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export interface CategoryData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconName: string | null;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const getCategoryById = async (id: string): Promise<CategoryData | undefined> => {
  const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return result[0] as CategoryData | undefined;
};

export const getAllCategories = async (): Promise<CategoryData[]> => {
  const result = await db.select().from(categories);
  return result as CategoryData[];
};

export const createCategory = async (data: {
  name: string;
  slug: string;
  description?: string;
  iconName?: string;
  imageUrl?: string;
}): Promise<CategoryData> => {
  const id = `cat_${crypto.randomUUID().substring(0, 8)}`;
  const newCat = {
    id,
    name: data.name.toUpperCase(),
    slug: data.slug.toLowerCase(),
    description: data.description || null,
    iconName: data.iconName || null,
    imageUrl: data.imageUrl || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.insert(categories).values(newCat);
  return newCat;
};

export const updateCategory = async (
  id: string,
  data: Partial<Omit<CategoryData, "id" | "createdAt" | "updatedAt">>
): Promise<CategoryData | undefined> => {
  const existing = await getCategoryById(id);
  if (!existing) return undefined;

  const updatePayload = {
    ...data,
    ...(data.name ? { name: data.name.toUpperCase() } : {}),
    ...(data.slug ? { slug: data.slug.toLowerCase() } : {}),
    updatedAt: new Date(),
  };

  await db.update(categories).set(updatePayload).where(eq(categories.id, id));
  return getCategoryById(id);
};

export const deleteCategory = async (id: string): Promise<boolean> => {
  const existing = await getCategoryById(id);
  if (!existing) return false;

  await db.delete(categories).where(eq(categories.id, id));
  return true;
};
