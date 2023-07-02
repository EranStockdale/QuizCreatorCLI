import { AbstractDBDriver } from "./DBDriver.ts";

export default interface MongoConnectionConfig {
    connectionURI: string
}

export default class MongoDriver extends AbstractDBDriver<MongoConnectionConfig> {
    connect(): void {
        throw new Error("Method not implemented.");
    }
    disconnect(): void {
        throw new Error("Method not implemented.");
    }
    
    constructor(connectionConfig: MongoConnectionConfig) {
        super(connectionConfig)
    }
}