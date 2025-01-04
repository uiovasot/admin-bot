import {ChatInputCommandInteraction, ButtonBuilder, ActionRowBuilder, ButtonStyle, EmbedBuilder, ComponentType, ButtonInteraction} from 'discord.js';
import {BaseCommand} from '../../core/BaseCommand';
import type {CommandResult} from '../../types/command.types';
import {CommandRegistry} from '../../core/CommandRegistry';
import {prisma} from '../../../prisma';

const commandRegistry = CommandRegistry.getInstance();

export class MoneyReceiveCommand extends BaseCommand {
    private cooldowns: Map<string, number> = new Map();

    constructor() {
        super({
            name: '돈받기',
            description: '간단한 수학문제를 풀어 돈을 받습니다',
            requiresTextChannel: true,
        });
    }

    protected async handleCommand(interaction: ChatInputCommandInteraction): Promise<CommandResult> {
        const userId = interaction.user.id;

        const lastUsed = this.cooldowns.get(userId);
        if (lastUsed && Date.now() - lastUsed < 60000) {
            const remainingTime = Math.ceil((60000 - (Date.now() - lastUsed)) / 1000);
            return {
                success: false,
                content: `아직 명령어를 사용할 수 없습니다. ${remainingTime}초 후에 다시 시도해주세요.`,
                ephemeral: true,
            };
        }

        const num1 = Math.floor(Math.random() * 4) + 1;
        const num2 = Math.floor(Math.random() * 7) + 1;
        const isAddition = Math.random() < 0.5;

        const correctAnswer = isAddition ? num1 + num2 : num1 - num2;
        const operator = isAddition ? '+' : '-';
        const problem = `${num1} ${operator} ${num2}`;

        const answers = this.generateAnswerOptions(correctAnswer);

        const buttons = answers.map((answer) => new ButtonBuilder().setCustomId(`answer_${answer}`).setLabel(answer.toString()).setStyle(ButtonStyle.Primary));

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);

        const embed = new EmbedBuilder()
            .setColor(0x00ae86)
            .setTitle('💰 돈받기 퀴즈')
            .setDescription(`다음 수학 문제를 풀어주세요!\n\n**${problem} = ?**`)
            .setFooter({text: '15초 안에 답을 선택해주세요!'});

        const response = await interaction.reply({
            embeds: [embed],
            components: [row],
            fetchReply: true,
        });

        try {
            const buttonInteraction = await response.awaitMessageComponent({
                filter: (i) => i.user.id === interaction.user.id,
                time: 15000,
                componentType: ComponentType.Button,
            });

            const selectedAnswer = parseInt(buttonInteraction.customId.split('_')[1]);

            this.cooldowns.set(userId, Date.now());

            if (selectedAnswer === correctAnswer) {
                const reward = Math.floor(Math.random() * 51) + 10;

                let user: {money: number};

                try {
                    user = await prisma.users.update({
                        where: {id: userId},
                        data: {
                            money: {
                                increment: reward,
                            },
                            totalAssets: {
                                increment: reward,
                            },
                        },
                    });
                } catch (error) {
                    return {
                        success: false,
                        content: '낚시를 적어도 한번은 하셔야 해요!',
                    };
                }

                const successEmbed = new EmbedBuilder()
                    .setColor(0x00ae86)
                    .setTitle('✅ 정답입니다!')
                    .setDescription(`🎉 ${reward}원을 받았습니다!\n\n현재 보유금: ${user.money}원`);

                await buttonInteraction.update({
                    embeds: [successEmbed],
                    components: [],
                });

                return {
                    success: true,
                    content: `정답입니다! ${reward}원을 받았습니다.`,
                };
            } else {
                await buttonInteraction.update({
                    embeds: [new EmbedBuilder().setColor('#ff0000').setTitle('❌ 틀렸습니다!').setDescription(`문제: ${problem} = ${correctAnswer}`)],
                    components: [],
                });

                return {
                    success: false,
                    content: `틀렸습니다! 정답은 ${correctAnswer}입니다.`,
                };
            }
        } catch (error) {
            const timeoutEmbed = new EmbedBuilder().setColor('#ff0000').setTitle('❌ 시간 초과').setDescription(`시간이 초과되었습니다.\n정답은 ${correctAnswer}였습니다.`);

            await interaction.editReply({
                embeds: [timeoutEmbed],
                components: [],
            });

            return {
                success: false,
                content: `시간이 초과되었습니다. 정답은 ${correctAnswer}였습니다.`,
            };
        }
    }

    private generateAnswerOptions(correctAnswer: number): number[] {
        const answers = new Set<number>();
        answers.add(correctAnswer);

        while (answers.size < 4) {
            const randomOffset = Math.floor(Math.random() * 10) - 5;
            const wrongAnswer = correctAnswer + randomOffset;
            if (wrongAnswer !== correctAnswer && wrongAnswer >= 0) {
                answers.add(wrongAnswer);
            }
        }

        return Array.from(answers).sort(() => Math.random() - 0.5);
    }
}

commandRegistry.registerCommand(new MoneyReceiveCommand());
