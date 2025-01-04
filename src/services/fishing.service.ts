import type {FishType, FishingState} from '../types';
import {gameConfig} from '../config/game.config';
import {prisma} from '../../prisma';
import {FacilityService} from './facility.service';
import {deepCopy} from '../utils/deepCopy.util';

class FishingService {
    private fishingStates: Map<string, FishingState> = new Map();

    private getRandomFish(terrain: number, facilities: string[], cleanliness: number): FishType | null {
        let terrainFishs = gameConfig.terrains[terrain]?.fishTypes;
        if (!terrainFishs) terrainFishs = gameConfig.terrains[0].fishTypes;

        terrainFishs = deepCopy(terrainFishs);

        const random = Math.random();
        let allChance = 0;

        for (const fish of terrainFishs) {
            for (const facilityName of facilities) {
                const facility = FacilityService.getFacilityInfo(facilityName);
                if (facility) facility.adjustFishChance(fish, cleanliness);
            }
            allChance += fish.chance;
        }

        let cumulativeChance = 0;
        for (const fish of terrainFishs) {
            cumulativeChance += fish.chance / allChance;
            if (random <= cumulativeChance) {
                fish.length = fish.length ? fish.length * 0.8 + Math.random() * fish.length * 0.2 : 10 + Math.random() * 100;
                if (gameConfig.priceVariation) {
                    const variation = (Math.random() * 2 - 1) * gameConfig.priceVariation;
                    fish.price = Math.floor(fish.price * (1 + variation));
                }
                return fish;
            }
        }

        return terrainFishs[Math.floor(random * terrainFishs.length)];
    }

    private getRandomFishBiteTime(): number {
        const {min, max} = gameConfig.fishBiteTime;

        const time = Math.floor(Math.random() * (max - min + 1) + min);

        return time;
    }

    private getRandomWaitTime(): number {
        const {min, max} = gameConfig.fishWaitTime;

        const time = Math.floor(Math.random() * (max - min + 1) + min);

        return time;
    }

    async createFishingSpot(channelId: string, minPurchasePrice: number) {
        return await prisma.fishingSpots.create({
            data: {
                channelId,
                reputation: 0,
                cleanliness: 0,
                fee: 0,
                facilities: {
                    create: [],
                },
                minPurchasePrice,
                ownerId: null,
                isPurchaseDisabled: false,
            },
        });
    }

    async getFishingSpot(channelId: string) {
        return await prisma.fishingSpots.findUnique({
            where: {channelId},
            include: {
                facilities: true,
            },
        });
    }

    async togglePurchaseDisabled(channelId: string) {
        const spot = await this.getFishingSpot(channelId);
        if (!spot) {
            return {success: false, error: '이 채널은 낚시터가 아니야!'};
        }

        const updatedSpot = await prisma.fishingSpots.update({
            where: {channelId},
            data: {isPurchaseDisabled: !spot.isPurchaseDisabled},
        });

        return {success: true, isDisabled: updatedSpot.isPurchaseDisabled};
    }

    async buyFishingSpot(channelId: string, userId: string) {
        const spot = await this.getFishingSpot(channelId);
        if (!spot) return {success: false, error: '이 채널은 낚시터가 아니야!'};
        if (spot.isPurchaseDisabled) return {success: false, error: '이 낚시터는 현재 매입이 금지되어 있어!'};
        if (spot.ownerId === userId) return {success: false, error: '이미 너가 주인이자나!'};

        const buyer = await prisma.users.findUnique({where: {id: userId}});
        if (!buyer) return {success: false, error: '낚시를 적어도 한 번은 해야 해!'};
        if (buyer.money < spot.minPurchasePrice) return {success: false, error: `낚시터를 구매하려면 최소 ${spot.minPurchasePrice}원이 필요해!`};

        if (spot.ownerId) {
            await prisma.users.update({
                where: {id: spot.ownerId},
                data: {money: {increment: spot.minPurchasePrice}, totalAssets: {decrement: spot.minPurchasePrice}},
            });
        }

        await prisma.users.update({
            where: {id: userId},
            data: {money: {decrement: spot.minPurchasePrice}},
        });

        await prisma.fishingSpots.update({
            where: {channelId},
            data: {ownerId: userId},
        });

        return {success: true};
    }

    async setFishingSpotFee(channelId: string, userId: string, fee: number) {
        if (fee < 0 || fee > 100) return {success: false, error: '수수료는 0% ~ 100% 여야 해!'};

        const spot = await this.getFishingSpot(channelId);
        if (!spot) return {success: false, error: '이 채널은 낚시터가 아니야!'};
        if (spot.ownerId !== userId) return {success: false, error: '남의 땅을 건드리면 안대!\n낚시터 수수료는 낚시터 소유자만 수정할 수 있습니다.'};

        await prisma.fishingSpots.update({
            where: {channelId},
            data: {fee},
        });

        return {success: true};
    }

