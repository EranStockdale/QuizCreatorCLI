export abstract class AbstractDBDriver<TConnectionConfig> {
    protected connected: boolean
    protected connectionConfig: TConnectionConfig

    abstract connect(): void
    abstract disconnect(): void

    protected constructor(connectionConfig: TConnectionConfig) {
        this.connected = false
        this.connectionConfig = connectionConfig
    }
}