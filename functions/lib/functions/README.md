To compile use `mvn clean install`

Functions are deployed to google cloud platform using the `./deployFunctionsToGCloud.sh` script. Simply just run `./deployFunctionsToGCloud.sh`.

The scheduler for the recurringEventsCron Google Cloud Run function written in Java is deployed by simply running `./deploySchedulerToGCloud.sh` script.
