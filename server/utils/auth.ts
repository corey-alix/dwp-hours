import { Request, Response, NextFunction } from "express";
import { DataSource } from "typeorm";
import { Employee } from "../entities/index.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";

// Extend Express Request interface to include authenticated employee
declare global {
  namespace Express {
    interface Request {
      employee?: {
        id: number;
        name: string;
        role: string;
        hire_date: string;
      };
    }
  }
}

/**
 * Authentication middleware that validates session token from auth_hash cookie
 */
export function authenticateMiddleware(
  dataSourceProvider: () => DataSource,
  log: (message: string) => void,
) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const dataSource = dataSourceProvider();
      // Parse cookie manually since we don't have cookie-parser
      const cookieHeader = req.headers.cookie;
      let authToken: string | undefined;
      if (cookieHeader) {
        const cookies = cookieHeader.split(";").map((c) => c.trim());
        for (const cookie of cookies) {
          const [name, value] = cookie.split("=");
          if (name === "auth_hash") {
            authToken = value;
            break;
          }
        }
      }

      if (!authToken) {
        log(
          `Authentication failed: No auth_hash cookie. Cookie header: ${cookieHeader}`,
        );
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      // Validate session token format and expiration
      const employee = await validateSessionToken(authToken, dataSource, log);
      if (!employee) {
        log(`Authentication failed: Invalid session token: ${authToken}`);
        res.status(401).json({ error: "Invalid authentication" });
        return;
      }

      // Add employee info to request object
      req.employee = {
        id: employee.id,
        name: employee.name,
        role: employee.role,
        hire_date: employee.hire_date,
      };

      // Log API access
      log(
        `API access: ${req.method} ${req.path} by employee ${req.employee.id}`,
      );

      next();
    } catch (error) {
      log(`Authentication middleware error: ${error}`);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

/**
 * Validates a session token and returns the associated employee
 */
export async function validateSessionToken(
  token: string,
  dataSource: DataSource,
  log: (message: string) => void,
): Promise<Employee | null> {
  try {
    const jwtSecret =
      process.env.JWT_SECRET || process.env.HASH_SALT || "default_jwt_secret";
    let payload;
    try {
      payload = jwt.verify(token, jwtSecret) as jwt.JwtPayload;
    } catch (err) {
      return null;
    }

    const { employeeId } = payload;
    if (!employeeId || typeof employeeId !== "number") {
      return null;
    }

    const employeeRepo = dataSource.getRepository(Employee);
    return await employeeRepo.findOne({ where: { id: employeeId } });
  } catch (error) {
    log(`Error in validateSessionToken: ${error}`);
    throw error;
  }
}

/**
 * Middleware wrapper for easy application to route handlers
 * Usage: app.get('/protected-route', authenticate, handler)
 */
export function authenticate(
  dataSourceProvider: () => DataSource,
  log: (message: string) => void,
) {
  return authenticateMiddleware(dataSourceProvider, log);
}

/**
 * Admin-only authentication middleware
 * Usage: app.get('/admin-route', authenticateAdmin, handler)
 */
export function authenticateAdmin(
  dataSourceProvider: () => DataSource,
  log: (message: string) => void,
) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    // First apply regular authentication
    await authenticateMiddleware(dataSourceProvider, log)(
      req,
      res,
      (err?: any) => {
        if (err || !req.employee) return;

        // Check if user has admin role
        if (req.employee.role !== "Admin") {
          log(
            `Admin access denied for user ${req.employee.id} with role ${req.employee.role}`,
          );
          res.status(403).json({ error: "Admin privileges required" });
          return;
        }

        next();
      },
    );
  };
}
