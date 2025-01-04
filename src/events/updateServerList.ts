import type {Client} from 'discord.js';
import {prisma} from '../../prisma';

async function UpdateServerList(client: Client) {
    prisma.serverLists.deleteMany();

    client.guilds.cache.forEach((guild) => {
        prisma.serverLists.create({
            data: {
                id: guild.id,
                name: guild.name,
            },
        });
    });
}

export default function setup(client: Client) {
    UpdateServerList(client);

    setInterval(() => UpdateServerList(client), 1000 * 10);
}
