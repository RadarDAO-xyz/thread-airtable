const { Client } = require("discord.js");

const DiscordClient = new Client({
    intents: ["Guilds"]
});

DiscordClient.login(process.env.DISCORD_BOT_TOKEN);

module.exports = DiscordClient;
