/**
 * Example usage:
 *
 * ```typescript
 *
 * export type UserId = Branded<string, "UserId">
 *
 * // How to turn cast a primitive type to Branded type:
 *
 * function getUserId(): UserId {
 *  const user_id = "hello"; // this is typed as a string
 *  return basic_string as UserId; // cast string to UserId
 * }
 * ```
 */
declare const __brand: unique symbol;
type Brand<B> = { [__brand]: B };
export type Branded<T, B> = T & Brand<B>;
