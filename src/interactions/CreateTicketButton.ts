import {ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonInteraction} from 'discord.js';

export default async function handleCreateTicketButton(interaction: ButtonInteraction): Promise<void> {
    if (interaction.customId === 'create-ticket') {
        const modal = new ModalBuilder().setCustomId('ticket-modal').setTitle('티켓 생성');

        const typeInput = new TextInputBuilder()
            .setCustomId('ticket-type')
            .setLabel('티켓 유형 (공개, 관리자, 개인)')
            .setPlaceholder('공개 / 관리자 / 개인')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const reasonInput = new TextInputBuilder()
            .setCustomId('ticket-reason')
            .setLabel('티켓 생성 사유')
            .setPlaceholder('티켓 생성 사유를 입력하세요.')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const typeRow = new ActionRowBuilder<TextInputBuilder>().addComponents(typeInput);
        const reasonRow = new ActionRowBuilder<TextInputBuilder>().addComponents(reasonInput);

        modal.addComponents(typeRow, reasonRow);

        await interaction.showModal(modal);
    }
}
