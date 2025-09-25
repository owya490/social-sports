package com.functions.utils.environment;

public enum Environment {
  DEVELOPMENT("socialsports-44162"),
  PRODUCTION("socialsportsprod");

  private final String projectName;

  Environment(String projectName) {
    this.projectName = projectName;
  }
  
  public String getProjectName() {
    return projectName;
  }

  public static Environment fromString(String projectName) {
    switch (projectName) {
      case "socialsports-44162":
        return DEVELOPMENT;
      case "socialsportsprod":
        return PRODUCTION;
      default:
        return null;
    }
  }
}
