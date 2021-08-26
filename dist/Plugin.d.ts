import { Manager, Plugin } from "erela.js";
import { PluginOptions } from "./typings";
export declare class persistentQueue extends Plugin {
    private readonly options;
    private Db;
    private clientDb;
    manager: Manager;
    constructor(options: PluginOptions);
    load(manager: Manager): void;
    connectDB(): Promise<void>;
}
//# sourceMappingURL=Plugin.d.ts.map