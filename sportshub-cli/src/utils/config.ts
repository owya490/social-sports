import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { ConfigFile, JiraConfig } from "../types/config";

export class ConfigManager {
  private configDir: string;
  private configPath: string;

  constructor() {
    this.configDir = path.join(os.homedir(), ".config", "sportshub-cli");
    this.configPath = path.join(this.configDir, "config.json");
  }

  /**
   * Ensures the config directory exists
   */
  private ensureConfigDir(): void {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }
  }

  /**
   * Loads configuration from file
   */
  loadConfig(): ConfigFile | null {
    try {
      if (!fs.existsSync(this.configPath)) {
        return null;
      }

      const configData = fs.readFileSync(this.configPath, "utf8");
      return JSON.parse(configData) as ConfigFile;
    } catch (error) {
      console.error("Error loading config:", error);
      return null;
    }
  }

  /**
   * Saves configuration to file
   */
  saveConfig(config: JiraConfig): void {
    try {
      this.ensureConfigDir();
      const configData = JSON.stringify(config, null, 2);
      fs.writeFileSync(this.configPath, configData, "utf8");
    } catch (error) {
      throw new Error(`Failed to save configuration: ${error}`);
    }
  }

  /**
   * Validates that all required config fields are present
   */
  validateConfig(config: ConfigFile): config is JiraConfig {
    return !!(
      config.jiraBaseUrl &&
      config.email &&
      config.apiToken &&
      config.defaultProjectKey &&
      config.openRouterApiToken
    );
  }

  /**
   * Gets the full configuration, throws if incomplete
   */
  getConfig(): JiraConfig {
    const config = this.loadConfig();

    if (!config) {
      throw new Error('No configuration found. Please run "sportshub configure" first.');
    }

    if (!this.validateConfig(config)) {
      throw new Error('Incomplete configuration found. Please run "sportshub configure" to update your settings.');
    }

    return config;
  }

  /**
   * Checks if configuration exists and is valid
   */
  isConfigured(): boolean {
    try {
      this.getConfig();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets the config file path for display purposes
   */
  getConfigPath(): string {
    return this.configPath;
  }
}
