"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.persistentQueue = void 0;
const erela_js_1 = require("erela.js");
const mongodb_1 = require("mongodb");
const check = (options) => {
    if (!options) {
        throw new TypeError("PluginOptions must not be empty.");
    }
    if (typeof options.mongoDbUrl !== "string") {
        throw new TypeError("Plugin option \"mongoDbUrl\" must be present and be a non-empty string.");
    }
};
class persistentQueue extends erela_js_1.Plugin {
    constructor(options) {
        super();
        check(options);
        this.options = {
            ...options,
        };
        this.connectDB();
    }
    load(manager) {
        this.manager = manager;
        this.manager.on('nodeRaw', (payload) => {
            switch (payload.op) {
                case "playerUpdate":
                    delete payload.op;
                    const player = this.manager.players.get(payload.guildId);
                    if (player) {
                        const collection = this.Db.collection('persistentQueue');
                        collection.updateOne({
                            id: player.guild
                        }, {
                            player
                        }, {
                            upsert: true
                        });
                    }
                    break;
                default:
                    break;
            }
        });
    }
    async connectDB() {
        const client = new mongodb_1.MongoClient(this.options.mongoDbUrl);
        this.clientDb = client;
        await client.connect();
        this.Db = client.db(this.options.mongoDbName || 'erelaQueue');
    }
}
exports.persistentQueue = persistentQueue;
