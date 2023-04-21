const Airtable = require("airtable");

const airtable = new Airtable({
    apiKey: process.env.AIRTABLE_API_KEY
});

const base = airtable.base(process.env.AIRTABLE_BASE_ID);
const ThreadsTable = base.table(process.env.THREADS_TABLE_NAME);
const ChannelsTable = base.table(process.env.CHANNELS_TABLE_NAME);

module.exports = { ThreadsTable, ChannelsTable };
