import process from "process";

export enum Environment {
  DEVELOPMENT = "DEVELOPMENT",
  PREVIEW = "PREVIEW",
  PRODUCTION = "PRODUCTION",
}

export function getEnvironment() {
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
  }
}
