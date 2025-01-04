import {Client, REST, Routes} from 'discord.js';
import type {ICommand} from '../types/command.types';

export class CommandRegistry {
    private static instance: CommandRegistry;
    private commands: Map<string, ICommand> = new Map();

    private constructor() {}

    static getInstance(): CommandRegistry {
        if (!CommandRegistry.instance) {
            CommandRegistry.instance = new CommandRegistry();
        }
        return CommandRegistry.instance;
    }

    registerCommand(command: ICommand) {
        this.commands.set(command.data.name, command);
    }

    getCommand(name: string): ICommand | undefined {
        return this.commands.get(name);
    }

    getAllCommands(): ICommand[] {
        return Array.from(this.commands.values());
    }

    async registerWithClient(client: Client, token: string) {
        const rest = new REST().setToken(token);
        const commandData = this.getAllCommands().map((cmd) => cmd.data.toJSON());

        try {
            console.log('Started refreshing application (/) commands.');
            await rest.put(Routes.applicationCommands(client.user?.id || ''), {body: commandData});
            console.log('Successfully reloaded application (/) commands.');
        } catch (error) {
            console.error('Error refreshing commands:', error);
        }
    }
}
