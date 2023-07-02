import { Question } from "../types.ts"

// deno-lint-ignore no-empty-interface
export interface ConnectionConfig {}

export abstract class AbstractDBDriver<TConnectionConfig> {
    public connected: boolean
    protected connectionConfig: TConnectionConfig

    abstract connect(): Promise<boolean>
    abstract disconnect(): void

    abstract getAllQuestions(): Promise<Question[]>
    abstract getQuestionById(questionId: string): void
    abstract questionExists(questionId: string): Promise<boolean>
    abstract createQuestion(question: Question): void

    protected constructor(connectionConfig: TConnectionConfig) {
        this.connected = false
        this.connectionConfig = connectionConfig
    }
}