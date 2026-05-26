declare module 'better-sqlite3' {
  interface Statement {
    run(params?: unknown): unknown;
    get(params?: unknown): unknown;
    all(params?: unknown): unknown[];
  }

  interface Database {
    pragma(sql: string): void;
    exec(sql: string): void;
    prepare(sql: string): Statement;
    transaction<T>(fn: (value: T) => void): (value: T) => void;
    close(): void;
  }

  interface DatabaseConstructor {
    new (path: string, options?: { readonly?: boolean }): Database;
  }

  const Database: DatabaseConstructor;
  export default Database;
}
