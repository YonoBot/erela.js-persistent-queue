"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.persistentQueue = void 0;
const erela_js_1 = require("erela.js");
const mongodb_1 = require("mongodb");
const discord_js_1 = require("discord.js");
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
            if (payload.op === "playerUpdate") {
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
                            volume: player.volume,
                            position: payload.state.position || 0
                        }
                    }, {
                        upsert: true
                    });
                    player.position = payload.state.position || 0;
                }
            }
        }).on('playerDestroy', (player) => {
            const collection = this.Db.collection('persistentQueue');
            collection.deleteOne({ id: player.guild });
        }).on('queueEnd', (player) => {
            const collection = this.Db.collection('persistentQueue');
            collection.updateOne({
                id: player.guild
            }, {
                $set: {
                    queue: player.queue,
                    current: player.queue.current,
                    position: 0
                }
            }, {
                upsert: true
            });
        });
        this.client.once('ready', async (client) => {
            await this.delay(this.options.delay ?? 2000);
            const database = await this.Db.collection('persistentQueue').find({}).toArray();
            database.forEach(db => {
                if (!db.voiceChannel || !db.textChannel || !db.id || !db.current || !client.channels.cache.get(db.voiceChannel) || !client.channels.cache.get(db.textChannel))
                    return;
                const player = this.manager.create({
                    voiceChannel: db.voiceChannel,
                    textChannel: db.textChannel,
                    guild: db.id
                });
                player.connect();
                if (db.current)
                    player.queue.add(erela_js_1.TrackUtils.buildUnresolved({ title: db.current.title, author: db.current.author, duration: db.current.duration }, new discord_js_1.User(client, db.current.requester)));
                for (let track of db.queue) {
                    player.queue.add(erela_js_1.TrackUtils.buildUnresolved({ title: track.title, author: track.author, duration: track.duration }, new discord_js_1.User(client, db.current.requester)));
                }
                if (db.trackRepeat)
                    player.setTrackRepeat(true);
                if (db.queueRepeat)
                    player.setQueueRepeat(true);
                player.play(erela_js_1.TrackUtils.buildUnresolved(player.queue.current, new discord_js_1.User(client, db.current.requester)), { startTime: db.position ?? 0 });
            });
        });
    }
    delay(delayInms) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(2);
            }, delayInms);
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
