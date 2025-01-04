import {ChatInputCommandInteraction} from 'discord.js';
import {BaseCommand} from '../../core/BaseCommand';
import type {CommandResult} from '../../types/command.types';
import {gameConfig} from '../../config/game.config';
import {fishingService} from '../../services/fishing.service';
import {CommandRegistry} from '../../core/CommandRegistry';

const commandRegistry = CommandRegistry.getInstance();

export class ChangeFishingSpotTerrainCommand extends BaseCommand {
    constructor() {
        super({
            name: '지형변경',
            description: '낚시터의 지형을 변경합니다.',
        });

        this.data.addIntegerOption((option) =>
            option
                .setName('지형')
                .setDescription('낚시터 지형')
                .setRequired(true)
                .addChoices(gameConfig.terrains.map((terrain, index) => ({name: terrain.name, value: index}))),
        );
    }

    protected async handleCommand(interaction: ChatInputCommandInteraction): Promise<CommandResult> {
        const terrain = interaction.options.getInteger('지형', true);
        const result = await fishingService.setSpotTerrain(interaction.channelId, interaction.user.id, terrain);

        if (!result.success) {
            return {
                content: result.error || '',
                success: false,
                ephemeral: true,
            };
        }

        return {
            content: `지형이 ${gameConfig.terrains[terrain].name}(으)로 설정되었습니다!`,
            success: true,
        };
    }
}

commandRegistry.registerCommand(new ChangeFishingSpotTerrainCommand());
