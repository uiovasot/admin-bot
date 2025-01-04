import {ChatInputCommandInteraction, EmbedBuilder} from 'discord.js';
import {BaseCommand} from '../../core/BaseCommand';
import type {CommandResult} from '../../types/command.types';
import {fishingService} from '../../services/fishing.service';
import {gameConfig} from '../../config/game.config';
import {CommandRegistry} from '../../core/CommandRegistry';
import {prisma} from '../../../prisma';

const commandRegistry = CommandRegistry.getInstance();

export class FishingSpotInfoCommand extends BaseCommand {
    constructor() {
        super({
            name: '낚시터정보',
            description: '현재 채널의 낚시터 정보를 확인합니다',
            requiresTextChannel: true,
        });
    }

    protected async handleCommand(interaction: ChatInputCommandInteraction): Promise<CommandResult> {
        const spot = await fishingService.getFishingSpot(interaction.channelId);
        if (!spot) {
            return {
                content: '이 채널은 낚시터가 아닙니다!',
                success: false,
                ephemeral: true,
            };
        }

        let ownerInfo = '없음';
        if (spot.ownerId) {
            const owner = await prisma.users.findUnique({where: {id: spot.ownerId}});
            if (owner) {
                ownerInfo = owner.username;
            }
        }

        const embed = new EmbedBuilder()
            .setColor(0x00ae86)
            .setTitle(`🎣 낚시터 정보`)
            .addFields(
                {name: '주인', value: ownerInfo},
                {name: '낚시터 명성', value: `✨ ${spot.reputation}`},
                {name: '청결도', value: `${spot.cleanliness}`},
                {name: '지형', value: gameConfig.terrains[spot.terrain]?.name || '알 수 없는 지형'},
                {name: '수수료', value: `${spot.fee}%`},
                {name: '최소 매입가', value: spot.minPurchasePrice + '원'},
                {name: '시설', value: spot.facilities.join(', ') || '없음'},
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

commandRegistry.registerCommand(new FishingSpotInfoCommand());
