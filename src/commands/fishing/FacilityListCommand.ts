import {ChatInputCommandInteraction, EmbedBuilder} from 'discord.js';
import {BaseCommand} from '../../core/BaseCommand';
import type {CommandResult} from '../../types/command.types';
import {FacilityService} from '../../services/facility.service';
import {CommandRegistry} from '../../core/CommandRegistry';

const commandRegistry = CommandRegistry.getInstance();

export class FacilityListCommand extends BaseCommand {
    constructor() {
        super({
            name: '시설목록',
            description: '낚시터에 건설할 수 있는 시설 목록을 출력합니다.',
            requiresTextChannel: true,
        });
    }

    protected async handleCommand(): Promise<CommandResult> {
        const facilityTypes = FacilityService.getFacilityTypes();

        const embed = new EmbedBuilder().setTitle('🏗️ 건설 가능한 시설 목록').setColor(0x00ae86);

        for (const facilityName of facilityTypes) {
            const facility = FacilityService.getFacilityInfo(facilityName);
            if (facility) {
                embed.addFields({
                    name: facilityName,
                    value: `필요 명성: ${facility.cost}\n${facility.description}`,
                });
            }
        }

        return {
            content: '',
            embeds: [embed],
            success: true,
        };
    }
}

commandRegistry.registerCommand(new FacilityListCommand());
