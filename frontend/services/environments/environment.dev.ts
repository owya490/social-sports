require("dotenv").config();

const clientSecret = process.env["FIREBASECONFIGDEV"];

if (typeof clientSecret !== "string") {
  console.error(
    "FIREBASECONFIGDEV environment variable is not set or is not a string."
  );
  throw new Error("clientSecret is not a string");
}

export const firebaseConfig = JSON.parse(clientSecret);
