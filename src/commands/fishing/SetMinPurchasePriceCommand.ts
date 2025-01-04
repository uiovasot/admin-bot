import {ChatInputCommandInteraction} from 'discord.js';
import {BaseCommand} from '../../core/BaseCommand';
import type {CommandResult} from '../../types/command.types';
import {fishingService} from '../../services/fishing.service';
import {CommandRegistry} from '../../core/CommandRegistry';
import {prisma} from '../../../prisma';

const commandRegistry = CommandRegistry.getInstance();

export class SetMinPurchasePriceCommand extends BaseCommand {
    constructor() {
        super({
            name: '최소매입가변경',
            description: '낚시터의 최소 매입가를 변경합니다',
            requiresTextChannel: true,
        });

        this.data.addIntegerOption((option) => option.setName('가격').setDescription('설정할 최소 매입가').setRequired(true).setMinValue(0));
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

        if (spot.ownerId !== interaction.user.id) {
            return {
                content: '낚시터 주인만 최소 매입가를 설정할 수 있습니다!',
                success: false,
                ephemeral: true,
            };
        }

        const newPrice = interaction.options.getInteger('가격', true);
        const owner = await prisma.users.findUnique({where: {id: spot.ownerId}});

        if (!owner) {
            return {
                content: '오류가 발생했습니다.',
                success: false,
                ephemeral: true,
            };
        }

        if (newPrice > owner.money) {
            return {
                content: '최소 매입가는 주인의 돈보다 많을 수 없습니다!',
                success: false,
                ephemeral: true,
            };
        }

        await prisma.fishingSpots.update({
            where: {channelId: spot.channelId},
            data: {
                minPurchasePrice: newPrice,
            },
        });

        return {
            content: `최소 매입가가 ${newPrice}원으로 변경되었습니다.`,
            success: true,
        };
    }
}

commandRegistry.registerCommand(new SetMinPurchasePriceCommand());
