import { test, expect, vi } from "vitest";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { authenticateMiddleware } from "../server/utils/auth.js";

test("email validation should work", () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  expect(emailRegex.test("test@example.com")).toBe(true);
  expect(emailRegex.test("invalid")).toBe(false);
});

test("URL parameters parsing", () => {
  const urlParams = new URLSearchParams("?token=abc123");
  expect(urlParams.get("token")).toBe("abc123");
});

test("localStorage management", () => {
  // Mock localStorage for testing
  const mockStorage = new Map();
  global.localStorage = {
    getItem: (key: string) => mockStorage.get(key) || null,
    setItem: (key: string, value: string) => mockStorage.set(key, value),
    removeItem: (key: string) => mockStorage.delete(key),
    clear: () => mockStorage.clear(),
    key: (index: number) => Array.from(mockStorage.keys())[index] || null,
    get length() {
      return mockStorage.size;
    },
  };

  const user = { id: 1, name: "Test User", role: "Employee" };
  localStorage.setItem("currentUser", JSON.stringify(user));
  const stored = localStorage.getItem("currentUser");
  const parsed = stored ? JSON.parse(stored) : null;
  expect(parsed).toEqual(user);
});

test("session token generation", () => {
  const employeeId = 1;
  const jwtSecret = "test_jwt_secret";
  const sessionToken = jwt.sign(
    {
      employeeId,
      role: "Employee",
      exp: Math.floor(Date.now() / 1000) + 10 * 365 * 24 * 60 * 60, // 10 years
    },
    jwtSecret,
  );

  expect(typeof sessionToken).toBe("string");
  expect(sessionToken.split(".").length).toBe(3); // JWT has 3 parts

  // Verify the token can be decoded
  const decoded = jwt.verify(sessionToken, jwtSecret) as jwt.JwtPayload;
  expect(decoded.employeeId).toBe(employeeId);
  expect(decoded.role).toBe("Employee");
  expect(decoded.exp).toBeDefined();
});

test("session token expiration check", () => {
  const jwtSecret = "test_jwt_secret";
  const now = Math.floor(Date.now() / 1000);

  // Valid token (expires in 10 years)
  const validToken = jwt.sign(
    {
      employeeId: 1,
      role: "Employee",
      exp: now + 10 * 365 * 24 * 60 * 60, // 10 years from now
    },
    jwtSecret,
  );

  // Should verify successfully
  expect(() => jwt.verify(validToken, jwtSecret)).not.toThrow();

  // Expired token (already expired)
  const expiredToken = jwt.sign(
    {
      employeeId: 1,
      role: "Employee",
      exp: now - 3600, // 1 hour ago
    },
    jwtSecret,
  );

  // Should throw TokenExpiredError
  expect(() => jwt.verify(expiredToken, jwtSecret)).toThrow(
    jwt.TokenExpiredError,
  );
});

test("magic link token generation", () => {
  const email = "test@example.com";
  const jwtSecret = "test_jwt_secret";
  const now = Math.floor(Date.now() / 1000);

  const magicToken = jwt.sign(
    {
      email,
      exp: now + 3600, // 1 hour
    },
    jwtSecret,
  );

  expect(typeof magicToken).toBe("string");
  expect(magicToken.split(".").length).toBe(3); // JWT has 3 parts

  // Verify the token can be decoded and contains correct data
  const decoded = jwt.verify(magicToken, jwtSecret) as jwt.JwtPayload;
  expect(decoded.email).toBe(email);
  expect(decoded.exp).toBe(now + 3600);
});

test("magic link token expiration check", () => {
  const jwtSecret = "test_jwt_secret";
  const now = Math.floor(Date.now() / 1000);

  // Valid token (expires in 1 hour)
  const validToken = jwt.sign(
    {
      email: "test@example.com",
      exp: now + 3600, // 1 hour from now
    },
    jwtSecret,
  );

  // Should verify successfully
  expect(() => jwt.verify(validToken, jwtSecret)).not.toThrow();

  // Expired token (already expired)
  const expiredToken = jwt.sign(
    {
      email: "test@example.com",
      exp: now - 3600, // 1 hour ago
    },
    jwtSecret,
  );

  // Should throw TokenExpiredError
  expect(() => jwt.verify(expiredToken, jwtSecret)).toThrow(
    jwt.TokenExpiredError,
  );
});

test("cookie storage simulation", () => {
  // Simulate document.cookie behavior
  let cookieStore = "";

  // Mock document
  global.document = { cookie: "" } as any;

  // Mock document.cookie
  Object.defineProperty(global.document, "cookie", {
    get: () => cookieStore,
    set: (value: string) => {
      cookieStore = value;
    },
  });

  // Set cookie
  document.cookie = "auth_hash=test_hash; path=/; max-age=31536000";

  expect(document.cookie).toContain("auth_hash=test_hash");

  // Simulate cookie parsing
  const cookies = document.cookie.split(";");
  let authHash = null;
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === "auth_hash") {
      authHash = value;
      break;
    }
  }

  expect(authHash).toBe("test_hash");
});

// Authentication middleware tests
test("authentication middleware - missing cookie", async () => {
  const mockDataSource = {} as any;
  const mockLog = vi.fn();
  const middleware = authenticateMiddleware(() => mockDataSource, mockLog);

  const mockReq = { headers: {} } as any;
  const mockRes = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  } as any;
  const mockNext = vi.fn();

  await middleware(mockReq, mockRes, mockNext);

  expect(mockRes.status).toHaveBeenCalledWith(401);
  expect(mockRes.json).toHaveBeenCalledWith({
    error: "Authentication required",
  });
  expect(mockLog).toHaveBeenCalledWith(
    expect.stringContaining("Authentication failed: No auth_hash cookie"),
  );
  expect(mockNext).not.toHaveBeenCalled();
});
