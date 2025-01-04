import {BaseFacility} from '../core/BaseFacility';
import type {FishType} from '../types';
import {FacilityService} from '../services/facility.service';

export class ChineseBoatCallerV2 extends BaseFacility {
    readonly name = '중국 어선 호출기 V2';
    readonly cost = 1500000;
    readonly description = '전설이 아닌 물고기를 다 잡아서 전설 물고기와 쓰레기만 남게 하는 시설입니다.';

    adjustFishChance(fish: FishType, cleanliness: number): void {
        if (fish.type !== 'trash' && fish.rate !== 'legendary' && fish.rate !== 'ultra-legendary') {
            fish.chance = 0;
        }
    }
}

FacilityService.registerFacility(ChineseBoatCallerV2);