    async setSpotTerrain(channelId: string, userId: string, terrain: number) {
        if (!gameConfig.terrains[terrain]) return {success: false, error: '지형이 없습니다!'};

        const spot = await this.getFishingSpot(channelId);
        if (!spot) return {success: false, error: '이 채널은 낚시터가 아닙니다!'};
        if (spot.ownerId !== userId) return {success: false, error: '낚시터 주인만 지형를 설정할 수 있습니다!'};

        await prisma.fishingSpots.update({
            where: {channelId},
            data: {terrain},
        });

        return {success: true};
    }

    async updateFishingSpotReputation(channelId: string, fishPrice: number) {
        const spot = await this.getFishingSpot(channelId);
        if (spot) {
            let reputationIncrease = Math.abs(fishPrice);
            let currentReputationMultiplier = 1;

            for (const {name} of spot.facilities) {
                const facility = FacilityService.getFacilityInfo(name);
                if (facility) currentReputationMultiplier = facility.adjustReputationMultiplier(currentReputationMultiplier);
            }

            reputationIncrease *= currentReputationMultiplier;

            await prisma.fishingSpots.update({
                where: {channelId},
                data: {reputation: {increment: reputationIncrease}},
            });
        }
    }

    async startFishing(userId: string, channelId: string): Promise<{success: boolean; error?: string}> {
        const spot = await this.getFishingSpot(channelId);
        if (!spot) {
            return {success: false, error: '이 채널은 낚시터가 아닙니다.'};
        }

        const waitTime = this.getRandomWaitTime();
        const biteTime = this.getRandomFishBiteTime();
        const fishType = this.getRandomFish(
            spot.terrain,
            spot.facilities.map((f) => f.name),
            spot.cleanliness,
        );

        const state = {
            isActive: true,
            startTime: Date.now(),
            waitTime,
            biteTime,
            fishType,
            userId,
            channelId,
            timers: [],
        };

        this.fishingStates.set(userId, state);

        return {success: true};
    }

    setBitedTime(userId: string): void {
        const state = this.fishingStates.get(userId);
        if (state) {
            state.bitedAt = Date.now();
            this.fishingStates.set(userId, state);
        }
    }

    async handleFishingReward(userId: string, channelId: string, fishPrice: number) {
        const spot = await this.getFishingSpot(channelId);
        if (!spot || fishPrice <= 0) return {finalPrice: fishPrice, feeAmount: 0, ownerEarnings: 0};

        const feeAmount = spot.ownerId === userId ? 0 : Math.floor((fishPrice * spot.fee) / 100);
        const finalPrice = fishPrice - feeAmount;

        if (spot.ownerId && feeAmount > 0) {
            await prisma.users.update({
                where: {id: spot.ownerId},
                data: {money: {increment: feeAmount}},
            });
        }

        return {finalPrice, feeAmount, ownerEarnings: feeAmount};
    }

    async checkCatch(userId: string) {
        const state = this.fishingStates.get(userId);
        if (!state || !state.isActive || !state.fishType) return {success: false};

        if (!state.bitedAt || Date.now() - state.bitedAt < gameConfig.minCatchTime) {
            this.endFishing(userId);
            return {
                success: false,
                reason: '찌를 너무 빨리 건졌나...?',
            };
        }

        let escapeChance = gameConfig.fishEscapeChance;
        const spot = await this.getFishingSpot(state.channelId);
        if (spot) {
            for (const {name} of spot.facilities) {
                const facility = FacilityService.getFacilityInfo(name);
                if (facility) escapeChance *= facility.adjustEscapeChance(escapeChance);
            }
        }

        if (Math.random() < escapeChance) {
            this.endFishing(userId);

            return {
                success: false,
                reason: `낚시에 실패했어요..`,
            };
        }

        if (state.fishType) {
            await prisma.fishingHistories.create({
                data: {
                    userId: state.userId,
                    channelId: state.channelId,
                    fishName: state.fishType.name,
                    fishType: state.fishType.type,
                    fishRate: state.fishType.rate,
                    length: state.fishType.length,
                    price: state.fishType.price,
                },
            });
        }

        return {success: true, fish: state.fishType};
    }

    getFishingState(userId: string): FishingState | undefined {
        return this.fishingStates.get(userId);
    }

    clearTimer(userId: string): void {
        const state = this.fishingStates.get(userId);
        if (state) {
            for (const timer of state.timers) clearTimeout(timer);
        }
    }

    endFishing(userId: string): void {
        this.clearTimer(userId);
        this.fishingStates.delete(userId);
    }

    isFishing(userId: string): boolean {
        return this.fishingStates.has(userId);
    }
}

export const fishingService = new FishingService();
