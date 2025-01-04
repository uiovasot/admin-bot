import {ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, PermissionsBitField, GuildMember} from 'discord.js';
import {BaseCommand} from '../../core/BaseCommand';
import type {CommandResult} from '../../types/command.types';
import {CommandRegistry} from '../../core/CommandRegistry';
import {timeoutUsers} from '../../events/lol';

const commandRegistry = CommandRegistry.getInstance();

export class IamBusyCommand extends BaseCommand {
    constructor() {
        super({
            name: '나바빠',
            description: '너무 바쁜데 봇이 귀찮게 탐아하거나 그럴때 쓰는거',
            requiresTextChannel: false,
        });

        this.data.setName('나바빠').setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator).setDescription('너무 바쁜데 봇이 귀찮게 탐아하거나 그럴때 쓰는거');
    }

    protected async handleCommand(interaction: ChatInputCommandInteraction): Promise<CommandResult> {
        if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator)) {
            return {
                success: false,
                content: '당신, 관리자 아니야',
            };
        }

        if (!interaction.member || !(interaction.member instanceof GuildMember)) {
            return {
                success: false,
                content: '유저를 찾을 수 없습니다.',
            };
        }

        if (timeoutUsers[interaction.member.id]) {
            timeoutUsers[interaction.member.id] = false;
        }

        try {
            try {
                await interaction.member.timeout(null, '나바빠');
            } catch (error) {
                console.error('Error applying timeout:', error);
            }

            const embed = new EmbedBuilder()
                .setColor(0xff9900)
                .setTitle('바쁘답니다')
                .setDescription(`${interaction.member.displayName}님께서 바쁘시답니다.`)
                .addFields({name: '사유', value: '바쁘다고', inline: false});

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

commandRegistry.registerCommand(new IamBusyCommand());
