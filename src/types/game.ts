export interface PlayerData {
    class: string;
    killed: number;
    gold: number;
    hp?: number;
    owner?: string;
    mint?: string;
    exp?: number;
}

export interface BattleLog {
    id: string;
    monster: string;
    goldEarned: number;
    expEarned: number;
    lostHp: number;
    timestamp: number;
    txSignature: string;
}

export type Monster = 'Slime' | 'Goblin' | 'Orc' | 'Wolf';

export const MONSTERS: Monster[] = ['Slime', 'Goblin', 'Orc', 'Wolf'];

export interface CharacterStats {
    atk: number;
    agi: number;
    vit: number;
    int: number;
}

export const DEFAULT_CHARACTER_STATS: Record<string, CharacterStats> = {
    Warrior: { atk: 5, agi: 5, vit: 5, int: 0 },
    Mage: { atk: 1, agi: 3, vit: 4, int: 7 },
    Archer: { atk: 4, agi: 6, vit: 2, int: 3 },
    Rogue: { atk: 4, agi: 7, vit: 4, int: 0 }
};
