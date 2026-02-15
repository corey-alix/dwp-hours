import fs from "fs";
import path from "path";
import { today } from "./dateUtils.js";

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: Record<string, any>;
}

export class Logger {
  private static instance: Logger;
  private currentLogLevel: LogLevel;
  private logsDir: string;
  private logFormat: "text" | "json";

  private constructor() {
    this.currentLogLevel = this.parseLogLevel(process.env.LOG_LEVEL || "INFO");
    this.logsDir = path.join(process.cwd(), "logs");
    this.logFormat = (process.env.LOG_FORMAT || "text") as "text" | "json";
    this.ensureLogsDirectory();
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private parseLogLevel(level: string): LogLevel {
    switch (level.toUpperCase()) {
      case "ERROR":
        return LogLevel.ERROR;
      case "WARN":
        return LogLevel.WARN;
      case "INFO":
        return LogLevel.INFO;
      case "DEBUG":
        return LogLevel.DEBUG;
      default:
        return LogLevel.INFO;
    }
  }

  private ensureLogsDirectory(): void {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  public getLogPath(date?: string): string {
    const logDate = date || today();
    return path.join(this.logsDir, `app-${logDate}.log`);
  }

  private formatLogEntry(entry: LogEntry): string {
    if (this.logFormat === "json") {
      return JSON.stringify(entry) + "\n";
    } else {
      const contextStr = entry.context
        ? ` ${JSON.stringify(entry.context)}`
        : "";
      return `[${entry.timestamp}] ${entry.level}: ${entry.message}${contextStr}\n`;
    }
  }

  private writeLog(entry: LogEntry): void {
    const logMessage = this.formatLogEntry(entry);
    const logPath = this.getLogPath();
    fs.appendFileSync(logPath, logMessage);
    console.log(`${entry.level}: ${entry.message}`);
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.currentLogLevel;
  }

  public error(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: "ERROR",
      message,
      context,
    });
  }

  public warn(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: "WARN",
      message,
      context,
    });
  }

  public info(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: "INFO",
      message,
      context,
    });
  }

  public debug(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: "DEBUG",
      message,
      context,
    });
  }

  // Legacy function for backward compatibility
  public log(message: string): void {
    this.info(message);
  }

  // Get current log level
  public getLogLevel(): LogLevel {
    return this.currentLogLevel;
  }

  // Set log level dynamically
  public setLogLevel(level: LogLevel): void {
    this.currentLogLevel = level;
  }

  // Get log files for a date range
  public getLogFiles(startDate: string, endDate: string): string[] {
    const files: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (
      let date = new Date(start);
      date <= end;
      date.setDate(date.getDate() + 1)
    ) {
      const dateStr = date.toISOString().split("T")[0];
      const logPath = this.getLogPath(dateStr);
      if (fs.existsSync(logPath)) {
        files.push(logPath);
      }
    }

    return files;
  }

  // Clean up old log files
  public cleanupOldLogs(retentionDays: number = 30): void {
    const files = fs.readdirSync(this.logsDir);
    const now = new Date();

    files.forEach((file) => {
      if (!file.startsWith("app-") || !file.endsWith(".log")) return;

      const dateStr = file.replace("app-", "").replace(".log", "");
      const fileDate = new Date(dateStr);
      const daysDiff =
        (now.getTime() - fileDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysDiff > retentionDays) {
        const filePath = path.join(this.logsDir, file);
        fs.unlinkSync(filePath);
        this.info(`Cleaned up old log file: ${file}`);
      }
    });
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export legacy function for backward compatibility
export function log(message: string): void {
  logger.log(message);
}

// Export getLogPath for backward compatibility
export function getLogPath(): string {
  return logger.getLogPath();
}
