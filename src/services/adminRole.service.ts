import {prisma} from '../../prisma';

export class AdminRoleService {
    async setAdminRole(guildId: string, roleId: string): Promise<void> {
        await prisma.adminRole.upsert({
            where: {guildId},
            update: {roleId},
            create: {guildId, roleId},
        });
    }

    async getAdminRole(guildId: string): Promise<string | null> {
        const adminRole = await prisma.adminRole.findUnique({
            where: {guildId},
        });
        return adminRole?.roleId || null;
    }
}

export const adminRoleService = new AdminRoleService();
