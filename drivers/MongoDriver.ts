import { AbstractDBDriver, ConnectionConfig } from "./DBDriver.ts";
import { MongoClient, MongoClientOptions, MongoServerError, ServerApiVersion } from 'npm:mongodb';

export interface MongoConnectionConfig extends ConnectionConfig {
    connectionURI: string
}

export class MongoDriver extends AbstractDBDriver<MongoConnectionConfig> {
    private client: MongoClient

    async connect() {
        console.log("Connecting... ")

        this.connected = true
        await this.client.connect().catch((err) => {
            const error: MongoServerError = err as MongoServerError
            console.error(`Could not connect to MongoDB: ${error.message}`)
            this.connected = false
            return Promise.resolve(this.connected)
        })
        if (this.connected) {
            console.log("Successfully connected to MongoDB!")
        }

        return Promise.resolve(this.connected)
    }

    disconnect() {
        throw new Error("Method not implemented.")
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