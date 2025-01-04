import {prisma} from '../../prisma';

export class ExperienceService {
    async getUserExperience(userId: string, guildId: string) {
        const record = await prisma.userExperience.findUnique({
            where: {userId_guildId: {userId, guildId}},
        });
        return record ?? {experience: 0, level: 1};
    }

    async addUserExperience(userId: string, guildId: string, amount: number) {
        const record = await prisma.userExperience.upsert({
            where: {userId_guildId: {userId, guildId}},
            create: {userId, guildId, experience: Math.max(0, amount)},
            update: {experience: {increment: amount}},
        });

        return await this.checkLevelUp(record.id, guildId);
    }

    async getUserRank(experience: number | bigint, guildId: string) {
        const higherRankedUsers = await prisma.userExperience.count({
            where: {guildId, experience: {gt: experience}},
        });

        return higherRankedUsers + 1;
    }

    async transferExperience(giverId: string, receiverId: string, guildId: string, amount: number) {
        const giver = await prisma.userExperience.findUnique({
            where: {userId_guildId: {userId: giverId, guildId}},
        });
        if (!giver || giver.experience < amount) {
            throw new Error('경험치가 부족합니다.');
        }

        await prisma.userExperience.update({
            where: {userId_guildId: {userId: giverId, guildId}},
            data: {experience: {decrement: amount}},
        });

        const receiver = await prisma.userExperience.upsert({
            where: {userId_guildId: {userId: receiverId, guildId}},
            create: {userId: receiverId, guildId, experience: amount},
            update: {experience: {increment: amount}},
        });

        await this.checkLevelUp(giver.id, guildId);
        await this.checkLevelUp(receiver.id, guildId);

        return {giver, receiver};
    }

    async checkLevelUp(userId: number, guildId: string) {
        const user = await prisma.userExperience.findUnique({where: {id: userId}});
        if (!user) return null;

        const newLevel = this.calcLevel(Number(user.experience));

        if (user.level < newLevel) {
            await prisma.userExperience.update({
                where: {id: userId},
                data: {level: newLevel},
            });

            const rewards = await prisma.roleReward.findMany({
                where: {level: newLevel, guildId},
            });

            return {levelUp: true, newLevel, rewards};
        }

        return {levelUp: false, currentLevel: user.level};
    }

    calcLevel(exp: number): number {
        let level = 1;

        for (level; Math.ceil(3 * Math.pow(level + 1, 3) - 2 * level + 1) <= exp; level++);

        return level;
    }

    async setRoleReward(level: number, roleId: string, guildId: string) {
        const reward = await prisma.roleReward.upsert({
            where: {roleId_guildId_level: {roleId, guildId, level}},
            create: {level, roleId, guildId},
            update: {roleId},
        });
        return reward;
    }
}

export const experienceService = new ExperienceService();
