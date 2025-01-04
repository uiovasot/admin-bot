import {PermissionsBitField, type Client} from 'discord.js';
import {emergencyService} from '../services/emergency.service';

export default function setup(client: Client) {
    client.on('messageCreate', async (message) => {
        const guild = message.guild;

        if (!guild) return;
        if (!emergencyService.emergencyServer.has(guild.id)) return;

        if (message.author.bot) return;
        if (!message.member!.permissions.has(PermissionsBitField.Flags.Administrator)) return;

        await message.delete();
    });
}
