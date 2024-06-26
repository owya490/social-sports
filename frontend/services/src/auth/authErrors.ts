export class AuthServiceError extends Error {
  constructor(msg?: string) {
    super(msg);

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, AuthServiceError.prototype);
  }
}
