import {BaseFacility} from '../core/BaseFacility';
import type {FishType} from '../types';
import {FacilityService} from '../services/facility.service';

export class BaitShop extends BaseFacility {
    readonly name = '미끼 상점';
    readonly cost = 3700;
    readonly description = '고급 미끼를 판매하여 회귀한 물고기를 더 잘 잡을 수 있게 해주는 상점입니다.';

    adjustFishChance(fish: FishType, cleanliness: number): void {
        if (fish.rate && fish.rate !== 'common') {
            fish.chance *= 1.4;
        }
    }
}

FacilityService.registerFacility(BaitShop);
