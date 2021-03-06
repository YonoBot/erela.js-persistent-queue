import { Client } from "discord.js";
import { Manager, Plugin } from "erela.js";
import { PluginOptions } from "./typings";
export declare class persistentQueue extends Plugin {
    private readonly options;
    private Db;
    private clientDb;
    private client;
    manager: Manager;
    constructor(client: Client, options: PluginOptions);
    load(manager: Manager): Promise<void>;
    delay(delayInms: number): Promise<unknown>;
    connectDB(): Promise<void>;
}
//# sourceMappingURL=Plugin.d.ts.map