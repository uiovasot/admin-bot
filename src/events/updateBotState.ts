import {ActivityType, type Client} from 'discord.js';

let client: Client;

async function UpdateState() {
    client.user!.setPresence({
        activities: [
            {
                name: `${client.guilds.cache.size}곳의 서버를 독재`,
                type: ActivityType.Playing,
            },
        ],
        status: 'online',
    });
}

export function UpdateBotState(name: string, type: ActivityType) {
    if (client)
        client.user!.setPresence({
            activities: [
                {
                    name,
                    type,
                },
            ],
            status: 'online',
        });
}

export default function setup(_client: Client) {
    client = _client;

    UpdateState();

    setInterval(UpdateState, 1000 * 150);
}
