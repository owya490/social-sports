import { faro, LogLevel } from "@grafana/faro-web-sdk";

/**
 * To use this class, please instantiate a instance of the Logger for every file you are logging for.
 * It is then as simple as calling the log functions respectively to the Logging Level you are after.
 * - DEBUG
 * - INFO
 * - WARN
 * - ERROR
 */

export class Logger {
  loggingContext: { [key: string]: string };

  constructor(loggerName: string, loggingContext?: { [key: string]: string }) {
    if (loggingContext !== undefined) {
      this.loggingContext = loggingContext;
    } else {
      this.loggingContext = {};
    }
    this.loggingContext.loggerName = loggerName;
  }

  public debug(log: string, loggingContext?: { [key: string]: string }) {
    this.log(
      log,
      loggingContext !== undefined ? loggingContext : {},
      LogLevel.DEBUG
    );
  }

  public info(log: string, loggingContext?: { [key: string]: string }) {
    this.log(
      log,
      loggingContext !== undefined ? loggingContext : {},
      LogLevel.INFO
    );
  }

  public warn(log: string, loggingContext?: { [key: string]: string }) {
    this.log(
      log,
      loggingContext !== undefined ? loggingContext : {},
      LogLevel.WARN
    );
  }

  public error(log: string, loggingContext?: { [key: string]: string }) {
    this.log(
      log,
      loggingContext !== undefined ? loggingContext : {},
      LogLevel.ERROR
    );
  }

  private log(
    log: string,
    loggingContext: { [key: string]: string },
    logLevel: LogLevel
  ) {
    const context = {
      level: logLevel,
      ...this.loggingContext,
      ...loggingContext,
    };

    faro.api.pushLog([log]);
    // faro.api.pushLog();
  }
}
