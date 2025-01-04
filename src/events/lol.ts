import type {Client} from 'discord.js';
import {chatbotCommand} from './chatbot';

const messageCount: {[channelId: string]: {[userId: string]: number}} = {};
export const timeoutUsers: {[userId: string]: boolean} = {};
export const timeoutUsersTimer: {[userId: string]: NodeJS.Timeout} = {};

export function timeoutUser(userId: string, timeoutDuration: number) {
    if (timeoutUsersTimer[userId]) {
        clearTimeout(timeoutUsersTimer[userId]);
    }

    timeoutUsers[userId] = true;

    timeoutUsersTimer[userId] = setTimeout(() => {
        timeoutUsers[userId] = false;
    }, timeoutDuration) as NodeJS.Timeout;
}

const THRESHOLD = 10;
const RESET_INTERVAL = 13 * 1000;
const TIMEOUT_DAY = 30 * 60 * 1000;
const TIMEOUT_NIGHT = 8 * 60 * 60 * 1000;

function getTimeoutDuration() {
    const hour = new Date().getHours();
    return hour >= 7 && hour < 24 ? TIMEOUT_DAY : TIMEOUT_NIGHT;
}

export default function setup(client: Client) {
    setInterval(() => {
        for (const channelId in messageCount) {
            for (const userId in messageCount[channelId]) {
                messageCount[channelId][userId] = 0;
            }
        }
    }, RESET_INTERVAL);

    client.on('messageCreate', async (message) => {
        const channelId = message.channel.id;
        const userId = message.author.id;
        const guild = message.guild;

        if (!guild) return;

        if (timeoutUsers[userId]) {
            message.delete().catch(() => {});
            return;
        }

        if (message.author.bot) return;

        if (!messageCount[channelId]) {
            messageCount[channelId] = {};
        }

        messageCount[channelId][userId] = (messageCount[channelId][userId] || 0) + 1;

        if (messageCount[channelId][userId] > THRESHOLD) {
            const timeoutDuration = getTimeoutDuration();

            const member = await guild.members.fetch(userId).catch(() => null);

            if (member) {
                const hour = new Date().getHours();
                await member.timeout(timeoutDuration, '스팸 메시지로 인한 타임아웃').catch((err) => {
                    console.error(err);
                    message.channel.send(`<@${userId}> 저기, 내 잠을 방해하는 나쁜 놈을 타임아웃 할 수 없다니!!`);

                    timeoutUser(userId, timeoutDuration);
                });

                message.channel.send(`<@${userId}> 어허, 내 ${hour >= 7 && hour < 24 ? '낮' : ''}잠을 방해하다니! ${timeoutDuration / 1000 / 60}분 동안 타임아웃하겠다.`);
            } else {
                message.channel.send(`<@${userId}> 너 왜 없니`);
            }

            messageCount[channelId][userId] = 0;
        }

        if (message.mentions.has(client.user!)) {
            await chatbotCommand(client, message);
        }
    });
}
