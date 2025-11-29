

export interface ICache{
    get<T = any>(key: string): Promise<T | null>;
    set(key: string, value: any, ttl?: number): Promise<void>;
    del(key: string): Promise<void>;
    has(key:string): Promise<boolean>;

}