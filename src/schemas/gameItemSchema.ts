/**
 * Game Item Schema
 * Zod 스키마를 사용한 게임 아이템 검증
 */

import { z } from 'zod';

// Enum schemas
export const ItemTypeSchema = z.enum([
  'weapon',
  'armor',
  'accessory',
  'consumable',
  'material',
  'quest',
  'key',
]);

export const RaritySchema = z.enum([
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
  'mythic',
]);

// Price schema
export const ItemPriceSchema = z
  .object({
    buy: z.number().min(0).optional(),
    sell: z.number().min(0).optional(),
  })
  .refine(
    (data) => {
      if (data.buy !== undefined && data.sell !== undefined) {
        return data.sell <= data.buy;
      }
      return true;
    },
    {
      message: 'Sell price cannot exceed buy price',
    }
  );

// Main Game Item Schema
export const GameItemSchema = z.object({
  id: z.string().min(1, 'Item ID is required'),
  name: z.string().min(1, 'Item name is required').max(100),
  type: ItemTypeSchema,
  rarity: RaritySchema,
  level: z.number().min(1).max(100).optional(),
  maxStack: z.number().min(1).max(9999).default(1).optional(),
  buyPrice: z.number().min(0).optional(),
  sellPrice: z.number().min(0).optional(),
  attack: z.number().min(0).optional(),
  defense: z.number().min(0).optional(),
  magicAttack: z.number().min(0).optional(),
  magicDefense: z.number().min(0).optional(),
  description: z.string().max(500).optional(),
});

// Type inference
export type GameItemSchemaType = z.infer<typeof GameItemSchema>;
export type ItemType = z.infer<typeof ItemTypeSchema>;
export type Rarity = z.infer<typeof RaritySchema>;

// Parse helper
export const parseGameItem = (data: unknown) => {
  return GameItemSchema.parse(data);
};

// Safe parse helper
export const safeParseGameItem = (data: unknown) => {
  const result = GameItemSchema.safeParse(data);
  if (result.success) {
    return {
      success: true as const,
      data: result.data,
      errors: [] as string[],
    };
  }
  return {
    success: false as const,
    data: null,
    errors: result.error.issues.map((e: z.ZodIssue) => e.message),
  };
};
