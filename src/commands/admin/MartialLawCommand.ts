import {ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, PermissionsBitField, TextChannel, Role} from 'discord.js';
import {BaseCommand} from '../../core/BaseCommand';
import type {CommandResult} from '../../types/command.types';
import {CommandRegistry} from '../../core/CommandRegistry';
import {emergencyService} from '../../services/emergency.service';

const commandRegistry = CommandRegistry.getInstance();

export class EmergencyCommand extends BaseCommand {
    constructor() {
        super({
            name: '비상계엄령',
            description: '서버 비상 상황에 대한 명령어입니다.',
        });

        this.data
            .setName('비상계엄령')
            .setDescription('서버 비상 상황에 대한 명령어입니다.')
            .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
            .addSubcommand((subcommand) =>
                subcommand
                    .setName('긴급알림')
                    .setDescription('모든 채널에 비상 상황 알림을 보냅니다.')
                    .addStringOption((option) => option.setName('메시지').setDescription('보낼 알림 메시지').setRequired(true)),
            )
            .addSubcommand((subcommand) =>
                subcommand
                    .setName('사용자제한')
                    .setDescription('특정 채널의 메시지 권한을 제한합니다.')
                    .addChannelOption((option) => option.setName('채널').setDescription('제한할 채널').setRequired(true))
                    .addRoleOption((option) => option.setName('허용역할').setDescription('메시지 전송이 허용될 역할').setRequired(true)),
            )
            .addSubcommand((subcommand) => subcommand.setName('상황종료').setDescription('비상 상황을 종료하고 제한된 설정을 해제합니다.'));
    }

    protected async handleCommand(interaction: ChatInputCommandInteraction): Promise<CommandResult> {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case '긴급알림': {
                const message = interaction.options.getString('메시지', true);
                const guildId = interaction.guild?.id;

                if (!guildId) {
                    return {
                        success: false,
                        content: '',
                        embeds: [new EmbedBuilder().setColor(0xff0000).setTitle('오류').setDescription('서버 정보를 가져올 수 없습니다.')],
                    };
                }

                await emergencyService.setEmergencyStatus(guildId, true);

                const channels = interaction.guild?.channels.cache.filter((c) => c.isTextBased());

                if (!channels) {
                    return {
                        success: false,
                        content: '',
                        embeds: [new EmbedBuilder().setColor(0xff0000).setTitle('오류').setDescription('채널을 찾을 수 없습니다.')],
                    };
                }

                channels.forEach((channel) => {
                    if (channel instanceof TextChannel) {
                        channel.send(`🚨 **긴급 알림**: ${message}`);
                    }
                });

                return {
                    success: true,
                    content: '',
                    embeds: [new EmbedBuilder().setColor(0x00ae86).setTitle('긴급 알림 발송 완료').setDescription('모든 텍스트 채널에 알림을 발송했습니다.')],
                };
            }

            case '사용자제한': {
                const channel = interaction.options.getChannel('채널', true);
                const allowedRole = interaction.options.getRole('허용역할', true);

                if (!(channel instanceof TextChannel)) {
                    return {
                        success: false,
                        content: '',
                        embeds: [new EmbedBuilder().setColor(0xff0000).setTitle('오류').setDescription('텍스트 채널만 선택 가능합니다.')],
                    };
                }

                await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
                    SendMessages: false,
                });

                await channel.permissionOverwrites.edit(allowedRole as Role, {
                    SendMessages: true,
                });

                return {
                    success: true,
                    content: '',
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0x00ae86)
                            .setTitle('사용자 제한 설정 완료')
                            .setDescription(`채널 ${channel}에서 ${allowedRole} 역할만 메시지 전송이 가능하도록 설정했습니다.`),
                    ],
                };
            }

            case '상황종료': {
                const guildId = interaction.guild?.id;

                if (!guildId) {
                    return {
                        success: false,
                        content: '',
                        embeds: [new EmbedBuilder().setColor(0xff0000).setTitle('오류').setDescription('서버 정보를 가져올 수 없습니다.')],
                    };
                }

                await emergencyService.setEmergencyStatus(guildId, false);

                const channels = interaction.guild?.channels.cache.filter((c) => c.isTextBased());
                if (channels) {
                    channels.forEach((channel) => {
                        if (channel instanceof TextChannel) {
                            channel.send('✅ **상황 종료**: 비상 상황이 해제되었습니다.');
                        }
                    });
                }

                return {
                    success: true,
                    content: '',
                    embeds: [new EmbedBuilder().setColor(0x00ae86).setTitle('상황 종료').setDescription('비상 상황이 해제되었습니다.')],
                };
            }

            default:
                return {
                    success: false,
                    content: '',
                    embeds: [new EmbedBuilder().setColor(0xff0000).setTitle('오류').setDescription('알 수 없는 서브 명령어입니다.')],
                };
        }
    }
}

commandRegistry.registerCommand(new EmergencyCommand());
