import {prisma} from '../../prisma';

export class TicketService {
    async setTicketCategory(guildId: string, categoryId: string): Promise<void> {
        await prisma.ticketCategory.upsert({
            where: {guildId},
            update: {categoryId},
            create: {guildId, categoryId},
        });
    }

    async getTicketCategory(guildId: string): Promise<string | null> {
        const ticketCategory = await prisma.ticketCategory.findUnique({
            where: {guildId},
        });
        return ticketCategory?.categoryId || null;
    }
}

export const ticketService = new TicketService();
