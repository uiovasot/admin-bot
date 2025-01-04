import {ChatInputCommandInteraction, EmbedBuilder} from 'discord.js';
import {BaseCommand} from '../../core/BaseCommand';
import type {CommandResult} from '../../types/command.types';
import {fishingService} from '../../services/fishing.service';
import {gameConfig} from '../../config/game.config';
import {CommandRegistry} from '../../core/CommandRegistry';

const commandRegistry = CommandRegistry.getInstance();

export class CreateFishingSpotCommand extends BaseCommand {
    constructor() {
        super({
            name: '낚시터생성',
            description: '현재 채널을 낚시터로 만듭니다',
            requiresTextChannel: true,
        });

        this.data.addIntegerOption((option) => option.setName('최소매입가').setDescription('낚시터의 최소 매입가를 설정합니다').setRequired(true));
    }

    protected async handleCommand(interaction: ChatInputCommandInteraction): Promise<CommandResult> {
        const minPurchasePrice = interaction.options.getInteger('최소매입가', true);

        const existingSpot = await fishingService.getFishingSpot(interaction.channelId);
        if (existingSpot) {
            return {
                content: '이미 낚시터로 등록된 채널입니다!',
                success: false,
                ephemeral: true,
            };
        }

        const spot = await fishingService.createFishingSpot(interaction.channelId, minPurchasePrice);

        const embed = new EmbedBuilder()
            .setColor(0x00ae86)
            .setTitle(`낚시터 생성`)
            .setDescription('낚시터가 생성되었습니다!')
            .addFields(
                {name: '주인', value: '아직 없어요. 주인이 되고 싶으시다면 /낚시터매입을 사용해주세요!'},
                {name: '낚시터 명성', value: `✨ ${spot.reputation}`},
                {name: '청결도', value: `${spot.cleanliness}`},
                {name: '지형', value: gameConfig.terrains[spot.terrain]?.name || '알 수 없는 지형'},
                {name: '수수료', value: `${spot.fee}%`},
                {name: '최소 매입가', value: spot.minPurchasePrice + '원'},
                {name: '생성일', value: spot.createdAt.toLocaleDateString()},
            )
            .setFooter({
                text: `@${interaction.user.username}`,
            })
            .setTimestamp();

        return {
            content: '',
            embeds: [embed],
            success: true,
        };
    }
}

commandRegistry.registerCommand(new CreateFishingSpotCommand());
