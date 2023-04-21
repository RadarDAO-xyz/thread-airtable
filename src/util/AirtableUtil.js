const Util = require("./Util");
const { ThreadsTable, ChannelsTable } = require("./airtable");

module.exports = class AirtableUtil extends null {
    /**
     *
     * @param {import('discord.js').ForumChannel} channel
     * @param {import('discord.js').ThreadChannel} thread
     * @param {import('discord.js').User} thread
     */
    static async createRecord(channel, thread, curator) {
        console.log(`Creating record for thread ${thread.name}`);
        if (curator) console.log(`Found thread curator: ${curator.tag}`);
        else console.log("Curator not found");
        const record = {
            "Thread Name": thread.name,
            Link: `https://ptb.discord.com/channels/913873017287884830/${thread.id}`,
            "Signal Channel": channel.name,
            Curator: curator?.tag,
            Status: "ACTIVE",
            Comments: thread.messageCount,
            Timestamp: thread.createdTimestamp,
            curatorId: curator?.id
        };
        console.log("Creating record...");
        await Util.retryUntilSuccess(ThreadsTable.create, record, {
            typecast: true
        });
    }

    static fetchTrackedChannels() {
        return ChannelsTable.select({
            filterByFormula: '{Status}="TRACKED"'
        }).all();
    }

    static normalizeChannels(channels) {
        return channels.map(record => ({
            _id: record.id,
            id: record.fields["Channel ID"],
            name: record.fields["Channel Name"],
            status: record.fields["Status"]
        }));
    }

    static fetchInvalidUsers() {
        return ThreadsTable.select({
            filterByFormula: "REGEX_MATCH({Curator}, '.+#0000')"
        }).all();
    }

    static async correctCurators() {
        const usernameToUser = new Map();

        const invalidUsers = await AirtableUtil.fetchInvalidUsers();

        for (let record of invalidUsers) {
            const invalidTag = record.fields["Curator"];
            const username = invalidTag.split("#")[0];
            let correctTag, correctId;

            if (!usernameToUser.has(username)) {
                const firstPage = await ThreadsTable.select({
                    filterByFormula: `REGEX_MATCH({Curator}, '${username}')`
                })
                    .firstPage()
                    .then(x =>
                        x.filter(rec => !rec.fields.Curator.endsWith("#0000"))
                    );

                correctTag = firstPage[0]?.fields["Curator"];
                correctId = firstPage[0]?.fields["curatorId"];
            } else {
                const x = usernameToUser.get(username);
                correctTag = x.tag;
                correctId = x.id;
            }

            if (correctTag && correctId) {
                await record.updateFields({
                    Curator: correctTag,
                    curatorId: correctId
                });
            }
            usernameToUser.set(username, { tag: correctTag, id: correctId });
        }
    }
};
