import {ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, PermissionsBitField} from 'discord.js';
import {BaseCommand} from '../../core/BaseCommand';
import type {CommandResult} from '../../types/command.types';
import {CommandRegistry} from '../../core/CommandRegistry';
import {timeoutUsers} from '../../events/lol';

const commandRegistry = CommandRegistry.getInstance();

export class RemoveTimeoutCommand extends BaseCommand {
    constructor() {
        super({
            name: '타임아웃제거',
            description: '유저에게 타임아웃을 제거합니다.',
            requiresTextChannel: false,
        });

        this.data
            .setName('타임아웃제거')
            .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers)
            .setDescription('유저에게 타임아웃을 제거합니다.')
            .addUserOption((option) => option.setName('유저').setDescription('타임아웃할 유저').setRequired(true))
            .addStringOption((option) => option.setName('사유').setDescription('타임아웃 사유').setRequired(false));
    }

    protected async handleCommand(interaction: ChatInputCommandInteraction): Promise<CommandResult> {
        if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.ModerateMembers)) {
            return {
                success: false,
                content: '타임아웃을 사용하려면 "타임아웃" 권한이 필요합니다.',
            };
        }

        const targetUser = interaction.options.getUser('유저', true);
        const reason = interaction.options.getString('사유') || '사유 없음';

        const member = await interaction.guild?.members.fetch(targetUser.id);
        if (!member) {
            return {
                success: false,
                content: '유저를 찾을 수 없습니다.',
            };
        }

        if (timeoutUsers[targetUser.id]) {
            timeoutUsers[targetUser.id] = false;
        }

        try {
            try {
                await member.timeout(null, reason);
            } catch (error) {
                console.error('Error applying timeout:', error);
            }

            const embed = new EmbedBuilder()
                .setColor(0xff9900)
                .setTitle('타임아웃 제거')
                .setDescription(`${targetUser}님에게 타임아웃이 해제되었습니다.`)
                .addFields({name: '사유', value: reason, inline: false});

            return {
                success: true,
                embeds: [embed],
                content: '',
            };
        } catch (error) {
            console.error('Error applying timeout:', error);
            return {
                success: false,
                content: '타임아웃 적용 중 오류가 발생했습니다.',
            };
        }
    }
}

commandRegistry.registerCommand(new RemoveTimeoutCommand());
