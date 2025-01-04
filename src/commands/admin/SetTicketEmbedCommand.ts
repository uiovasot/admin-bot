import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    PermissionsBitField,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    TextChannel,
    ChannelType,
} from 'discord.js';
import {BaseCommand} from '../../core/BaseCommand';
import type {CommandResult} from '../../types/command.types';
import {CommandRegistry} from '../../core/CommandRegistry';

const commandRegistry = CommandRegistry.getInstance();

export class SetTicketEmbedCommand extends BaseCommand {
    constructor() {
        super({
            name: '티켓생성채널선택',
            description: '티켓 생성 채널을 설정합니다.',
            requiresTextChannel: false,
        });

        this.data
            .setName('티켓생성채널선택')
            .setDescription('티켓 생성 채널을 선택합니다.')
            .addChannelOption((option) => option.setName('channel').setDescription('티켓 생성 임베드를 표시할 채널을 선택하세요.').setRequired(true))
            .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator);
    }

    protected async handleCommand(interaction: ChatInputCommandInteraction): Promise<CommandResult> {
        if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator)) {
            return {
                success: false,
                content: '이 명령어를 실행하려면 관리자 권한이 필요합니다.',
            };
        }

        const channel = interaction.options.getChannel('channel') as TextChannel;

        if (channel?.type !== ChannelType.GuildText) {
            return {
                success: false,
                content: '유효한 텍스트 채널을 선택해주세요.',
            };
        }

        const embed = new EmbedBuilder().setColor(0x00ae86).setTitle('티켓 생성').setDescription('아래 버튼을 눌러 티켓을 생성하세요.');

        const button = new ButtonBuilder().setCustomId('create-ticket').setLabel('티켓 생성').setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

        await channel.send({embeds: [embed], components: [row]});

        return {
            success: true,
            content: `티켓 생성 임베드가 ${channel} 채널에 설정되었습니다.`,
        };
    }
}

commandRegistry.registerCommand(new SetTicketEmbedCommand());
