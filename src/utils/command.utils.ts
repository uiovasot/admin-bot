import {ChatInputCommandInteraction, TextChannel} from 'discord.js';
import type {CommandResult} from '../types/command.types';

export function createCommandResult(content: string, success = true, ephemeral = false): CommandResult {
    return {content, success, ephemeral};
}

export function isTextChannel(interaction: ChatInputCommandInteraction): boolean {
    return interaction.channel instanceof TextChannel;
}

export function requireTextChannel(interaction: ChatInputCommandInteraction): CommandResult | null {
    if (!isTextChannel(interaction)) {
        return createCommandResult('이 채널에서는 이 명령어를 사용할 수 없습니다!', false, true);
    }
    return null;
}
