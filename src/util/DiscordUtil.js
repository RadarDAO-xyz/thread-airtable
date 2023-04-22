module.exports = class DiscordUtil extends null {
    static async resolveThreadStarter(thread) {
        return (
            (await thread
                .fetchStarterMessage()
                .then(m => m.author)
                .catch(() => {})) || thread.fetchOwner().catch(() => {})
        );
    }

    static async fetchAllArchived(channel, before = undefined) {
        const result = await channel.threads.fetchArchived({
            before,
            limit: 100
        });
        let returnval = result.threads;
        if (result.hasMore) {
            console.log(returnval.size)
            returnval = returnval.merge(
                await DiscordUtil.fetchAllArchived(
                    channel,
                    returnval.last().id
                ),
                x => ({ keep: true, value: x }),
                y => ({ keep: true, value: y }),
                (x, y) => ({ keep: true, value: x })
            );
        }
        return returnval;
    }
};
