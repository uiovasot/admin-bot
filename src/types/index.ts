export interface FishType {
    name: string;
    chance: number;
    price: number;
    length?: number;
    goodChance?: number;
    type?: 'trash' | 'fish' | 'dino' | 'food';
    rate?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'ultra-legendary' | 'secret';
}

export const rateNames: Record<'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'ultra-legendary' | 'secret', string> = {
    common: '흔함',
    uncommon: '일반',
    rare: '희귀',
    epic: '매우 희귀',
    legendary: '전설',
    'ultra-legendary': '초전설',
    secret: '||숨겨진 물고기||',
};

export interface FishingState {
    isActive: boolean;
    startTime: number;
    biteTime: number;
    waitTime: number;
    fishType: FishType | null;
    userId: string;
    channelId: string;
    bitedAt?: number;
    timers: Timer[];
}

export interface GameConfig {
    terrains: {
        name: string;
        fishTypes: FishType[];
    }[];
    fishWaitTime: {
        min: number;
        max: number;
    };
    fishBiteTime: {
        min: number;
        max: number;
    };
    fishEscapeChance: number;
    minCatchTime: number;
    priceVariation: number;
}

export interface BotConfig {
    name: string;
    prefix: string;
    helpText: string;
}

export interface FishingSpotData {
    channelId: string;
    reputation: number;
    cleanliness: number;
    fee: number;
    minPurchasePrice: number;
    ownerId: string | null;
    createdAt: Date;
}
