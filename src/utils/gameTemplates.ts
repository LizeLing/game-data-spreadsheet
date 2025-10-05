/**
 * Game Data Templates
 * 게임 데이터를 위한 사전 정의된 템플릿
 */

import type { CellType, ValidationRule } from '@types';

export type GameDataTemplateType =
  | 'character'
  | 'item'
  | 'skill'
  | 'quest'
  | 'enemy'
  | 'level'
  | 'dialogue'
  | 'localization'
  | 'statProgression';

export interface TemplateColumn {
  id: string;
  name: string;
  type: CellType;
  width?: number;
  validation?: ValidationRule;
  options?: string[];
}

export interface GameDataTemplate {
  type: GameDataTemplateType;
  name: string;
  columns: TemplateColumn[];
  sampleData?: Array<Record<string, any>>;
}

// Character Template
export const getCharacterTemplate = (): GameDataTemplate => ({
  type: 'character',
  name: 'Character Data',
  columns: [
    {
      id: 'id',
      name: 'ID',
      type: 'text',
      width: 120,
      validation: { type: 'required', message: 'ID is required' },
    },
    {
      id: 'name',
      name: 'Name',
      type: 'text',
      width: 150,
      validation: { type: 'required', message: 'Name is required' },
    },
    {
      id: 'class',
      name: 'Class',
      type: 'select',
      width: 120,
      options: ['warrior', 'mage', 'rogue', 'cleric', 'ranger', 'paladin'],
    },
    {
      id: 'level',
      name: 'Level',
      type: 'number',
      width: 80,
      validation: {
        type: 'range',
        params: { min: 1, max: 100 },
      },
    },
    {
      id: 'hp',
      name: 'HP',
      type: 'number',
      width: 100,
      validation: {
        type: 'range',
        params: { min: 1, max: 10000 },
        message: 'HP must be between 1 and 10000',
      },
    },
    {
      id: 'mp',
      name: 'MP',
      type: 'number',
      width: 100,
      validation: {
        type: 'range',
        params: { min: 0, max: 5000 },
        message: 'MP must be between 0 and 5000',
      },
    },
    {
      id: 'attack',
      name: 'Attack',
      type: 'number',
      width: 100,
      validation: {
        type: 'range',
        params: { min: 0, max: 1000 },
        message: 'Attack must be between 0 and 1000',
      },
    },
    {
      id: 'defense',
      name: 'Defense',
      type: 'number',
      width: 100,
      validation: {
        type: 'range',
        params: { min: 0, max: 1000 },
        message: 'Defense must be between 0 and 1000',
      },
    },
    {
      id: 'description',
      name: 'Description',
      type: 'text',
      width: 250,
    },
  ],
});

// Item Template
export const getItemTemplate = (): GameDataTemplate => ({
  type: 'item',
  name: 'Item Data',
  columns: [
    {
      id: 'id',
      name: 'ID',
      type: 'text',
      width: 120,
      validation: { type: 'required', message: 'ID is required' },
    },
    {
      id: 'name',
      name: 'Name',
      type: 'text',
      width: 150,
      validation: { type: 'required', message: 'Name is required' },
    },
    {
      id: 'type',
      name: 'Type',
      type: 'select',
      width: 120,
      options: ['weapon', 'armor', 'accessory', 'consumable', 'material'],
    },
    {
      id: 'rarity',
      name: 'Rarity',
      type: 'select',
      width: 120,
      options: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    },
    {
      id: 'level',
      name: 'Level',
      type: 'number',
      width: 80,
    },
    {
      id: 'buyPrice',
      name: 'Buy Price',
      type: 'number',
      width: 100,
    },
    {
      id: 'sellPrice',
      name: 'Sell Price',
      type: 'number',
      width: 100,
    },
    {
      id: 'attack',
      name: 'Attack',
      type: 'number',
      width: 100,
    },
    {
      id: 'defense',
      name: 'Defense',
      type: 'number',
      width: 100,
    },
    {
      id: 'description',
      name: 'Description',
      type: 'text',
      width: 250,
    },
  ],
});

// Skill Template
export const getSkillTemplate = (): GameDataTemplate => ({
  type: 'skill',
  name: 'Skill Data',
  columns: [
    {
      id: 'id',
      name: 'ID',
      type: 'text',
      width: 120,
      validation: { type: 'required', message: 'ID is required' },
    },
    {
      id: 'name',
      name: 'Name',
      type: 'text',
      width: 150,
      validation: { type: 'required', message: 'Name is required' },
    },
    {
      id: 'type',
      name: 'Type',
      type: 'select',
      width: 120,
      options: ['active', 'passive', 'ultimate', 'support'],
    },
    {
      id: 'manaCost',
      name: 'Mana Cost',
      type: 'number',
      width: 100,
    },
    {
      id: 'cooldown',
      name: 'Cooldown',
      type: 'number',
      width: 100,
    },
    {
      id: 'damage',
      name: 'Damage',
      type: 'text',
      width: 150,
    },
    {
      id: 'description',
      name: 'Description',
      type: 'text',
      width: 250,
    },
  ],
});

