import {prisma} from '../../prisma';

export class EmergencyService {
    public emergencyServer = new Set<string>();

    constructor() {
        prisma.emergencyStatus.findMany({}).then((status) => {
            status.forEach((s) => {
                if (s.isEmergency) this.emergencyServer.add(s.guildId);
            });
        });
    }

    public async setEmergencyStatus(guildId: string, isEmergency: boolean) {
        const status = await prisma.emergencyStatus.upsert({
            where: {guildId},
            update: {isEmergency},
            create: {guildId, isEmergency},
        });

        if (isEmergency) this.emergencyServer.add(status.guildId);
        else this.emergencyServer.delete(status.guildId);

        return status;
    }

    public async getEmergencyStatus(guildId: string): Promise<boolean> {
        const status = await prisma.emergencyStatus.findUnique({
            where: {guildId},
        });
        return status?.isEmergency ?? false;
    }
}

export const emergencyService = new EmergencyService();
