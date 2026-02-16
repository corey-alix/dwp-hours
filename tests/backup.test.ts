import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import {
  getBackupStatus,
  createDatabaseBackupIfNeeded,
  cleanupOldBackups,
  listBackups,
  validateBackupFilename,
  restoreFromBackup,
  initBackupSystem,
} from "../server/backup.js";

const testDir = path.join(process.cwd(), "test-backup-env");
const testDbPath = path.join(testDir, "db", "dwp-hours.db");
const testBackupDir = path.join(testDir, "db", "backups");
const originalCwd = process.cwd();

describe("Backup System", () => {
  beforeEach(() => {
    // Create test directory structure
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    const dbDir = path.join(testDir, "db");
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    if (!fs.existsSync(testBackupDir)) {
      fs.mkdirSync(testBackupDir, { recursive: true });
    }
    // Create dummy DB
    fs.writeFileSync(testDbPath, "dummy db content");
    // Change to test directory
    process.chdir(testDir);
    // Initialize backup system
    initBackupSystem();
  });

  afterEach(() => {
    // Restore original directory
    process.chdir(originalCwd);
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });
  describe("getBackupStatus", () => {
    it("should return backup status information", () => {
      const status = getBackupStatus();
      expect(status).toHaveProperty("backupDirectory");
      expect(status).toHaveProperty("totalBackups");
      expect(status).toHaveProperty("lastBackup");
      expect(status).toHaveProperty("databaseLastModified");
      expect(status).toHaveProperty("backups");
      expect(status).toHaveProperty("config");
    });
  });

  describe("createDatabaseBackupIfNeeded", () => {
    it("should create a backup when database has changed and no recent backup exists", () => {
      // Modify the DB file to simulate change
      fs.writeFileSync(testDbPath, "modified content");

      const result = createDatabaseBackupIfNeeded();
      expect(result).toBe(true);

      const backups = listBackups();
      expect(backups.length).toBe(1);
      expect(backups[0].filename).toMatch(
        /^backup-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.db$/,
      );
    });

    it("should not create backup when database hasn't changed", () => {
      // Create initial backup
      fs.writeFileSync(testDbPath, "modified content");
      createDatabaseBackupIfNeeded();

      // Try again without changing DB
      const result = createDatabaseBackupIfNeeded();
      expect(result).toBe(false);

      const backups = listBackups();
      expect(backups.length).toBe(1); // Still only one
    });
  });

  describe("cleanupOldBackups", () => {
    it("should remove backups that don't match retention slots", () => {
      // Create multiple backup files with different ages
      const now = Date.now();
      const backupTimes = [
        now - 1 * 60 * 1000, // 1 minute ago
        now - 60 * 60 * 1000, // 1 hour ago
        now - 24 * 60 * 60 * 1000, // 1 day ago
        now - 7 * 24 * 60 * 60 * 1000, // 7 days ago
      ];

      backupTimes.forEach((time) => {
        const filename = `backup-${new Date(time)
          .toISOString()
          .replace(/[:-]/g, "")
          .replace(/\.\d{3}/, "")}Z.db`;
        fs.writeFileSync(path.join(testBackupDir, filename), "backup content");
      });

      cleanupOldBackups();

      const remainingBackups = listBackups();
      // Should keep backups closest to schedule slots
      expect(remainingBackups.length).toBeGreaterThan(0);
      expect(remainingBackups.length).toBeLessThanOrEqual(backupTimes.length);
    });
  });

  describe("listBackups", () => {
    it("should return sorted backup files with metadata", () => {
      // Create test backup files
      const filenames = [
        "backup-2024-01-01T12-00-00-000Z.db",
        "backup-2024-01-02T12-00-00-000Z.db",
      ];

      filenames.forEach((filename) => {
        fs.writeFileSync(path.join(testBackupDir, filename), "content");
      });

      const backups = listBackups();
      expect(backups).toHaveLength(2);
      expect(backups[0].filename).toBe("backup-2024-01-02T12-00-00-000Z.db"); // Newest first
      expect(backups[1].filename).toBe("backup-2024-01-01T12-00-00-000Z.db");

      expect(backups[0]).toHaveProperty("size");
      expect(backups[0]).toHaveProperty("created");
      expect(backups[0]).toHaveProperty("ageDays");
    });
  });

  describe("validateBackupFilename", () => {
    it("should validate correct backup filenames", () => {
      const validFilename = "backup-2024-01-01T12-00-00-000Z.db";
      fs.writeFileSync(path.join(testBackupDir, validFilename), "content");
      const result = validateBackupFilename(validFilename);
      expect(result).toBe(path.join(testBackupDir, validFilename));
    });

    it("should throw for invalid filenames", () => {
      expect(() => validateBackupFilename("invalid.txt")).toThrow();
      expect(() => validateBackupFilename("backup-invalid.db")).toThrow();
    });
  });

  describe("restoreFromBackup", () => {
    it("should restore database from backup file", () => {
      // Create a backup
      createDatabaseBackupIfNeeded();
      const backups = listBackups();
      expect(backups.length).toBe(1);

      // Modify DB
      fs.writeFileSync(testDbPath, "modified");

      // Restore
      const result = restoreFromBackup(
        path.join(testBackupDir, backups[0].filename),
      );
      expect(result).toMatch(/^prerestore-\d+\.db$/);

      // Verify content
      const content = fs.readFileSync(testDbPath, "utf-8");
      expect(content).toBe("dummy db content");
    });

    it("should throw for invalid backup file", () => {
      expect(() => restoreFromBackup("nonexistent.db")).toThrow();
    });
  });

  describe("initBackupSystem", () => {
    it("should initialize backup directory and state", () => {
      // Remove backup dir to test creation
      if (fs.existsSync(testBackupDir)) {
        fs.rmSync(testBackupDir, { recursive: true });
      }

      initBackupSystem();

      expect(fs.existsSync(testBackupDir)).toBe(true);
    });
  });
});