// Quest Template
export const getQuestTemplate = (): GameDataTemplate => ({
  type: 'quest',
  name: 'Quest Data',
  columns: [
    {
      id: 'id',
      name: 'ID',
      type: 'text',
      width: 120,
      validation: { type: 'required', message: 'ID is required' },
    },
    {
      id: 'name',
      name: 'Name',
      type: 'text',
      width: 200,
      validation: { type: 'required', message: 'Name is required' },
    },
    {
      id: 'type',
      name: 'Type',
      type: 'select',
      width: 120,
      options: ['main', 'side', 'daily', 'event'],
    },
    {
      id: 'level',
      name: 'Level',
      type: 'number',
      width: 80,
    },
    {
      id: 'rewardExp',
      name: 'Reward EXP',
      type: 'number',
      width: 120,
    },
    {
      id: 'rewardGold',
      name: 'Reward Gold',
      type: 'number',
      width: 120,
    },
    {
      id: 'description',
      name: 'Description',
      type: 'text',
      width: 300,
    },
  ],
});

// Enemy Template
export const getEnemyTemplate = (): GameDataTemplate => ({
  type: 'enemy',
  name: 'Enemy Data',
  columns: [
    {
      id: 'id',
      name: 'ID',
      type: 'text',
      width: 100,
      validation: { type: 'required', message: 'ID is required' },
    },
    {
      id: 'name',
      name: 'Name',
      type: 'text',
      width: 150,
      validation: { type: 'required', message: 'Name is required' },
    },
    {
      id: 'level',
      name: 'Level',
      type: 'number',
      width: 80,
      validation: {
        type: 'range',
        params: { min: 1, max: 100 },
      },
    },
    {
      id: 'type',
      name: 'Type',
      type: 'select',
      width: 120,
      options: ['normal', 'elite', 'boss', 'miniboss'],
    },
    {
      id: 'hp',
      name: 'HP',
      type: 'number',
      width: 100,
    },
    {
      id: 'attack',
      name: 'Attack',
      type: 'number',
      width: 100,
    },
    {
      id: 'defense',
      name: 'Defense',
      type: 'number',
      width: 100,
    },
    {
      id: 'speed',
      name: 'Speed',
      type: 'number',
      width: 80,
    },
    {
      id: 'exp',
      name: 'EXP',
      type: 'number',
      width: 100,
    },
    {
      id: 'goldDrop',
      name: 'Gold Drop',
      type: 'number',
      width: 100,
    },
    {
      id: 'abilities',
      name: 'Abilities',
      type: 'text',
      width: 200,
    },
  ],
  sampleData: [
    {
      id: 'enemy_001',
      name: 'Goblin Scout',
      level: 5,
      type: 'normal',
      hp: 150,
      attack: 25,
      defense: 10,
      speed: 8,
      exp: 50,
      goldDrop: 10,
      abilities: 'Quick Strike',
    },
  ],
});

// Level/Stage Template
export const getLevelTemplate = (): GameDataTemplate => ({
  type: 'level',
  name: 'Level/Stage Data',
  columns: [
    {
      id: 'id',
      name: 'Level ID',
      type: 'text',
      width: 100,
      validation: { type: 'required', message: 'ID is required' },
    },
    {
      id: 'name',
      name: 'Level Name',
      type: 'text',
      width: 180,
      validation: { type: 'required', message: 'Name is required' },
    },
    {
      id: 'world',
      name: 'World',
      type: 'select',
      width: 120,
      options: ['grassland', 'desert', 'snow', 'volcano', 'dungeon'],
    },
    {
      id: 'recommendedLevel',
      name: 'Rec. Level',
      type: 'number',
      width: 100,
    },
    {
      id: 'enemies',
      name: 'Enemies',
      type: 'text',
      width: 200,
    },
    {
      id: 'objectives',
      name: 'Objectives',
      type: 'text',
      width: 250,
    },
    {
      id: 'rewards',
      name: 'Rewards',
      type: 'text',
      width: 200,
    },
  ],
  sampleData: [
    {
      id: 'level_001',
      name: 'Goblin Hideout',
      world: 'grassland',
      recommendedLevel: 5,
      enemies: 'Goblin Scout x3, Goblin Warrior x1',
      objectives: 'Defeat all goblins',
      rewards: '200 EXP, 50 Gold, Iron Sword',
    },
  ],
});

