import {ChatInputCommandInteraction, EmbedBuilder} from 'discord.js';
import {BaseCommand} from '../../core/BaseCommand';
import type {CommandResult} from '../../types/command.types';
import {fishingService} from '../../services/fishing.service';
import {CommandRegistry} from '../../core/CommandRegistry';

const commandRegistry = CommandRegistry.getInstance();

export class SetFishingSpotFeeCommand extends BaseCommand {
    constructor() {
        super({
            name: '수수료설정',
            description: '낚시터의 수수료를 설정합니다',
            requiresTextChannel: true,
        });

        this.data.addIntegerOption((option) => option.setName('수수료').setDescription('설정할 수수료 퍼센트 (0-100)').setRequired(true));
    }

    protected async handleCommand(interaction: ChatInputCommandInteraction): Promise<CommandResult> {
        const fee = interaction.options.getInteger('수수료', true);
        const result = await fishingService.setFishingSpotFee(interaction.channelId, interaction.user.id, fee);

        if (!result.success) {
            return {
                content: result.error || '',
                success: false,
                ephemeral: true,
            };
        }

        const embed = new EmbedBuilder()
            .setColor(0x00ae86)
            .setTitle(`수수료 설정 성공`)
            .setDescription(`${interaction.user.username}님의 낚시터 수수료가 ${fee}%로 설정되었습니다!`)
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

commandRegistry.registerCommand(new SetFishingSpotFeeCommand());
