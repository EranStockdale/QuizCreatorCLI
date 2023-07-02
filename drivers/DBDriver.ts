// deno-lint-ignore no-empty-interface
export interface ConnectionConfig {}

export abstract class AbstractDBDriver<TConnectionConfig> {
    public connected: boolean
    protected connectionConfig: TConnectionConfig

    abstract connect(): Promise<boolean>
    abstract disconnect(): void

    protected constructor(connectionConfig: TConnectionConfig) {
        this.connected = false
        this.connectionConfig = connectionConfig
    }
}