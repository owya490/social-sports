#!/bin/bash

# Check if correct number of arguments are provided
if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <environment> <function_name>"
  exit 1
fi

ENVIRONMENT=$1
FUNCTION_NAME=$2

# Validate environment parameter
if [ "$ENVIRONMENT" != "dev" ] && [ "$ENVIRONMENT" != "prod" ]; then
  echo "Error: Environment must be 'dev' or 'prod'"
  exit 1
fi

# Copy service account private key into the generic functions_key.json file
cp "functions_key_$ENVIRONMENT.json" functions_key.json

# Copy the environment specific keys into the generic .env file
cp ".env.$ENVIRONMENT" .env

# Select respective firebase project
firebase use $ENVIRONMENT

echo "Deploying $FUNCTION_NAME to $ENVIRONMENT firebase"

# Deploy the function using firebase CLI
firebase deploy --only functions:$FUNCTION_NAME 