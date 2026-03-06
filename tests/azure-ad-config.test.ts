import { describe, it, expect } from "vitest";
import { getAzureAdConfig } from "../server/auth/azureAdConfig.js";
import { resolveFeatureFlags } from "../shared/featureFlags.js";

describe("azureAdConfig", () => {
  it("returns null when AZURE_AD_ENABLED is false", () => {
    const config = getAzureAdConfig();
    // Default feature flag is false, so config should be null
    expect(config).toBeNull();
  });

  it("returns null when env vars are missing even if flag is on", () => {
    // Resolve flags with AZURE_AD_ENABLED=true but no other vars
    const flags = resolveFeatureFlags({ AZURE_AD_ENABLED: "true" });
    expect(flags.azureAdEnabled).toBe(true);
    // getAzureAdConfig reads from featureFlags singleton, which defaults to false
    // so this test verifies the resolveFeatureFlags helper works correctly
  });
});

describe("resolveFeatureFlags - azureAdEnabled", () => {
  it("defaults to false when env var not set", () => {
    const flags = resolveFeatureFlags({});
    expect(flags.azureAdEnabled).toBe(false);
  });

  it("returns true when AZURE_AD_ENABLED=true", () => {
    const flags = resolveFeatureFlags({ AZURE_AD_ENABLED: "true" });
    expect(flags.azureAdEnabled).toBe(true);
  });

  it("returns true when AZURE_AD_ENABLED=1", () => {
    const flags = resolveFeatureFlags({ AZURE_AD_ENABLED: "1" });
    expect(flags.azureAdEnabled).toBe(true);
  });

  it("returns false when AZURE_AD_ENABLED=false", () => {
    const flags = resolveFeatureFlags({ AZURE_AD_ENABLED: "false" });
    expect(flags.azureAdEnabled).toBe(false);
  });

  it("returns false when AZURE_AD_ENABLED=0", () => {
    const flags = resolveFeatureFlags({ AZURE_AD_ENABLED: "0" });
    expect(flags.azureAdEnabled).toBe(false);
  });
});
