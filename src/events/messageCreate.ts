import type {Client} from 'discord.js';
import {experienceService} from '../services/experience.service';
import {settingService} from '../services/settings.service';

const cooldowns = new Map<string, number>();

export default function setup(client: Client) {
    client.on('messageCreate', async (message) => {
        if (message.author.bot || !message.guild) return;

        const serverId = message.guild.id;
        const userId = message.author.id;

        const settings = await settingService.getSettings(serverId);

        const lastMessageTimestamp = cooldowns.get(userId) || 0;
        const now = Date.now();

        if (now - lastMessageTimestamp < settings.messageCooldown * 1000) return;

        cooldowns.set(userId, now);

        await experienceService.addUserExperience(userId, serverId, settings.messageExperience);
    });
}
