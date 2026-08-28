declare module 'sql.js' {
    interface SqlJsStatic {
        Database: new (data?: ArrayLike<number>) => Database;
    }
    interface Database {
        run(sql: string, params?: (string | number)[]): void;
        exec(sql: string): { columns: string[]; values: unknown[][] }[];
        prepare(sql: string): Statement;
        export(): Uint8Array;
        close(): void;
    }
    interface Statement {
        bind(params?: (string | number)[]): boolean;
        step(): boolean;
        getAsObject(): Record<string, unknown>;
        free(): void;
    }
    export default function initSqlJs(): Promise<SqlJsStatic>;
    export { SqlJsStatic, Database, Statement };
}
