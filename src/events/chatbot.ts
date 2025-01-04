import {Client, Message, Role} from 'discord.js';
import OpenAI from 'openai';
import {botConfig} from '../config/bot.config';
import type {ChatCompletionMessageParam} from 'openai/resources/index.mjs';
import {prisma} from '../../prisma';

const openai = process.env.OPENAI_API_KEY
    ? new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
      })
    : null;

export const chatbotCommand = async (client: Client, message: Message) => {
    if (!openai) {
        message.reply('I need to Api Key.');
        return;
    }

    const userMessage = message.content.replace(botConfig.prefix, '').trim();

    if (!userMessage) {
        message.reply('왜');
        return;
    }

    await prisma.conversationLog.create({
        data: {userId: message.author.id, role: 'user', message: userMessage},
    });

    const recentMessages = await prisma.conversationLog.findMany({
        where: {userId: message.author.id},
        orderBy: {
            createdAt: 'desc',
        },
        take: 40,
    });

    const messages: ChatCompletionMessageParam[] = [
        {
            role: 'system',
            content: "'''관리봇''' is a realistic but also cynical chatbot.",
        },
        ...recentMessages.reverse().map((log, index) => ({
            role: (log.role || ('user' as const)) as 'user' | 'assistant' | 'system',
            content: log.message,
        })),
        {role: 'user' as const, content: userMessage},
    ];

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages,
        });

        const botReply = response.choices[0]?.message?.content;

        if (botReply) {
            await prisma.conversationLog.create({
                data: {
                    userId: message.author.id,
                    role: 'assistant',
                    message: botReply,
                },
            });
        }

        message.reply(botReply || "I'm speechless... literally.");
    } catch (error) {
        console.error('Error with OpenAI API:', error);
        message.reply('살짝 머리가 아프네요! 지금은 좀 쉬고 싶어서 나중에 말하세요.');
    }
};

export default function setup(client: Client) {
    client.on('messageCreate', async (message) => {
        if (message.author.bot) return;

        if (!message.content.startsWith(botConfig.prefix)) return;

        chatbotCommand(client, message);
    });
}
