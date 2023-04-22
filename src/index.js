require("dotenv").config();

const AirtableUtil = require("./util/AirtableUtil");
const DiscordClient = require("./util/discord");
const DiscordUtil = require("./util/DiscordUtil");
const { resolveThreadStarter } = require("./util/DiscordUtil");

async function main() {
    console.log("Fetching tracked channels to sync from the airtable");
    const channels = AirtableUtil.normalizeChannels(
        await AirtableUtil.fetchTrackedChannels()
    );
    console.log("Starting refill");

    const firstChannel = await DiscordClient.channels.fetch(channels[0].id);

    let threads = [];

    const actThreads = await firstChannel.threads
        .fetchActive()
        .then(x => x.threads);
    console.log(actThreads.size, "active threads found in guild");

    threads.push(...actThreads.values());

    for (let op of channels) {
        const channel = await DiscordClient.channels.fetch(op.id);
        const arcThreads = await DiscordUtil.fetchAllArchived(channel);
        threads.push(...arcThreads.values());
        console.log(
            arcThreads.size,
            "archived threads found for channel",
            op.name
        );
    }

    for (let thread of [...threads.values()]) {
        if (channels.find(c => c.id == thread.parentId)) {
            await AirtableUtil.createRecord(
                thread.parent,
                thread,
                await resolveThreadStarter(thread)
            );
        }
    }

    console.log("Correcting #0000 curators...")
    await AirtableUtil.correctCurators().catch(console.error);

    DiscordClient.destroy();
}

DiscordClient.on("ready", () => {
    console.log(`${DiscordClient.user.tag} is Ready!`);
    main();
});
