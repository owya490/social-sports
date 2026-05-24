export enum Environment {
  DEVELOPMENT = "DEVELOPMENT",
  PREVIEW = "PREVIEW",
  PRODUCTION = "PRODUCTION",
}

export function parseEnvironment(value: string | undefined): Environment | undefined {
  switch (value) {
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

export function getEnvironment(): Environment | undefined {
  return parseEnvironment(process.env.NEXT_PUBLIC_ENVIRONMENT ?? process.env.ENVIRONMENT);
}