// Dialogue Template
export const getDialogueTemplate = (): GameDataTemplate => ({
  type: 'dialogue',
  name: 'Dialogue/Narrative Data',
  columns: [
    {
      id: 'id',
      name: 'Line ID',
      type: 'text',
      width: 100,
      validation: { type: 'required', message: 'ID is required' },
    },
    {
      id: 'character',
      name: 'Character',
      type: 'text',
      width: 120,
    },
    {
      id: 'emotion',
      name: 'Emotion',
      type: 'select',
      width: 100,
      options: ['neutral', 'happy', 'sad', 'angry', 'surprised', 'fearful'],
    },
    {
      id: 'text',
      name: 'Dialogue Text',
      type: 'text',
      width: 400,
    },
    {
      id: 'nextLine',
      name: 'Next Line',
      type: 'text',
      width: 100,
    },
    {
      id: 'choices',
      name: 'Player Choices',
      type: 'text',
      width: 200,
    },
  ],
  sampleData: [
    {
      id: 'dlg_001',
      character: 'Village Elder',
      emotion: 'neutral',
      text: 'Welcome, brave adventurer. Our village needs your help.',
      nextLine: 'dlg_002',
      choices: '',
    },
  ],
});

// Localization Template
export const getLocalizationTemplate = (): GameDataTemplate => ({
  type: 'localization',
  name: 'Localization Data',
  columns: [
    {
      id: 'key',
      name: 'Translation Key',
      type: 'text',
      width: 150,
      validation: { type: 'required', message: 'Key is required' },
    },
    {
      id: 'en',
      name: 'English',
      type: 'text',
      width: 200,
    },
    {
      id: 'ko',
      name: 'Korean',
      type: 'text',
      width: 200,
    },
    {
      id: 'ja',
      name: 'Japanese',
      type: 'text',
      width: 200,
    },
    {
      id: 'zh',
      name: 'Chinese',
      type: 'text',
      width: 200,
    },
    {
      id: 'context',
      name: 'Context',
      type: 'text',
      width: 150,
    },
  ],
  sampleData: [
    {
      key: 'ui.menu.start',
      en: 'Start Game',
      ko: '게임 시작',
      ja: 'ゲーム開始',
      zh: '开始游戏',
      context: 'Main menu button',
    },
  ],
});

// Stat Progression Template
export const getStatProgressionTemplate = (): GameDataTemplate => ({
  type: 'statProgression',
  name: 'Stat Progression Data',
  columns: [
    {
      id: 'level',
      name: 'Level',
      type: 'number',
      width: 80,
      validation: {
        type: 'range',
        params: { min: 1, max: 100 },
      },
    },
    {
      id: 'expRequired',
      name: 'EXP Required',
      type: 'number',
      width: 120,
    },
    {
      id: 'hpBase',
      name: 'Base HP',
      type: 'number',
      width: 100,
    },
    {
      id: 'mpBase',
      name: 'Base MP',
      type: 'number',
      width: 100,
    },
    {
      id: 'attackBase',
      name: 'Base Attack',
      type: 'number',
      width: 100,
    },
    {
      id: 'defenseBase',
      name: 'Base Defense',
      type: 'number',
      width: 100,
    },
    {
      id: 'speedBase',
      name: 'Base Speed',
      type: 'number',
      width: 100,
    },
    {
      id: 'skillPoints',
      name: 'Skill Points',
      type: 'number',
      width: 100,
    },
  ],
  sampleData: [
    {
      level: 1,
      expRequired: 0,
      hpBase: 100,
      mpBase: 50,
      attackBase: 10,
      defenseBase: 5,
      speedBase: 10,
      skillPoints: 1,
    },
    {
      level: 2,
      expRequired: 100,
      hpBase: 110,
      mpBase: 55,
      attackBase: 12,
      defenseBase: 6,
      speedBase: 11,
      skillPoints: 1,
    },
  ],
});

// Template factory
export const getTemplate = (type: GameDataTemplateType): GameDataTemplate => {
  switch (type) {
    case 'character':
      return getCharacterTemplate();
    case 'item':
      return getItemTemplate();
    case 'skill':
      return getSkillTemplate();
    case 'quest':
      return getQuestTemplate();
    case 'enemy':
      return getEnemyTemplate();
    case 'level':
      return getLevelTemplate();
    case 'dialogue':
      return getDialogueTemplate();
    case 'localization':
      return getLocalizationTemplate();
    case 'statProgression':
      return getStatProgressionTemplate();
    default:
      throw new Error(`Unknown template type: ${type}`);
  }
};

// Get all available templates
export const getAllTemplates = (): GameDataTemplate[] => {
  return [
    getCharacterTemplate(),
    getItemTemplate(),
    getSkillTemplate(),
    getQuestTemplate(),
    getEnemyTemplate(),
    getLevelTemplate(),
    getDialogueTemplate(),
    getLocalizationTemplate(),
    getStatProgressionTemplate(),
  ];
};
