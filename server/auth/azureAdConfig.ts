import { featureFlags } from "../../shared/featureFlags.js";

/** Azure AD configuration derived from environment variables. */
export interface AzureAdConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authority: string;
}

/**
 * Reads Azure AD configuration from `process.env`.
 * Returns `null` when the feature flag is off or required vars are missing.
 */
export function getAzureAdConfig(): AzureAdConfig | null {
  if (!featureFlags.azureAdEnabled) return null;

  const tenantId = process.env.AZURE_AD_TENANT_ID;
  const clientId = process.env.AZURE_AD_CLIENT_ID;
  const clientSecret = process.env.AZURE_AD_CLIENT_SECRET;
  const redirectUri = process.env.AZURE_AD_REDIRECT_URI;

  if (!tenantId || !clientId || !clientSecret || !redirectUri) {
    return null;
  }

  return {
    tenantId,
    clientId,
    clientSecret,
    redirectUri,
    authority: `https://login.microsoftonline.com/${tenantId}`,
  };
}
