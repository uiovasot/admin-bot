import {ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, PermissionsBitField} from 'discord.js';
import {BaseCommand} from '../../core/BaseCommand';
import type {CommandResult} from '../../types/command.types';
import {CommandRegistry} from '../../core/CommandRegistry';
import {timeoutUser, timeoutUsers} from '../../events/lol';

const commandRegistry = CommandRegistry.getInstance();

export class TimeoutCommand extends BaseCommand {
    constructor() {
        super({
            name: '타임아웃',
            description: '유저에게 타임아웃을 설정합니다.',
            requiresTextChannel: false,
        });

        this.data
            .setName('타임아웃')
            .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers)
            .setDescription('유저에게 타임아웃을 설정합니다.')
            .addUserOption((option) => option.setName('유저').setDescription('타임아웃할 유저').setRequired(true))
            .addIntegerOption((option) => option.setName('기간').setDescription('타임아웃 기간 (초)').setRequired(true).setMinValue(1))
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
        const durationInSeconds = interaction.options.getInteger('기간', true);
        const reason = interaction.options.getString('사유') || '사유 없음';

        const durationInMs = durationInSeconds * 1000;

        const member = await interaction.guild?.members.fetch(targetUser.id);
        if (!member) {
            return {
                success: false,
                content: '유저를 찾을 수 없습니다.',
            };
        }

        try {
            await member.timeout(durationInMs, reason);

            const embed = new EmbedBuilder()
                .setColor(0xff9900)
                .setTitle('타임아웃 적용')
                .setDescription(`${targetUser}님에게 ${durationInSeconds}초 동안 타임아웃이 적용되었습니다.`)
                .addFields({name: '사유', value: reason, inline: false});

            return {
                success: true,
                embeds: [embed],
                content: '',
            };
        } catch (error) {
            console.error('Error applying timeout:', error);
            timeoutUser(member.id, durationInMs);

            const embed = new EmbedBuilder()
                .setColor(0xff9900)
                .setTitle('가짜 타임아웃 적용')
                .setDescription(`${targetUser}님에게 ${durationInSeconds}초 동안 가짜 타임아웃이 적용되었습니다.`)
                .addFields({name: '사유', value: reason, inline: false});

            return {
                success: true,
                embeds: [embed],
                content: '',
            };
        }
    }
}

commandRegistry.registerCommand(new TimeoutCommand());
