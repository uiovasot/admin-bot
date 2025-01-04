import {ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder} from 'discord.js';
import {BaseCommand} from '../../core/BaseCommand';
import type {CommandResult} from '../../types/command.types';
import {CommandRegistry} from '../../core/CommandRegistry';
import {prisma} from '../../../prisma';

const commandRegistry = CommandRegistry.getInstance();

export class GamblingCommand extends BaseCommand {
    constructor() {
        super({
            name: '도박',
            description: '돈을 걸고 도박을 합니다. 50% 확률로 2배를 얻거나 전부 잃습니다.',
            requiresTextChannel: true,
        });

        this.data
            .setName('도박')
            .setDescription('돈을 걸고 도박을 합니다. 50% 확률로 2배를 얻거나 전부 잃습니다.')
            .addIntegerOption((option) => option.setName('금액').setDescription('도박에 걸 금액').setRequired(true).setMinValue(1));
    }

    protected async handleCommand(interaction: ChatInputCommandInteraction): Promise<CommandResult> {
        const userId = interaction.user.id;
        const betAmount = interaction.options.getInteger('금액', true);

        let user = await prisma.users.findUnique({where: {id: userId}});
        if (!user) {
            return {
                success: false,
                content: '낚시를 적어도 한번은 하셔야 해요!',
            };
        }

        if (user.money < betAmount) {
            return {
                success: false,
                content: `도박에 걸 돈이 부족합니다. 현재 보유금: ${user.money}원`,
            };
        }

        const isWin = Math.random() < 0.5;

        if (isWin) {
            const winAmount = betAmount;
            user = await prisma.users.update({
                where: {id: userId},
                data: {
                    money: {
                        increment: winAmount,
                    },
                    totalAssets: {
                        increment: winAmount,
                    },
                },
            });

            const embed = new EmbedBuilder()
                .setColor(0x00ae86)
                .setTitle('도박 성공')
                .setDescription(`🎉 도박에서 이겼습니다! ${winAmount}원을 얻었습니다.\n\n현재 보유금: ${user.money}원`);

            return {
                success: true,
                embeds: [embed],
                content: ``,
            };
        } else {
            user = await prisma.users.update({
                where: {id: userId},
                data: {
                    money: {
                        increment: -betAmount,
                    },
                    totalAssets: {
                        increment: -betAmount,
                    },
                },
            });

            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('도박 실패')
                .setDescription(`😢 도박에서 졌습니다... ${betAmount}원을 잃었습니다.\n\n현재 보유금: ${user.money}원`);

            return {
                success: false,
                embeds: [embed],
                content: '',
            };
        }
    }
}

commandRegistry.registerCommand(new GamblingCommand());
