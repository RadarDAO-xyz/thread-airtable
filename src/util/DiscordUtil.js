module.exports = class DiscordUtil extends null {
    static async resolveThreadStarter(thread) {
        return (
            (await thread
                .fetchStarterMessage()
                .then(m => m.author)
                .catch(() => {})) || thread.fetchOwner().catch(() => {})
        );
    }
};
