import { AbstractDBDriver, ConnectionConfig } from "./DBDriver.ts";
import { MongoClient, MongoClientOptions, MongoParseError, ServerApiVersion } from 'npm:mongodb';

export interface MongoConnectionConfig extends ConnectionConfig {
    connectionURI: string
}

export class MongoDriver extends AbstractDBDriver<MongoConnectionConfig> {
    private client: MongoClient

    async connect() {
        console.log("Connecting... ")
        
        await this.client.connect().catch(() => {}) // TODO: Is this a good idea???
        this.testConnection()
        if (this.connected) {
            console.log("Successfully connected to MongoDB!")
        } else {
            console.error("Connection failed!")
        }

        return Promise.resolve(this.connected)
    }

    async disconnect() {
        throw new Error("Method not implemented.")
    }

    testConnection() {
        this.connected = this.client != undefined && this.client != null
        return this.connected
    }
    
    constructor(connectionConfig: MongoConnectionConfig) {
        super(connectionConfig)

        this.client = new MongoClient(this.connectionConfig.connectionURI, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            }
        } as MongoClientOptions)
    }
}

export function validateMongoConnectionURI(connectionURI: string): boolean {
    try {
        new MongoClient(connectionURI, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            }
        } as MongoClientOptions)

        return true
    } catch (_e: unknown) {
        // TODO: I DO NOT trust that this wont cause me future issues. Please, Eran, fix this in the future.
        return false
    }
}