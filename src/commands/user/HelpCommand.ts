import {ChatInputCommandInteraction, EmbedBuilder} from 'discord.js';
import {BaseCommand} from '../../core/BaseCommand';
import type {CommandResult} from '../../types/command.types';
import {botConfig} from '../../config/bot.config';
import {CommandRegistry} from '../../core/CommandRegistry';

const commandRegistry = CommandRegistry.getInstance();

export class HelpCommand extends BaseCommand {
    constructor() {
        super({
            name: '도움말',
            description: '도움말을 표시합니다.',
        });
    }

    protected async handleCommand(interaction: ChatInputCommandInteraction): Promise<CommandResult> {
        const embed = new EmbedBuilder()
            .setColor(0x00ae86)
            .setTitle(`도움말`)
            .setDescription(botConfig.helpText)
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

commandRegistry.registerCommand(new HelpCommand());
