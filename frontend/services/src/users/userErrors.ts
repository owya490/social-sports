export class UserNotFoundError extends Error {
  constructor(userId: string, msg?: string) {
    if (msg === undefined) {
      super(`UserId ${userId} was not found or undefined`);
    } else {
      super(`UserId ${userId} was not found or undefined: ${msg}`);
    }

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, UserNotFoundError.prototype);
  }
}

export class UsersServiceError extends Error {
  constructor(userId: string, msg?: string) {
    if (msg === undefined) {
      super(`Error in usersService for ID=${userId}`);
    } else {
      super(`Error in usersService for ID=${userId}: ${msg}`);
    }

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, UsersServiceError.prototype);
  }
}
