declare module "better-sqlite3" {
  export default class Database {
    constructor(path: string);
    exec(sql: string): void;
    close(callback?: (err?: Error | null) => void): void;
  }
}
