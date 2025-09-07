import { ConfigFile, JiraConfig } from "../types/config";
export declare class ConfigManager {
    private configDir;
    private configPath;
    constructor();
    /**
     * Ensures the config directory exists
     */
    private ensureConfigDir;
    /**
     * Loads configuration from file
     */
    loadConfig(): ConfigFile | null;
    /**
     * Saves configuration to file
     */
    saveConfig(config: JiraConfig): void;
    /**
     * Validates that all required config fields are present
     */
    validateConfig(config: ConfigFile): config is JiraConfig;
    /**
     * Gets the full configuration, throws if incomplete
     */
    getConfig(): JiraConfig;
    /**
     * Checks if configuration exists and is valid
     */
    isConfigured(): boolean;
    /**
     * Gets the config file path for display purposes
     */
    getConfigPath(): string;
}
//# sourceMappingURL=config.d.ts.map