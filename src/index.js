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

    for (const op of channels) {
        console.log(`\nFetching channel ${op.name}`);
        const channel = await DiscordClient.channels.fetch(op.id);

        console.log(`Fetching threads of channel ${channel.name}`);
        const actThreads = await channel.threads
            .fetchActive()
            .then(x => x.threads);
        console.log(actThreads.size, "active threads found");
        const arcThreads = await channel.threads
            .fetchArchived()
            .then(x => x.threads);
        console.log(arcThreads.size, "archived threads found");

        for (let thread of actThreads.values()) {
            await AirtableUtil.createRecord(
                channel,
                thread,
                await resolveThreadStarter(thread)
            );
        }

        for (let thread of arcThreads.values()) {
            await AirtableUtil.createRecord(
                channel,
                thread,
                await resolveThreadStarter(thread)
            );
        }
    }

    await AirtableUtil.correctCurators().catch(console.error);

    DiscordClient.destroy();
}

DiscordClient.on("ready", () => {
    console.log(`${DiscordClient.user.tag} is Ready!`);
    main();
});
