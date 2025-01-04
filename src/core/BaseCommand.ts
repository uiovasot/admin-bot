import {ChatInputCommandInteraction, SlashCommandBuilder} from 'discord.js';
import type {CommandOptions, CommandResult, ICommand} from '../types/command.types';
import {requireTextChannel} from '../utils/command.utils';

export abstract class BaseCommand implements ICommand {
    public readonly data: SlashCommandBuilder;
    private readonly requiresTextChannel: boolean;

    constructor(options: CommandOptions) {
        this.data = new SlashCommandBuilder().setName(options.name).setDescription(options.description);
        this.requiresTextChannel = options.requiresTextChannel ?? false;
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<CommandResult> {
        if (this.requiresTextChannel) {
            const checkResult = requireTextChannel(interaction);
            if (checkResult) return checkResult;
        }

        return this.handleCommand(interaction);
    }

    protected abstract handleCommand(interaction: ChatInputCommandInteraction): Promise<CommandResult>;
}
