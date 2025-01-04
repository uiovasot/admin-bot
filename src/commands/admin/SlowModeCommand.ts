import {ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, PermissionsBitField, TextChannel} from 'discord.js';
import {BaseCommand} from '../../core/BaseCommand';
import type {CommandResult} from '../../types/command.types';
import {CommandRegistry} from '../../core/CommandRegistry';

const commandRegistry = CommandRegistry.getInstance();

export class SlowModeCommand extends BaseCommand {
    constructor() {
        super({
            name: '슬로우모드변경',
            description: '선택한 채널의 슬로우 모드를 설정합니다.',
            requiresTextChannel: true,
        });

        this.data
            .setName('슬로우모드변경')
            .setDescription('선택한 채널의 슬로우 모드를 설정합니다.')
            .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels)
            .addChannelOption((option) => option.setName('채널').setDescription('슬로우 모드를 설정할 채널').setRequired(true))
            .addIntegerOption(
                (option) => option.setName('기간').setDescription('슬로우 모드 기간 (초)').setRequired(true).setMinValue(0).setMaxValue(21600), // 6 hours
            );
    }

    protected async handleCommand(interaction: ChatInputCommandInteraction): Promise<CommandResult> {
        if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageChannels)) {
            const permissionEmbed = new EmbedBuilder().setColor(0xff0000).setTitle('권한 부족').setDescription('이 명령어를 사용하려면 "채널 관리" 권한이 필요합니다.');

            return {
                success: false,
                content: '',
                embeds: [permissionEmbed],
            };
        }

        const channel = interaction.options.getChannel('채널', true);
        const durationInSeconds = interaction.options.getInteger('기간', true);

        if (!(channel instanceof TextChannel)) {
            const invalidChannelEmbed = new EmbedBuilder().setColor(0xff0000).setTitle('잘못된 채널 타입').setDescription('슬로우 모드는 텍스트 채널에서만 설정할 수 있습니다.');

            return {
                success: false,
                content: '',
                embeds: [invalidChannelEmbed],
            };
        }

        try {
            await channel.setRateLimitPerUser(durationInSeconds);

            const successEmbed = new EmbedBuilder()
                .setColor(0x00ae86)
                .setTitle('슬로우 모드 설정 완료')
                .setDescription(`✅ ${channel}의 슬로우 모드가 ${durationInSeconds}초로 설정되었습니다.`)
                .addFields({name: '채널', value: `${channel}`, inline: true}, {name: '슬로우 모드 기간', value: `${durationInSeconds}초`, inline: true});

            return {
                success: true,
                content: '',
                embeds: [successEmbed],
            };
        } catch (error) {
            console.error('Error setting slow mode:', error);

            const errorEmbed = new EmbedBuilder().setColor(0xff0000).setTitle('오류 발생').setDescription('슬로우 모드 설정 중 오류가 발생했습니다.');

            return {
                success: false,
                content: '',
                embeds: [errorEmbed],
            };
        }
    }
}

commandRegistry.registerCommand(new SlowModeCommand());
