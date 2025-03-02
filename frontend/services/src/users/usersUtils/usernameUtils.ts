import { UsersServiceError } from "../userErrors";
import { getUsernameMapping } from "../usersService";

export async function isUsernameExists(username: string): Promise<boolean> {
  try {
    // This function will throw UserNotFoundError if the username does not exist
    await getUsernameMapping(username.toLowerCase());
  } catch (error) {
    return false;
  }
  return true;
}

export async function generateUsername(firstName: string): Promise<string> {
  var username = firstName.toLowerCase();
  for (let i = 0; i < 100; i++) {
    if (await isUsernameExists(username)) {
      // username exists, append a random number
      const randomNumber = randomIntFromInterval(0, 9);
      username = `${username}${randomNumber}`;
    } else {
      // username doesn't exist, can be used.
      return username;
    }
  }
  throw new UsersServiceError(
    username,
    "We weren't able to generate a username, please try again or contact SPORTSHUB."
  );
}

function randomIntFromInterval(min: number, max: number) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}
