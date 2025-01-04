import {ChatInputCommandInteraction, SlashCommandBuilder, PermissionsBitField, EmbedBuilder} from 'discord.js';
import {BaseCommand} from '../../core/BaseCommand';
import type {CommandResult} from '../../types/command.types';
import {CommandRegistry} from '../../core/CommandRegistry';
import {experienceService} from '../../services/experience.service';

const commandRegistry = CommandRegistry.getInstance();

export class ExperienceCommand extends BaseCommand {
    constructor() {
        super({
            name: '경험치',
            description: '경험치 관련 명령어',
            requiresTextChannel: true,
        });

        this.data
            .setName('경험치')
            .setDescription('경험치 시스템 관련 명령어')
            .addSubcommand((sub) => sub.setName('내정보').setDescription('내 경험치를 확인합니다.'))
            .addSubcommand((sub) =>
                sub
                    .setName('확인')
                    .setDescription('다른 사람의 경험치를 확인합니다.')
                    .addUserOption((option) => option.setName('유저').setDescription('경험치를 확인할 유저').setRequired(true)),
            )
            .addSubcommand((sub) =>
                sub
                    .setName('선물')
                    .setDescription('경험치를 선물합니다.')
                    .addUserOption((option) => option.setName('유저').setDescription('선물할 대상').setRequired(true))
                    .addIntegerOption((option) => option.setName('양').setDescription('선물할 양').setRequired(true)),
            )
            .addSubcommand((sub) =>
                sub
                    .setName('추가')
                    .setDescription('경험치를 추가합니다 (관리자만 가능).')
                    .addUserOption((option) => option.setName('유저').setDescription('경험치를 추가할 유저').setRequired(true))
                    .addIntegerOption((option) => option.setName('양').setDescription('추가할 경험치 양').setRequired(true)),
            )
            .addSubcommand((sub) =>
                sub
                    .setName('제거')
                    .setDescription('경험치를 제거합니다 (관리자만 가능).')
                    .addUserOption((option) => option.setName('유저').setDescription('경험치를 제거할 유저').setRequired(true))
                    .addIntegerOption((option) => option.setName('양').setDescription('제거할 경험치 양').setRequired(true)),
            );
    }

    private embed(
        {
            experience,
            level,
        }: {
            experience: number | bigint;
            level: number;
        },
        rank: number,
        displayName: string,
    ) {
        const embed = new EmbedBuilder()
            .setColor(0x00ae86)
            .setTitle(displayName + ' 정보')
            .addFields(
                {name: '경험치', value: `${experience}exp`, inline: true},
                {name: '레벨', value: '' + level, inline: true},
                {name: '랭크', value: '#' + rank, inline: false},
            );

        return embed;
    }

    protected async handleCommand(interaction: ChatInputCommandInteraction): Promise<CommandResult> {
        const subCommand = interaction.options.getSubcommand();
        const guildId = interaction.guild?.id;
        const userId = interaction.user.id;

        if (!guildId) {
            return {success: false, content: '서버에서만 사용할 수 있는 명령어입니다.'};
        }

        try {
            switch (subCommand) {
                case '내정보': {
                    const experience = await experienceService.getUserExperience(userId, guildId);
                    const rank = await experienceService.getUserRank(experience.experience, guildId);

                    return {success: true, content: '', embeds: [this.embed(experience, rank, interaction.user.displayName)]};
                }

                case '확인': {
                    const targetUser = interaction.options.getUser('유저', true);
                    const experience = await experienceService.getUserExperience(targetUser.id, guildId);
                    const rank = await experienceService.getUserRank(experience.experience, guildId);

                    return {success: true, content: '', embeds: [this.embed(experience, rank, targetUser.displayName)]};
                }

                case '선물': {
                    const targetUser = interaction.options.getUser('유저', true);
                    const amount = interaction.options.getInteger('양', true);

                    try {
                        const {giver, receiver} = await experienceService.transferExperience(interaction.user.id, targetUser.id, guildId, amount);

                        const embed = new EmbedBuilder()
                            .setColor(0x00ae86)
                            .setTitle('경험치 선물')
                            .addFields(
                                {name: '보낸 사람', value: `${interaction.user.username}`, inline: true},
                                {name: '받은 사람', value: `${targetUser.username}`, inline: true},
                                {name: '선물한 경험치', value: `${amount}`, inline: true},
                            );

                        return {success: true, content: '', embeds: [embed]};
                    } catch (error) {
                        return {success: false, content: (error as {message: string}).message};
                    }
                }

                case '추가': {
                    if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator)) {
                        return {success: false, content: '이 명령어를 사용할 권한이 없습니다.'};
                    }

                    const targetUser = interaction.options.getUser('유저', true);
                    const amount = interaction.options.getInteger('양', true);
                    const newExperience = await experienceService.addUserExperience(targetUser.id, guildId, amount);
                    return {
                        success: true,
                        content: `${targetUser.username}님의 경험치가 ${amount}만큼 추가되었습니다.`,
                    };
                }

                case '제거': {
                    if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator)) {
                        return {success: false, content: '이 명령어를 사용할 권한이 없습니다.'};
                    }

                    const targetUser = interaction.options.getUser('유저', true);
                    const amount = interaction.options.getInteger('양', true);
                    const newExperience = await experienceService.addUserExperience(targetUser.id, guildId, -amount);
                    return {
                        success: true,
                        content: `${targetUser.username}님의 경험치가 ${amount}만큼 제거되었습니다.`,
                    };
                }

                default:
                    return {success: false, content: '알 수 없는 명령어입니다.'};
            }
        } catch (error) {
            console.error(error);
            return {success: false, content: '명령어 처리 중 오류가 발생했습니다.'};
        }
    }
}

commandRegistry.registerCommand(new ExperienceCommand());
