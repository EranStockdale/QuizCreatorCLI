import { Question } from "../types.ts";
import { AbstractDBDriver, ConnectionConfig } from "./DBDriver.ts";
import { Collection, Db, InsertOneResult, MongoClient, MongoClientOptions, MongoServerError, ServerApiVersion } from 'npm:mongodb';

export interface MongoConnectionConfig extends ConnectionConfig {
    connectionURI: string
}

export class MongoDriver extends AbstractDBDriver<MongoConnectionConfig> {
    private client: MongoClient
    private db: Db | undefined = undefined

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
            this.db = this.client.db()
        }

        return Promise.resolve(this.connected)
    }

    disconnect() {
        throw new Error("Method not implemented.")
    }
    

    private questionsCollection(): Collection | undefined { return this.db?.collection('quizcreator') }
    async questionExists(questionId: string): Promise<boolean> {
        const question: Question | null = await this.getQuestionById(questionId);
        return Promise.resolve(question != null)
    }

    async getQuestionById(questionId: string): Promise<Question | null> {
        const question = await this.questionsCollection()?.findOne({id: questionId} as Question)
            .then(doc => {
                if (!doc) {
                    return null
                }

                return doc
            })
        
        return Promise.resolve(question as Question | null)
    }

    async getAllQuestions(): Promise<Question[]> {
        const foundQuestions = await this.questionsCollection()?.find({}).toArray()
        if (foundQuestions == null || foundQuestions == undefined) {
            return Promise.resolve([])
        }
        
        const questions: Question[] = []
        for (const question of foundQuestions) {
            if (question != null && question != undefined) {
                questions.push(question as unknown as Question)
            }
        }

        return Promise.resolve(questions)
    }

    async createQuestion(question: Question): Promise<InsertOneResult | undefined> {
        return Promise.resolve(await this.questionsCollection()?.insertOne(question))
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