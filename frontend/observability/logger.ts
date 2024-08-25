import { getCurrentTime } from "@/services/src/datetimeUtils";
import { Environment, getEnvironment } from "@/utilities/environment";
import { LogLevel, faro } from "@grafana/faro-web-sdk";

export class Logger {
  loggingContext: { [key: string]: string };

  constructor(loggerName: string, loggingContext?: { [key: string]: string }) {
    this.loggingContext = loggingContext || {};
    this.loggingContext.loggerName = loggerName;
  }

  public debug(log: string, loggingContext?: { [key: string]: string }) {
    this.log(log, loggingContext || {}, LogLevel.DEBUG);
  }

  public info(log: string, loggingContext?: { [key: string]: string }) {
    this.log(log, loggingContext || {}, LogLevel.INFO);
  }

  public warn(log: string, loggingContext?: { [key: string]: string }) {
    this.log(log, loggingContext || {}, LogLevel.WARN);
  }

  public error(log: string, loggingContext?: { [key: string]: string }) {
    this.log(log, loggingContext || {}, LogLevel.ERROR);
  }

  private log(log: string, loggingContext: { [key: string]: string }, logLevel: LogLevel) {
    if (getEnvironment() === Environment.DEVELOPMENT) {
      this.logToConsole(`${getCurrentTime()} ${log}`, loggingContext, logLevel);
    } else {
      this.logToGrafanaFaro(log, loggingContext, logLevel);
    }
  }

  private logToGrafanaFaro(log: string, loggingContext: { [key: string]: string }, logLevel: LogLevel) {
    if (faro && faro.api && typeof faro.api.pushLog === "function") {
      const context = {
        level: logLevel,
        ...this.loggingContext,
        ...loggingContext,
      };
      try {
        faro.api.pushLog([log], { context });
      } catch (error) {
        console.error("Failed to push log to Grafana Faro:", error);
      }
    } else {
      console.error("Grafana Faro not initialized or available.");
    }
  }

  private logToConsole(log: string, loggingContext: { [key: string]: string }, logLevel: LogLevel) {
    switch (logLevel) {
      case LogLevel.DEBUG:
        console.debug(log, loggingContext);
        break;
      case LogLevel.INFO:
        console.info(log, loggingContext);
        break;
      case LogLevel.WARN:
        console.warn(log, loggingContext);
        break;
      case LogLevel.ERROR:
        console.error(log, loggingContext);
        break;
    }
  }
}
