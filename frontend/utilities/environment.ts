import process from "process";

export enum Environment {
  DEVELOPMENT = "DEVELOPMENT",
  PREVIEW = "PREVIEW",
  PRODUCTION = "PRODUCTION",
}

export function getEnvironment(): Environment {
  switch (process.env.ENVIRONMENT) {
    case "DEVELOPMENT": {
      return Environment.DEVELOPMENT;
    }
    case "PREVIEW": {
      return Environment.PREVIEW;
    }
    case "PRODUCTION": {
      return Environment.PRODUCTION;
    }
    default: {
      return Environment.DEVELOPMENT;
    }
  }
}

export function isProduction(): boolean {
  return getEnvironment() === Environment.PRODUCTION;
}
