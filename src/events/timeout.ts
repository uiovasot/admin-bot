import {AuditLogEvent, type Client} from 'discord.js';
import {timeoutUser, timeoutUsers} from './lol';

const messageDeleteCount: {[channelId: string]: {[userId: string]: {count: number; timer?: NodeJS.Timeout}}} = {};

const DELETE_THRESHOLD = 3;
const DELETE_INTERVAL = 60 * 1000; // 1 minute
const TIMEOUT_DAY = 30 * 60 * 1000; // 30 minutes
const TIMEOUT_NIGHT = 8 * 60 * 60 * 1000; // 8 hours

function getTimeoutDuration() {
    const hour = new Date().getHours();
    return hour >= 7 && hour < 24 ? TIMEOUT_DAY : TIMEOUT_NIGHT;
}

export default function setup(client: Client) {
    client.on('messageDelete', async (message) => {
        if (!message.guild || !message.author || !message.author.bot || message.author.id !== client.user?.id) return;

        const auditLogs = await message.guild
            .fetchAuditLogs({
                type: AuditLogEvent.MessageDelete,
                limit: 1,
            })
            .catch(() => null);

        if (!auditLogs) return;

        const logEntry = auditLogs.entries.first();
        if (!logEntry || logEntry.target?.id !== client.user?.id || !logEntry.executor) return;

        const executorId = logEntry.executor.id;
        const channelId = message.channel.id;
        const guild = message.guild;

        if (!messageDeleteCount[channelId]) {
            messageDeleteCount[channelId] = {};
        }

        if (!messageDeleteCount[channelId][executorId]) {
            messageDeleteCount[channelId][executorId] = {count: 0};
        }

        const userDeleteData = messageDeleteCount[channelId][executorId];

        userDeleteData.count += 1;

        if (userDeleteData.timer) {
            clearTimeout(userDeleteData.timer);
        }
        userDeleteData.timer = setTimeout(() => {
            userDeleteData.count = 0;
        }, DELETE_INTERVAL) as NodeJS.Timeout;

        if (userDeleteData.count > DELETE_THRESHOLD) {
            const timeoutDuration = getTimeoutDuration();

            if (timeoutUsers[executorId]) return;

            const member = await guild.members.fetch(executorId).catch(() => null);

            if (member) {
                await member.timeout(timeoutDuration, '반복적인 메시지 삭제로 인한 타임아웃').catch((err) => {
                    console.error(err);
                    timeoutUser(executorId, timeoutDuration);
                    message.channel.send(`<@${executorId}> 타임아웃 설정 실패`);
                });

                message.channel.send(`<@${executorId}> 반복적인 메시지 삭제로 ${timeoutDuration / 1000 / 60}분 동안 타임아웃 처리되었습니다.`);
            } else {
                message.channel.send(`<@${executorId}> 멤버를 찾을 수 없습니다.`);
            }

            userDeleteData.count = 0;
        } else {
            message.channel.send(`<@${executorId}> 내 말 왜 지우노`);
        }
    });
}
