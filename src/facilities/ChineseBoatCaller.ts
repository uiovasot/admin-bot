import {BaseFacility} from '../core/BaseFacility';
import type {FishType} from '../types';
import {FacilityService} from '../services/facility.service';

export class ChineseBoatCaller extends BaseFacility {
    readonly name = '중국 어선 호출기';
    readonly cost = 95;
    readonly description = '물고기를 다 잡아서 쓰레기만 남게 하는 시설입니다.';

    adjustFishChance(fish: FishType, cleanliness: number): void {
        if (fish.type !== 'trash') {
            fish.chance = 0;
        }
    }
}

FacilityService.registerFacility(ChineseBoatCaller);
