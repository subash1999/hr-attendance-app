import type { RegionConfig } from "./types.js";

/**
 * Registry of all available regions and their strategy implementations.
 * Regions are registered at startup and resolved at runtime by region code.
 */
export class RegionRegistry {
  private readonly regions = new Map<string, RegionConfig>();

  register(config: RegionConfig): void {
    this.regions.set(config.code, config);
  }

  get(code: string): RegionConfig | undefined {
    return this.regions.get(code);
  }

  getOrThrow(code: string): RegionConfig {
    const config = this.regions.get(code);
    if (!config) throw new Error(`Unknown region: ${code}`);
    return config;
  }

  list(): readonly RegionConfig[] {
    return [...this.regions.values()];
  }

  codes(): readonly string[] {
    return [...this.regions.keys()];
  }

  has(code: string): boolean {
    return this.regions.has(code);
  }
}

/** Global singleton registry. Regions register themselves at import time. */
export const regionRegistry = new RegionRegistry();
