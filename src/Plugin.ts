import { Manager, Plugin } from "erela.js";
import { PluginOptions } from "./typings";
import { Db, MongoClient } from 'mongodb';

const check = (options: PluginOptions) => {
    if (!options) {
        throw new TypeError("PluginOptions must not be empty.");
    }

    if (typeof options.mongoDbUrl !== "string") {
        throw new TypeError(
            "Plugin option \"mongoDbUrl\" must be present and be a non-empty string.",
        );
    }
}

export class persistentQueue extends Plugin {
    private readonly options: PluginOptions;
    private Db!: Db;
    private clientDb!: MongoClient;
    public manager!: Manager;
    constructor(options: PluginOptions) {
        super()
        check(options);
        this.options = {
            ...options,
        };
        this.connectDB()
    }

    public load(manager: Manager) {
        this.manager = manager
        this.manager.on('nodeRaw', (payload: any) => {
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
                        })
                    }
                    break;
                default:
                    break;
            }
        })
    }

    public async connectDB() {
        const client = new MongoClient(this.options.mongoDbUrl);
        this.clientDb = client;
        await client.connect();
        this.Db = client.db(this.options.mongoDbName || 'erelaQueue');
    }
}