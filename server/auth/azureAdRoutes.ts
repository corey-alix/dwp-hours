import { Router, Request, Response } from "express";
import { ConfidentialClientApplication } from "@azure/msal-node";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { DataSource } from "typeorm";
import { Employee } from "../entities/index.js";
import { getAzureAdConfig } from "./azureAdConfig.js";
import {
  ROLE_EMPLOYEE,
  resolveAdRole,
  isAllowedEmailDomain,
  PTO_EARNING_SCHEDULE,
} from "../../shared/businessRules.js";
import { today } from "../../shared/dateUtils.js";
import { featureFlags } from "../../shared/featureFlags.js";

/**
 * Creates and configures the Azure AD authentication router.
 * Returns `null` when Azure AD is disabled or misconfigured.
 */
export function createAzureAdRouter(
  dataSourceProvider: () => DataSource,
  log: (message: string) => void,
): Router | null {
  if (!featureFlags.azureAdEnabled) return null;

  const config = getAzureAdConfig();
  if (!config) {
    log(
      "Azure AD enabled but configuration incomplete — skipping Azure AD routes",
    );
    return null;
  }

  const msalClient = new ConfidentialClientApplication({
    auth: {
      clientId: config.clientId,
      authority: config.authority,
      clientSecret: config.clientSecret,
    },
  });

  const router = Router();

  // In-memory state store for CSRF protection (state → timestamp)
  const pendingStates = new Map<string, number>();
  const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

  function cleanupStates(): void {
    const now = Date.now();
    for (const [state, ts] of pendingStates) {
      if (now - ts > STATE_TTL_MS) pendingStates.delete(state);
    }
  }

  // ── GET /api/auth/azure/login ──
  router.get("/login", async (_req: Request, res: Response) => {
    try {
      cleanupStates();
      const state = crypto.randomBytes(32).toString("hex");
      pendingStates.set(state, Date.now());

      const authCodeUrl = await msalClient.getAuthCodeUrl({
        scopes: ["openid", "profile", "email"],
        redirectUri: config.redirectUri,
        state,
      });

      res.redirect(authCodeUrl);
    } catch (error) {
      log(`Azure AD login redirect error: ${error}`);
      res.status(500).json({ error: "Failed to initiate Azure AD login" });
    }
  });

  // ── GET /api/auth/azure/callback ──
  router.get("/callback", async (req: Request, res: Response) => {
    try {
      const { code, state, error: oauthError, error_description } = req.query;

      if (oauthError) {
        log(`Azure AD callback error: ${oauthError} — ${error_description}`);
        res.redirect("/?error=azure_auth_failed");
        return;
      }

      if (!code || typeof code !== "string") {
        log("Azure AD callback: missing authorization code");
        res.status(400).json({ error: "Missing authorization code" });
        return;
      }

      // Validate CSRF state
      if (!state || typeof state !== "string" || !pendingStates.has(state)) {
        log("Azure AD callback: invalid or missing state parameter");
        res.status(400).json({ error: "Invalid state parameter" });
        return;
      }
      pendingStates.delete(state);

      // Exchange authorization code for tokens
      const tokenResponse = await msalClient.acquireTokenByCode({
        code,
        scopes: ["openid", "profile", "email"],
        redirectUri: config.redirectUri,
      });

      if (!tokenResponse) {
        log("Azure AD callback: token acquisition failed");
        res.status(401).json({ error: "Token acquisition failed" });
        return;
      }

      // Extract claims from the id_token
      const idTokenClaims = tokenResponse.idTokenClaims as Record<
        string,
        unknown
      >;
      const email = (
        (idTokenClaims.email as string) ||
        (idTokenClaims.preferred_username as string) ||
        ""
      ).toLowerCase();
      const name =
        (idTokenClaims.name as string) ||
        [idTokenClaims.given_name, idTokenClaims.family_name]
          .filter(Boolean)
          .join(" ") ||
        email;

      if (!email) {
        log("Azure AD callback: no email/preferred_username in token claims");
        res.status(401).json({ error: "No email in Azure AD token" });
        return;
      }

      // Resolve AD role from the roles claim
      const adRoles = Array.isArray(idTokenClaims.roles)
        ? (idTokenClaims.roles as string[])
        : [];
      const resolvedRole = resolveAdRole(adRoles);

      // Find or create employee
      const dataSource = dataSourceProvider();
      const employeeRepo = dataSource.getRepository(Employee);
      let employee = await employeeRepo.findOne({
        where: { identifier: email },
      });

      if (employee) {
        // Update role from AD (AD is source of truth for AD users)
        employee.role = resolvedRole;
        employee.auth_provider = "azure_ad";
        if (name && name !== email) {
          employee.name = name;
        }
        await employeeRepo.save(employee);
        log(
          `Azure AD login: updated existing employee ${employee.id} (${email}), role=${resolvedRole}`,
        );
      } else {
        // Auto-provision new employee from Azure AD claims
        employee = employeeRepo.create({
          name: name || email,
          identifier: email,
          hire_date: today(),
          pto_rate: PTO_EARNING_SCHEDULE[0].dailyRate,
          carryover_hours: 0,
          role: resolvedRole,
          auth_provider: "azure_ad",
        });
        employee = await employeeRepo.save(employee);
        log(
          `Azure AD login: auto-provisioned employee ${employee.id} (${email}), role=${resolvedRole}`,
        );
      }

      // Issue the same HS256 session JWT as the magic-link flow
      const jwtSecret =
        process.env.JWT_SECRET || process.env.HASH_SALT || "default_jwt_secret";
      const sessionToken = jwt.sign(
        {
          employeeId: employee.id,
          role: employee.role,
          exp: Math.floor(Date.now() / 1000) + 10 * 365 * 24 * 60 * 60,
        },
        jwtSecret,
      );

      // Set cookie and redirect to the app root
      res.cookie("auth_hash", sessionToken, {
        path: "/",
        maxAge: 10 * 365 * 24 * 60 * 60 * 1000,
        httpOnly: false, // Must be accessible by client JS (same as magic-link flow)
        sameSite: "lax",
      });
      res.redirect("/");
    } catch (error) {
      log(`Azure AD callback error: ${error}`);
      res.redirect("/?error=azure_auth_failed");
    }
  });

  return router;
}
