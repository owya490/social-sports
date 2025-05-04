import { UserId } from "@/interfaces/UserTypes";
import { doc, runTransaction, Transaction } from "firebase/firestore";
import { db } from "../../firebase";
import { UsersServiceError } from "../userErrors";
import { getPublicUserById, getUsernameMapping, updateUser } from "../usersService";

export async function isUsernameExists(username: string, transaction?: Transaction): Promise<boolean> {
  try {
    // This function will throw UserNotFoundError if the username does not exist
    await getUsernameMapping(username.toLowerCase(), false, transaction);
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

export async function updateUsername(userId: UserId, username: string) {
  // run in a transaction
  await runTransaction(db, async (transaction) => {
    // check if username already exists
    if (await isUsernameExists(username, transaction)) {
      return false;
    }
    // ok cool it doesn't exist, continue to update
    // 1. get and memoize the old username
    const oldUsername = (await getPublicUserById(userId, false, true, transaction)).username;
    // 2. update the user data to new username
    await updateUser(userId, { username: username }, transaction);
    // 3. add the new username link to the usernames routing table
    const newUsernameDocRef = doc(db, "Usernames", username);
    transaction.set(newUsernameDocRef, { userId: userId });
    // 4. remove the old username reference link in the usernames routing table
    const oldUsernameDocRef = doc(db, "Usernames", oldUsername);
    transaction.delete(oldUsernameDocRef);

    return true;
  });
}

function randomIntFromInterval(min: number, max: number) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}
