import {prisma} from '../../prisma';
import type {FishType} from '../types';

export abstract class BaseFacility {
    abstract readonly name: string;
    abstract readonly cost: number;
    abstract readonly description: string;

    constructor(protected channelId: string) {}

    protected async getSpot() {
        return await prisma.fishingSpots.findUnique({where: {channelId: this.channelId}});
    }

    adjustFishChance(fish: FishType, cleanliness: number): void {}
    adjustEscapeChance(currentChance: number): number {
        return currentChance;
    }
    adjustReputationMultiplier(currentReputationMultiplier: number): number {
        return currentReputationMultiplier;
    }

    async onBuild(): Promise<void> {
        const spot = await this.getSpot();
        if (!spot) throw new Error('낚시터를 찾을 수 없습니다.');
    }

    async onDestroy(): Promise<void> {
        const spot = await this.getSpot();
        if (!spot) throw new Error('낚시터를 찾을 수 없습니다.');
    }
}
