import { Request, Response, NextFunction } from "express";
import { DataSource, Not, IsNull } from "typeorm";
import { Employee } from "../entities/Employee.js";
import crypto from "crypto";

// Extend Express Request interface to include authenticated employee
declare global {
    namespace Express {
        interface Request {
            employee?: {
                id: number;
                name: string;
                role: string;
            };
        }
    }
}

/**
 * Authentication middleware that validates session token from auth_hash cookie
 */
export function authenticateMiddleware(dataSource: DataSource, log: (message: string) => void) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authToken = req.cookies?.auth_hash;

            if (!authToken) {
                log('Authentication failed: No auth_hash cookie');
                res.status(401).json({ error: 'Authentication required' });
                return;
            }

            // Validate session token format and expiration
            const employee = await validateSessionToken(authToken, dataSource);
            if (!employee) {
                log(`Authentication failed: Invalid session token: ${authToken}`);
                res.status(401).json({ error: 'Invalid authentication' });
                return;
            }

            // Add employee info to request object
            req.employee = {
                id: employee.id,
                name: employee.name,
                role: employee.role
            };

            next();
        } catch (error) {
            log(`Authentication middleware error: ${error}`);
            res.status(500).json({ error: 'Internal server error' });
        }
    };
}

/**
 * Validates a session token and returns the associated employee
 * Session token format: hash(employee_id + timestamp + salt)
 */
export async function validateSessionToken(token: string, dataSource: DataSource): Promise<Employee | null> {
    const employeeRepo = dataSource.getRepository(Employee);

    // Try all employees to find one whose session token matches
    // In production, this could be optimized with a session store
    const employees = await employeeRepo.find({ where: { hash: Not(IsNull()) } });

    for (const employee of employees) {
        // Try different timestamps within the last 30 days (in 1-hour increments for efficiency)
        const now = Date.now();
        const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

        // Check timestamps in 1-hour increments (reduce search space)
        for (let ts = thirtyDaysAgo; ts <= now; ts += 60 * 60 * 1000) {
            const expectedToken = crypto.createHash('sha256')
                .update(`${employee.id}:${ts}:${process.env.HASH_SALT || 'default_salt'}`)
                .digest('hex');

            if (expectedToken === token) {
                // Check if token is not expired (30 days)
                if (now - ts <= 30 * 24 * 60 * 60 * 1000) {
                    return employee;
                }
                break; // Token expired
            }
        }
    }

    return null;
}

/**
 * Middleware wrapper for easy application to route handlers
 * Usage: app.get('/protected-route', authenticate, handler)
 */
export function authenticate(dataSource: DataSource, log: (message: string) => void) {
    return authenticateMiddleware(dataSource, log);
}