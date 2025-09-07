"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigManager = void 0;
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
class ConfigManager {
    constructor() {
        this.configDir = path.join(os.homedir(), ".config", "sportshub-cli");
        this.configPath = path.join(this.configDir, "config.json");
    }
    /**
     * Ensures the config directory exists
     */
    ensureConfigDir() {
        if (!fs.existsSync(this.configDir)) {
            fs.mkdirSync(this.configDir, { recursive: true });
        }
    }
    /**
     * Loads configuration from file
     */
    loadConfig() {
        try {
            if (!fs.existsSync(this.configPath)) {
                return null;
            }
            const configData = fs.readFileSync(this.configPath, "utf8");
            return JSON.parse(configData);
        }
        catch (error) {
            console.error("Error loading config:", error);
            return null;
        }
    }
    /**
     * Saves configuration to file
     */
    saveConfig(config) {
        try {
            this.ensureConfigDir();
            const configData = JSON.stringify(config, null, 2);
            fs.writeFileSync(this.configPath, configData, "utf8");
        }
        catch (error) {
            throw new Error(`Failed to save configuration: ${error}`);
        }
    }
    /**
     * Validates that all required config fields are present
     */
    validateConfig(config) {
        return !!(config.jiraBaseUrl &&
            config.email &&
            config.apiToken &&
            config.defaultProjectKey &&
            config.openRouterApiToken);
    }
    /**
     * Gets the full configuration, throws if incomplete
     */
    getConfig() {
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
    isConfigured() {
        try {
            this.getConfig();
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Gets the config file path for display purposes
     */
    getConfigPath() {
        return this.configPath;
    }
}
exports.ConfigManager = ConfigManager;
//# sourceMappingURL=config.js.map