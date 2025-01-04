import {ChatInputCommandInteraction, EmbedBuilder, PermissionsBitField, SlashCommandBuilder} from 'discord.js';
import {BaseCommand} from '../../core/BaseCommand';
import {settingService} from '../../services/settings.service';
import type {CommandResult} from '../../types/command.types';
import {CommandRegistry} from '../../core/CommandRegistry';

const commandRegistry = CommandRegistry.getInstance();

export class SettingsCommand extends BaseCommand {
    constructor() {
        super({
            name: '설정',
            description: '서버 경험치 시스템 설정 명령어',
            requiresTextChannel: true,
        });

        this.data
            .setName('설정')
            .setDescription('경험치 시스템 설정 명령어')
            .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
            .addSubcommand((sub) =>
                sub
                    .setName('메시지')
                    .setDescription('메시지 경험치 및 쿨타임 설정')
                    .addIntegerOption((option) => option.setName('경험치').setDescription('메시지당 경험치 (기본값: 5)').setRequired(false))
                    .addIntegerOption((option) => option.setName('쿨타임').setDescription('메시지 경험치 지급 쿨타임 (초) (기본값: 60)').setRequired(false)),
            )
            .addSubcommand((sub) =>
                sub
                    .setName('음성')
                    .setDescription('음성 채널 경험치 및 지급 간격 설정')
                    .addIntegerOption((option) => option.setName('경험치').setDescription('음성 채널 지급 경험치 (기본값: 10)').setRequired(false))
                    .addIntegerOption((option) => option.setName('간격').setDescription('지급 간격 (분) (기본값: 5)').setRequired(false)),
            );
    }

    protected async handleCommand(interaction: ChatInputCommandInteraction): Promise<CommandResult> {
        const subCommand = interaction.options.getSubcommand();
        const serverId = interaction.guild?.id;

        if (!serverId) {
            return {
                success: false,
                content: '이 명령어는 서버 내에서만 사용할 수 있습니다.',
            };
        }

        const settings = await settingService.getSettings(serverId);

        if (subCommand === '메시지') {
            const messageExperience = interaction.options.getInteger('경험치') ?? settings.messageExperience;
            const messageCooldown = interaction.options.getInteger('쿨타임') ?? settings.messageCooldown;

            const updatedSettings = await settingService.updateSettings(serverId, {
                messageExperience,
                messageCooldown,
            });

            const embed = new EmbedBuilder()
                .setColor(0x00ae86)
                .setTitle('메시지 설정 업데이트')
                .addFields(
                    {name: '메시지 경험치', value: `${updatedSettings.messageExperience}`, inline: true},
                    {name: '쿨타임 (초)', value: `${updatedSettings.messageCooldown}`, inline: true},
                );

            return {success: true, content: '', embeds: [embed]};
        }

        if (subCommand === '음성') {
            const voiceChannelExperience = interaction.options.getInteger('경험치') ?? settings.voiceChannelExperience;
            const voiceInterval = interaction.options.getInteger('간격') ?? settings.voiceInterval;

            const updatedSettings = await settingService.updateSettings(serverId, {
                voiceChannelExperience,
                voiceInterval,
            });

            const embed = new EmbedBuilder()
                .setColor(0x00ae86)
                .setTitle('음성 채널 설정 업데이트')
                .addFields(
                    {name: '음성 경험치', value: `${updatedSettings.voiceChannelExperience}`, inline: true},
                    {name: '지급 간격 (분)', value: `${updatedSettings.voiceInterval}`, inline: true},
                );

            return {success: true, content: '', embeds: [embed]};
        }

        return {success: false, content: '올바른 설정 명령어를 입력하세요.'};
    }
}

commandRegistry.registerCommand(new SettingsCommand());
