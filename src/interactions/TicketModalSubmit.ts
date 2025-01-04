import {ChannelType, GuildMember, ModalSubmitInteraction, type OverwriteResolvable, type PermissionOverwriteOptions} from 'discord.js';
import {ticketService} from '../services/ticket.service';
import {adminRoleService} from '../services/adminRole.service';

export default async function handleTicketModalSubmit(interaction: ModalSubmitInteraction): Promise<void> {
    if (interaction.customId === 'ticket-modal') {
        const ticketType = interaction.fields.getTextInputValue('ticket-type').toLowerCase();
        const ticketReason = interaction.fields.getTextInputValue('ticket-reason');

        const guild = interaction.guild;
        const member = interaction.member;

        if (!guild || !member) {
            await interaction.reply({content: '티켓 생성을 처리할 수 없습니다.', ephemeral: true});
            return;
        }

        const categoryId = await ticketService.getTicketCategory(guild.id);

        if (!categoryId) {
            await interaction.reply({content: '티켓 카테고리가 설정되지 않았습니다.', ephemeral: true});
            return;
        }

        const permissionOverwrites: OverwriteResolvable[] = [
            {
                id: guild.roles.everyone.id,
                deny: ['ViewChannel'],
            },
            {id: (member as GuildMember).id, allow: ['ViewChannel']},
        ];

        if (ticketType === '공개') {
            permissionOverwrites.push({id: guild.roles.everyone.id, allow: ['ViewChannel']});
        } else if (ticketType === '관리자') {
            const adminRole = (await adminRoleService.getAdminRole(guild.id)) || guild.roles.cache.find((role) => role.name === '관리자')?.id;

            if (adminRole) {
                permissionOverwrites.push({id: adminRole, allow: ['ViewChannel']});
            }
        }

        const ticketChannel = await guild.channels.create({
            name: `티켓-${interaction.user.username}`,
            type: ChannelType.GuildText,
            parent: categoryId,
            permissionOverwrites,
            topic: `사유: ${ticketReason}`,
        });

        await interaction.reply({
            content: `${ticketChannel} 채널이 생성되었습니다.`,
            ephemeral: true,
        });

        await ticketChannel.send({
            content: `${member}, 티켓이 생성되었습니다.\n사유: ${ticketReason}`,
        });
    }
}
