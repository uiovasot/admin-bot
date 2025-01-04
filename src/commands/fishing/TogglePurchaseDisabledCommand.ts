import {ChatInputCommandInteraction, PermissionFlagsBits} from 'discord.js';
import {BaseCommand} from '../../core/BaseCommand';
import type {CommandResult} from '../../types/command.types';
import {fishingService} from '../../services/fishing.service';
import {CommandRegistry} from '../../core/CommandRegistry';

const commandRegistry = CommandRegistry.getInstance();

export class TogglePurchaseDisabledCommand extends BaseCommand {
    constructor() {
        super({
            name: '매입금지',
            description: '낚시터의 매입 가능 여부를 설정합니다',
            requiresTextChannel: true,
        });
    }

    protected async handleCommand(interaction: ChatInputCommandInteraction): Promise<CommandResult> {
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
            return {
                content: '이 명령어를 사용하려면 채널 관리 권한이 필요합니다!',
                success: false,
                ephemeral: true,
            };
        }

        const result = await fishingService.togglePurchaseDisabled(interaction.channelId);

        if (!result.success) {
            return {
                content: result.error || '',
                success: false,
                ephemeral: true,
            };
        }

        return {
            content: result.isDisabled ? '이제 이 낚시터는 매입이 금지됩니다.' : '이제 이 낚시터는 매입이 가능합니다.',
            success: true,
        };
    }
}

commandRegistry.registerCommand(new TogglePurchaseDisabledCommand());
