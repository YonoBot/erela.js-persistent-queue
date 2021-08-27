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
    constructor(client, options) {
        super();
        check(options);
        this.options = {
            ...options,
        };
        this.client = client;
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
                            $set: {
                                queue: player.queue,
                                current: player.queue.current,
                                queueRepeat: player.queueRepeat,
                                trackRepeat: player.trackRepeat,
                                textChannel: player.textChannel,
                                voiceChannel: player.voiceChannel,
                                voiceState: player.voiceState,
                                volume: player.volume
                            }
                        }, {
                            upsert: true
                        });
                    }
                    break;
                default:
                    break;
            }
        });
        this.client.once('ready', async (client) => {
            const database = await this.Db.collection('persistentQueue').find({}).toArray();
            for (let db of database) {
                const player = this.manager.create({
                    voiceChannel: db.voiceChannel,
                    textChannel: db.textChannel,
                    guild: db.guild
                });
                player.connect();
                if (db.current)
                    player.queue.add(db.current);
                for (let track of db.queue) {
                    player.queue.add(erela_js_1.TrackUtils.isTrack(track) ? track : erela_js_1.TrackUtils.buildUnresolved(track));
                }
                player.play();
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
