import {ChatInputCommandInteraction, SlashCommandBuilder, PermissionsBitField, CategoryChannel, ChannelType} from 'discord.js';
import {BaseCommand} from '../../core/BaseCommand';
import type {CommandResult} from '../../types/command.types';
import {CommandRegistry} from '../../core/CommandRegistry';
import {ticketService} from '../../services/ticket.service';

const commandRegistry = CommandRegistry.getInstance();

export class SetTicketCategoryCommand extends BaseCommand {
    constructor() {
        super({
            name: '티켓카테고리설정',
            description: '티켓 카테고리를 설정합니다.',
            requiresTextChannel: false,
        });

        this.data
            .setName('티켓카테고리설정')
            .setDescription('티켓 카테고리를 설정합니다.')
            .addChannelOption((option) => option.setName('category').setDescription('티켓 카테고리로 설정할 카테고리를 선택하세요.').setRequired(true))
            .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator);
    }

    protected async handleCommand(interaction: ChatInputCommandInteraction): Promise<CommandResult> {
        if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator)) {
            return {
                success: false,
                content: '이 명령어를 실행하려면 관리자 권한이 필요합니다.',
            };
        }

        const category = interaction.options.getChannel('category') as CategoryChannel | null;

        if (!category || category.type !== ChannelType.GuildCategory) {
            return {
                success: false,
                content: '유효한 카테고리를 선택해주세요.',
            };
        }

        try {
            await ticketService.setTicketCategory(interaction.guildId!, category.id);

            return {
                success: true,
                content: `티켓 카테고리가 **${category.name}**(으)로 설정되었습니다.`,
            };
        } catch (error) {
            console.error('Error setting ticket category:', error);
            return {
                success: false,
                content: '티켓 카테고리 설정 중 오류가 발생했습니다.',
            };
        }
    }
}

commandRegistry.registerCommand(new SetTicketCategoryCommand());
