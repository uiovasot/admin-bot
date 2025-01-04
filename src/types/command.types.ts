import {ActionRowBuilder, ButtonBuilder, ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder} from 'discord.js';

export interface CommandOptions {
    name: string;
    description: string;
    requiresTextChannel?: boolean;
}

export interface CommandResult {
    success: boolean;
    content: string;
    embeds?: EmbedBuilder[];
    components?: ActionRowBuilder<ButtonBuilder>[];
    ephemeral?: boolean;
}

export interface ICommand {
    data: SlashCommandBuilder;
    execute(interaction: ChatInputCommandInteraction): Promise<CommandResult>;
}
