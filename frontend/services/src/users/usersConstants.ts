export const USERS_REFRESH_MILLIS = 5 * 60 * 1000; // Millis of 5 Minutes

export enum UsersLocalStorageKeys {
  UsersData = "usersData",
  LastFetchedUserData = "lastFetchedUserData",
}

export const DEFAULT_USER_PROFILE_PICTURE =
  "https://firebasestorage.googleapis.com/v0/b/socialsports-44162.appspot.com/o/users%2Fgeneric%2Fgeneric-profile-photo.webp?alt=media&token=15ca6518-e159-4c46-8f68-c445df11888c";
