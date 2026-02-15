import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs";
import path from "path";
import { Logger, LogLevel, logger } from "../shared/logger.js";

describe("Logger", () => {
  const testLogsDir = path.join(process.cwd(), "test-logs");
  const originalCwd = process.cwd();

  beforeEach(() => {
    // Create test logs directory
    if (!fs.existsSync(testLogsDir)) {
      fs.mkdirSync(testLogsDir, { recursive: true });
    }
    // Change to test directory for isolated logging
    process.chdir(testLogsDir);

    // Reset logger instance
    (Logger as any).instance = null;

    // Mock console.log to capture output
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original directory
    process.chdir(originalCwd);

    // Clean up test logs
    if (fs.existsSync(testLogsDir)) {
      fs.rmSync(testLogsDir, { recursive: true, force: true });
    }

    // Restore console.log
    vi.restoreAllMocks();
  });

  describe("Singleton Pattern", () => {
    it("should return the same instance", () => {
      const logger1 = Logger.getInstance();
      const logger2 = Logger.getInstance();
      expect(logger1).toBe(logger2);
    });

    it("should export singleton instance", () => {
      // Reset instance to ensure clean state
      (Logger as any).instance = null;
      const freshLogger = Logger.getInstance();
      expect(logger).toBeInstanceOf(Logger);
      expect(freshLogger).toBeInstanceOf(Logger);
    });
  });

  describe("Log Level Parsing", () => {
    it("should parse valid log levels", () => {
      const testLogger = Logger.getInstance();

      expect((testLogger as any).parseLogLevel("ERROR")).toBe(LogLevel.ERROR);
      expect((testLogger as any).parseLogLevel("WARN")).toBe(LogLevel.WARN);
      expect((testLogger as any).parseLogLevel("INFO")).toBe(LogLevel.INFO);
      expect((testLogger as any).parseLogLevel("DEBUG")).toBe(LogLevel.DEBUG);
      expect((testLogger as any).parseLogLevel("info")).toBe(LogLevel.INFO);
    });

    it("should default to INFO for invalid levels", () => {
      const testLogger = Logger.getInstance();
      expect((testLogger as any).parseLogLevel("INVALID")).toBe(LogLevel.INFO);
      expect((testLogger as any).parseLogLevel("")).toBe(LogLevel.INFO);
    });
  });

  describe("Environment Configuration", () => {
    it("should use LOG_LEVEL environment variable", () => {
      const originalLogLevel = process.env.LOG_LEVEL;
      process.env.LOG_LEVEL = "DEBUG";

      // Reset instance to pick up new env var
      (Logger as any).instance = null;
      const testLogger = Logger.getInstance();

      expect(testLogger.getLogLevel()).toBe(LogLevel.DEBUG);

      // Restore
      process.env.LOG_LEVEL = originalLogLevel;
      (Logger as any).instance = null;
    });

    it("should use LOG_FORMAT environment variable", () => {
      const originalLogFormat = process.env.LOG_FORMAT;
      process.env.LOG_FORMAT = "json";

      (Logger as any).instance = null;
      const testLogger = Logger.getInstance();

      expect((testLogger as any).logFormat).toBe("json");

      // Restore
      process.env.LOG_FORMAT = originalLogFormat;
      (Logger as any).instance = null;
    });
  });

  describe("Log File Management", () => {
    it("should create logs directory if it doesn't exist", () => {
      const logsDir = path.join(process.cwd(), "logs");
      if (fs.existsSync(logsDir)) {
        fs.rmSync(logsDir, { recursive: true });
      }

      Logger.getInstance();

      expect(fs.existsSync(logsDir)).toBe(true);
    });

    it("should generate correct log file path", () => {
      const testLogger = Logger.getInstance();
      const today = new Date().toISOString().split("T")[0];
      const expectedPath = path.join(process.cwd(), "logs", `app-${today}.log`);

      expect((testLogger as any).getLogPath()).toBe(expectedPath);
    });

    it("should generate log file path for specific date", () => {
      const testLogger = Logger.getInstance();
      const testDate = "2023-12-25";
      const expectedPath = path.join(
        process.cwd(),
        "logs",
        `app-${testDate}.log`,
      );

      expect((testLogger as any).getLogPath(testDate)).toBe(expectedPath);
    });
  });

  describe("Logging Methods", () => {
    let testLogger: Logger;

    beforeEach(() => {
      testLogger = Logger.getInstance();
      testLogger.setLogLevel(LogLevel.DEBUG); // Enable all levels
    });

    it("should log error messages", () => {
      testLogger.error("Test error message");

      const logPath = (testLogger as any).getLogPath();
      expect(fs.existsSync(logPath)).toBe(true);

      const logContent = fs.readFileSync(logPath, "utf8");
      expect(logContent).toContain("ERROR");
      expect(logContent).toContain("Test error message");
    });

    it("should log warn messages", () => {
      testLogger.warn("Test warning message");

      const logPath = (testLogger as any).getLogPath();
      const logContent = fs.readFileSync(logPath, "utf8");
      expect(logContent).toContain("WARN");
      expect(logContent).toContain("Test warning message");
    });

    it("should log info messages", () => {
      testLogger.info("Test info message");

      const logPath = (testLogger as any).getLogPath();
      const logContent = fs.readFileSync(logPath, "utf8");
      expect(logContent).toContain("INFO");
      expect(logContent).toContain("Test info message");
    });

    it("should log debug messages", () => {
      testLogger.debug("Test debug message");

      const logPath = (testLogger as any).getLogPath();
      const logContent = fs.readFileSync(logPath, "utf8");
      expect(logContent).toContain("DEBUG");
      expect(logContent).toContain("Test debug message");
    });

    it("should include context in logs", () => {
      const context = { userId: 123, action: "login" };
      testLogger.info("Test message with context", context);

      const logPath = (testLogger as any).getLogPath();
      const logContent = fs.readFileSync(logPath, "utf8");
      expect(logContent).toContain("Test message with context");
      expect(logContent).toContain('"userId":123');
      expect(logContent).toContain('"action":"login"');
    });

    it("should respect log levels", () => {
      testLogger.setLogLevel(LogLevel.ERROR);

      testLogger.error("Should appear");
      testLogger.warn("Should not appear");
      testLogger.info("Should not appear");
      testLogger.debug("Should not appear");

      const logPath = (testLogger as any).getLogPath();
      const logContent = fs.readFileSync(logPath, "utf8");

      expect(logContent).toContain("Should appear");
      expect(logContent).not.toContain("Should not appear");
    });
  });

  describe("Log Formatting", () => {
    it("should format logs as text by default", () => {
      const testLogger = Logger.getInstance();
      testLogger.setLogLevel(LogLevel.INFO);

      testLogger.info("Test message", { key: "value" });

      const logPath = (testLogger as any).getLogPath();
      const logContent = fs.readFileSync(logPath, "utf8");

      // Should contain timestamp and level
      expect(logContent).toMatch(
        /\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] INFO: Test message/,
      );
      expect(logContent).toContain('"key":"value"');
    });

    it("should format logs as JSON when configured", () => {
      // Set JSON format
      process.env.LOG_FORMAT = "json";
      (Logger as any).instance = null;
      const testLogger = Logger.getInstance();

      testLogger.info("Test JSON message", { key: "value" });

      const logPath = (testLogger as any).getLogPath();
      const logContent = fs.readFileSync(logPath, "utf8");

      // Should be valid JSON
      const logEntry = JSON.parse(logContent.trim());
      expect(logEntry.level).toBe("INFO");
      expect(logEntry.message).toBe("Test JSON message");
      expect(logEntry.context.key).toBe("value");
      expect(logEntry.timestamp).toMatch(
        /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/,
      );

      // Restore
      delete process.env.LOG_FORMAT;
      (Logger as any).instance = null;
    });
  });

  describe("Log File Operations", () => {
    it("should get log files for date range", () => {
      const testLogger = Logger.getInstance();

      // Create some test log files
      const logsDir = path.join(process.cwd(), "logs");
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      const todayFile = path.join(
        logsDir,
        `app-${today.toISOString().split("T")[0]}.log`,
      );
      const yesterdayFile = path.join(
        logsDir,
        `app-${yesterday.toISOString().split("T")[0]}.log`,
      );

      fs.writeFileSync(todayFile, "test");
      fs.writeFileSync(yesterdayFile, "test");

      const files = testLogger.getLogFiles(
        yesterday.toISOString().split("T")[0],
        today.toISOString().split("T")[0],
      );

      expect(files).toContain(todayFile);
      expect(files).toContain(yesterdayFile);
    });

    it("should cleanup old log files", () => {
      const testLogger = Logger.getInstance();

      // Create test files with different ages
      const logsDir = path.join(process.cwd(), "logs");
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 40); // 40 days old
      const oldFile = path.join(
        logsDir,
        `app-${oldDate.toISOString().split("T")[0]}.log`,
      );

      const newDate = new Date();
      newDate.setDate(newDate.getDate() - 10); // 10 days old
      const newFile = path.join(
        logsDir,
        `app-${newDate.toISOString().split("T")[0]}.log`,
      );

      fs.writeFileSync(oldFile, "old log");
      fs.writeFileSync(newFile, "new log");

      testLogger.cleanupOldLogs(30); // Keep 30 days

      expect(fs.existsSync(oldFile)).toBe(false);
      expect(fs.existsSync(newFile)).toBe(true);
    });
  });

  describe("Console Output", () => {
    it("should output to console", () => {
      const consoleSpy = vi.spyOn(console, "log");

      const testLogger = Logger.getInstance();
      testLogger.info("Test console message");

      expect(consoleSpy).toHaveBeenCalledWith("INFO: Test console message");
    });
  });
});
