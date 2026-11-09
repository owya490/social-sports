import { UserId } from "@/interfaces/UserTypes";
import { isValidUsername, sanitizeUsernameInput } from "@/utilities/usernameValidationUtils";
import { doc, runTransaction, Transaction } from "firebase/firestore";
import { db } from "../../firebase";
import { UserNotFoundError } from "../userErrors";
import { getPublicUserById, getUsernameMapping, updateUser } from "../usersService";

export async function isUsernameExists(username: string, transaction?: Transaction): Promise<boolean> {
  try {
    await getUsernameMapping(username.toLowerCase(), false, transaction);
  } catch (error) {
    if (error instanceof UserNotFoundError) return false;
    throw error;
  }
  return true;
}

export async function updateUsername(userId: UserId, username: string) {
  username = sanitizeUsernameInput(username);
  if (!isValidUsername(username)) {
    return false;
  }
  return await runTransaction(db, async (transaction) => {
    if (await isUsernameExists(username, transaction)) {
      return false;
    }
    const oldUsername = (await getPublicUserById(userId, true, false, transaction)).username;
    await updateUser(userId, { username: username }, transaction);
    const newUsernameDocRef = doc(db, "Usernames", username);
    transaction.set(newUsernameDocRef, { userId: userId });
    const oldUsernameDocRef = doc(db, "Usernames", oldUsername);
    transaction.delete(oldUsernameDocRef);
    return true;
  });
}
