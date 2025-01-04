import {folderImport} from './src/utils/folder-importer.util';
await folderImport('facilities');
await folderImport('commands');

const events = await folderImport('events');
const interactions = await folderImport('interactions');

import {Client, GatewayIntentBits, Partials, Events, ButtonInteraction, type Interaction} from 'discord.js';
import {CommandRegistry} from './src/core/CommandRegistry';

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.DirectMessages],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

const commandRegistry = CommandRegistry.getInstance();

client.once('ready', async () => {
    console.log(`Logged in as ${client.user?.tag}`);

    await commandRegistry.registerWithClient(client, process.env.DISCORD_TOKEN!);

    for (const e of events) {
        const event = e as {default?: (client: Client) => {}};

        if (typeof event.default === 'function') event.default(client);
    }
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isChatInputCommand()) {
        const command = commandRegistry.getCommand(interaction.commandName);

        if (command) {
            try {
                const result = await command.execute(interaction);

                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: result.content,
                        embeds: result.embeds || [],
                        components: result.components || [],
                        ephemeral: result.ephemeral,
                    });
                }
            } catch (error) {
                console.error(error);

                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: `오류가 발생했어요!`,
                        ephemeral: true,
                    });
                }
            }
        }
    } else {
        for (const e of interactions) {
            const event = e as {default?: (interaction: Interaction) => {}};

            if (typeof event.default === 'function') event.default(interaction);
        }
    }
});

client.on(Events.Error, (err) => {
    console.error(err);
});

client.login(process.env.DISCORD_TOKEN);
