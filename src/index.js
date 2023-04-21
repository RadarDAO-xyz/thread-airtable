require("dotenv").config();

const AirtableUtil = require("./util/AirtableUtil");
const DiscordClient = require("./util/discord");
const { resolveThreadStarter } = require("./util/DiscordUtil");

async function main() {
    console.log("Fetching tracked channels to sync from the airtable");
    const channels = AirtableUtil.normalizeChannels(
        await AirtableUtil.fetchTrackedChannels()
    );
    console.log("Starting refill");

    const firstChannel = await DiscordClient.channels.fetch(channels[0].id);

    const actThreads = await firstChannel.threads
        .fetchActive()
        .then(x => x.threads);
    console.log(actThreads.size, "active threads found in guild");

    for (let thread of actThreads.values()) {
        if (channels.find(c => c.id == thread.parentId)) {
            await AirtableUtil.createRecord(
                firstChannel,
                thread,
                await resolveThreadStarter(thread)
            );
        }
    }

    for (let op of channels) {
        const channel = await DiscordClient.channels.fetch(op.id);
        const arcThreads = await channel.threads
            .fetchArchived({ fetchAll: true, limit: 100 })
            .then(x => x.threads);
        console.log(
            arcThreads.size,
            "archived threads found for channel",
            op.name
        );

        await AirtableUtil.createRecord(
            channel,
            thread,
            await resolveThreadStarter(thread)
        );
    }

    await AirtableUtil.correctCurators().catch(console.error);

    DiscordClient.destroy();
}

DiscordClient.on("ready", () => {
    console.log(`${DiscordClient.user.tag} is Ready!`);
    main();
});
