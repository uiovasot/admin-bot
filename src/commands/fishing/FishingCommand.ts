import {ChatInputCommandInteraction, EmbedBuilder} from 'discord.js';
import {BaseCommand} from '../../core/BaseCommand';
import type {CommandResult} from '../../types/command.types';
import {fishingService} from '../../services/fishing.service';
import {ButtonStyle} from 'discord.js';
import {ActionRowBuilder, ButtonBuilder} from '@discordjs/builders';
import {CommandRegistry} from '../../core/CommandRegistry';

const commandRegistry = CommandRegistry.getInstance();

export class FishingCommand extends BaseCommand {
    constructor() {
        super({
            name: '낚시',
            description: '낚시를 시작합니다',
            requiresTextChannel: true,
        });
    }

    protected async handleCommand(interaction: ChatInputCommandInteraction): Promise<CommandResult> {
        const userId = interaction.user.id;
        const channelId = interaction.channelId;

        if (fishingService.isFishing(userId)) {
            return {
                content: '이미 낚시중이시잖아요!',
                success: false,
                ephemeral: true,
            };
        }

        const startResult = await fishingService.startFishing(userId, channelId);
        if (!startResult.success) {
            return {
                content: startResult.error || '',
                success: false,
                ephemeral: true,
            };
        }

        const catchRow = new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setCustomId('catch_fish').setLabel('낚싯줄 당기기').setStyle(ButtonStyle.Primary));

        const embed = new EmbedBuilder().setTitle('낚시 시작').setDescription('낚시를 시작합니다! 🎣').setColor(0x00ae86);

        const response = await interaction.reply({
            embeds: [embed],
            components: [catchRow],
            fetchReply: true,
        });

        const state = fishingService.getFishingState(userId);
        if (!state) {
            return {
                content: '낚시를 시작할 수 없습니다.',
                success: false,
                ephemeral: true,
            };
        }

        const waitTime = state.waitTime;
        const biteTime = state.biteTime;

        state.timers.push(
            setTimeout(async () => {
                if (fishingService.isFishing(userId)) {
                    const biteEmbed = new EmbedBuilder().setTitle('물고기 발견').setDescription('물고기가 있는 것 같아요!').setColor(0x00ae86);

                    await response.edit({
                        embeds: [biteEmbed],
                        components: [catchRow],
                    });

                    state.timers.push(
                        setTimeout(async () => {
                            if (fishingService.isFishing(userId)) {
                                fishingService.setBitedTime(userId);

                                const caughtEmbed = new EmbedBuilder().setTitle('물고기 물림').setDescription('물고기가 물었다! 잠시 기다렸다가 잡아라! 🎣').setColor(0x00ae86);

                                await response.edit({
                                    embeds: [caughtEmbed],
                                    components: [catchRow],
                                });

                                state.timers.push(
                                    setTimeout(async () => {
                                        if (fishingService.isFishing(userId)) {
                                            fishingService.endFishing(userId);

                                            const escapeEmbed = new EmbedBuilder().setTitle('물고기 도망').setDescription('물고기가 도망갔습니다... 😢').setColor(0xff0000);

                                            await response.edit({
                                                embeds: [escapeEmbed],
                                                components: [],
                                            });
                                        }
                                    }, 5000),
                                );
                            }
                        }, biteTime),
                    );
                }
            }, waitTime),
        );

        return {
            content: '낚시를 시작합니다! 🎣',
            success: true,
        };
    }
}

commandRegistry.registerCommand(new FishingCommand());
