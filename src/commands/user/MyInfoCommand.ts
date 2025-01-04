import {ChatInputCommandInteraction, EmbedBuilder} from 'discord.js';
import {BaseCommand} from '../../core/BaseCommand';
import type {CommandResult} from '../../types/command.types';
import {CommandRegistry} from '../../core/CommandRegistry';
import {prisma} from '../../../prisma';

const commandRegistry = CommandRegistry.getInstance();

export class MyInfoCommand extends BaseCommand {
    constructor() {
        super({
            name: '내정보',
            description: '당신의 정보를 확인합니다',
        });
    }

    protected async handleCommand(interaction: ChatInputCommandInteraction): Promise<CommandResult> {
        let user = await prisma.users.findUnique({where: {id: interaction.user.id}});

        if (!user) {
            return {
                success: false,
                content: '낚시를 적어도 한번은 하셔야 해요!',
            };
        }

        const embed = new EmbedBuilder()
            .setColor(0x00ae86)
            .setTitle(`${user.username}님의 정보`)
            .addFields({name: '잡은 물고기', value: `${user.fishCaught}마리`}, {name: '보유 금액', value: `${user.money}원`}, {name: '총 자산', value: `${user.totalAssets}원`})
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

commandRegistry.registerCommand(new MyInfoCommand());
