class Util extends null {
    static async retryUntilSuccess(fn, ...args) {
        try {
            return await fn(...args);
        } catch {
            return await Util.retryUntilSuccess(fn, ...args);
        }
    }
}

module.exports = Util;
