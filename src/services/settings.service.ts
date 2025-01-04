import {prisma} from '../../prisma';

export class SettingsService {
    async getSettings(guildId: string) {
        const settings = await prisma.settings.upsert({
            where: {guildId},
            create: {
                guildId,
                messageExperience: 5,
                messageCooldown: 60,
                voiceChannelExperience: 10,
                voiceInterval: 5,
            },
            update: {},
        });
        return settings;
    }

    async updateSettings(
        guildId: string,
        data: Partial<{
            messageExperience: number;
            messageCooldown: number;
            voiceChannelExperience: number;
            voiceInterval: number;
        }>,
    ) {
        const updatedSettings = await prisma.settings.update({
            where: {guildId},
            data,
        });
        return updatedSettings;
    }
}

export const settingService = new SettingsService();
