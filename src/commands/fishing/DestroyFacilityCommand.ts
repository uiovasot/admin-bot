import {ChatInputCommandInteraction, EmbedBuilder} from 'discord.js';
import {BaseCommand} from '../../core/BaseCommand';
import type {CommandResult} from '../../types/command.types';
import {FacilityService} from '../../services/facility.service';
import {CommandRegistry} from '../../core/CommandRegistry';
import {fishingService} from '../../services/fishing.service';

const commandRegistry = CommandRegistry.getInstance();

export class DestroyFacilityCommand extends BaseCommand {
    constructor() {
        super({
            name: '시설철거',
            description: '낚시터의 시설을 철거합니다',
            requiresTextChannel: true,
        });

        const facilityTypes = FacilityService.getFacilityTypes();

        this.data.addStringOption((option) =>
            option
                .setName('시설')
                .setChoices(facilityTypes.map((type) => ({name: type, value: type})))
                .setDescription('철거할 시설')
                .setRequired(true),
        );
    }

    protected async handleCommand(interaction: ChatInputCommandInteraction): Promise<CommandResult> {
        const channelId = interaction.channelId;
        const spot = await fishingService.getFishingSpot(channelId);

        if (!spot) {
            return {
                content: '이 채널에는 낚시터가 없습니다.',
                success: false,
                ephemeral: true,
            };
        }

        if (spot.ownerId !== interaction.user.id) {
            return {
                content: '낚시터 주인만 시설을 철거할 수 있습니다.',
                success: false,
                ephemeral: true,
            };
        }

        const facilities = spot.facilities.map((f) => f.name);
        if (facilities.length === 0) {
            return {
                content: '철거할 시설이 없습니다.',
                success: false,
                ephemeral: true,
            };
        }

        const facilityName = interaction.options.getString('시설')!;

        try {
            const facility = FacilityService.getFacilityInfo(facilityName);
            if (!facility) {
                return {
                    content: '존재하지 않는 시설입니다.',
                    success: false,
                    ephemeral: true,
                };
            }

            if (!facilities.includes(facilityName)) {
                return {
                    content: '해당 시설이 이 낚시터에 존재하지 않습니다.',
                    success: false,
                    ephemeral: true,
                };
            }

            const result = await FacilityService.destroyFacility(channelId, facilityName);
            const embed = new EmbedBuilder().setTitle('🏗️ 시설 철거').setDescription(result).setColor(0x00ae86);

            return {
                content: '',
                embeds: [embed],
                success: true,
            };
        } catch (error) {
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ 오류')
                .setDescription(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.')
                .setColor('#ff0000');

            return {
                content: '',
                embeds: [errorEmbed],
                success: false,
                ephemeral: true,
            };
        }
    }
}

commandRegistry.registerCommand(new DestroyFacilityCommand());
