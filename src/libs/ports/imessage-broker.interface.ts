

export interface IMessageBroker{
    emit(event: string, payload: any): void;
    on(event: string, listener: (...args: any[])=> void): void;
    off(event: string, listener: (...args: any[])=> void): void;
}