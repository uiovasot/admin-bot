import {ChatInputCommandInteraction, SlashCommandBuilder, PermissionsBitField, Role, EmbedBuilder} from 'discord.js';
import {BaseCommand} from '../../core/BaseCommand';
import type {CommandResult} from '../../types/command.types';
import {CommandRegistry} from '../../core/CommandRegistry';
import {adminRoleService} from '../../services/adminRole.service';

const commandRegistry = CommandRegistry.getInstance();

export class SetAdminRoleCommand extends BaseCommand {
    constructor() {
        super({
            name: '관리자역할선택',
            description: '관리자 역할을 설정합니다.',
            requiresTextChannel: false,
        });

        this.data
            .setName('관리자역할선택')
            .setDescription('관리자 역할을 설정합니다.')
            .addRoleOption((option) => option.setName('role').setDescription('관리자 역할로 설정할 역할을 선택하세요.').setRequired(true))
            .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator);
    }

    protected async handleCommand(interaction: ChatInputCommandInteraction): Promise<CommandResult> {
        if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator)) {
            return {
                success: false,
                content: '이 명령어를 실행하려면 관리자 권한이 필요합니다.',
            };
        }

        const role = interaction.options.getRole('role') as Role | null;

        if (!role) {
            return {
                success: false,
                content: '유효한 역할을 선택해주세요.',
            };
        }

        try {
            await adminRoleService.setAdminRole(interaction.guildId!, role.id);

            const embed = new EmbedBuilder().setColor(0xff9900).setTitle('관리자 역할 선택').setDescription(`관리자 역할이 **${role.name}**(으)로 설정되었습니다.`);

            return {
                success: true,
                embeds: [embed],
                content: ``,
            };
        } catch (error) {
            console.error('Error setting admin role:', error);
            return {
                success: false,
                content: '관리자 역할 설정 중 오류가 발생했습니다.',
            };
        }
    }
}

commandRegistry.registerCommand(new SetAdminRoleCommand());
