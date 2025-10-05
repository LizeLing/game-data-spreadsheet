/**
 * Game Data Types
 * 게임 데이터 특화 타입 정의
 */

// Common Game Entity
export interface GameEntity {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Item Types
export type ItemType =
  | 'weapon'
  | 'armor'
  | 'accessory'
  | 'consumable'
  | 'material'
  | 'quest'
  | 'key';

export type Rarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary'
  | 'mythic';

export interface GameItem extends GameEntity {
  type: ItemType;
  rarity: Rarity;
  level?: number;
  maxStack?: number;
  price?: {
    buy?: number;
    sell?: number;
  };
  stats?: Record<string, number>;
  effects?: Array<{
    type: string;
    value: number;
    duration?: number;
  }>;
  requirements?: {
    level?: number;
    class?: string[];
    stats?: Record<string, number>;
  };
}

// Character Types
export type CharacterClass =
  | 'warrior'
  | 'mage'
  | 'rogue'
  | 'cleric'
  | 'ranger'
  | 'paladin';

export interface CharacterStats {
  hp: number;
  mp: number;
  attack: number;
  defense: number;
  magicAttack: number;
  magicDefense: number;
  speed: number;
  luck: number;
}

export interface GameCharacter extends GameEntity {
  class: CharacterClass;
  level: number;
  baseStats: CharacterStats;
  growth?: Partial<CharacterStats>;
  skills?: string[]; // skill IDs
  equipment?: {
    weapon?: string;
    armor?: string;
    accessory?: string[];
  };
}

// Skill Types
export type SkillType =
  | 'active'
  | 'passive'
  | 'ultimate'
  | 'support'
  | 'buff'
  | 'debuff';

export type TargetType =
  | 'self'
  | 'single_enemy'
  | 'all_enemies'
  | 'single_ally'
  | 'all_allies'
  | 'all';

export interface GameSkill extends GameEntity {
  type: SkillType;
  targetType: TargetType;
  manaCost?: number;
  cooldown?: number;
  damage?: number | string; // Can be formula
  healing?: number | string; // Can be formula
  effects?: Array<{
    type: string;
    value: number;
    duration?: number;
    chance?: number;
  }>;
  requirements?: {
    level?: number;
    class?: CharacterClass[];
    skills?: string[]; // prerequisite skills
  };
}

// Quest Types
export type QuestType = 'main' | 'side' | 'daily' | 'weekly' | 'event';

export interface GameQuest extends GameEntity {
  type: QuestType;
  level?: number;
  objectives?: Array<{
    type: 'kill' | 'collect' | 'talk' | 'reach';
    target?: string;
    count?: number;
  }>;
  rewards?: {
    exp?: number;
    gold?: number;
    items?: Array<{
      id: string;
      count: number;
    }>;
  };
  prerequisites?: {
    level?: number;
    quests?: string[];
    items?: string[];
  };
}

// Enemy/Monster Types
export interface GameEnemy extends GameEntity {
  level: number;
  stats: CharacterStats;
  skills?: string[];
  drops?: Array<{
    itemId: string;
    chance: number;
    minCount?: number;
    maxCount?: number;
  }>;
  exp?: number;
  gold?: number;
}

// Balance Configuration
export interface BalanceConfig {
  id: string;
  category: string;
  parameter: string;
  value: number | string;
  description?: string;
  tags?: string[];
}
