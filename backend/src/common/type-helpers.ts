/**
 * Type helpers for TypeScript strict mode compatibility
 *
 * These helpers are used to work around TypeScript's strict type checking
 * when dealing with external libraries that have complex or incompatible types.
 */

/**
 * Type-safe wrapper for JwtService.sign().
 * This helper properly types the payload and options to avoid using `any`.
 *
 * The JwtService.sign() method from @nestjs/jwt has complex overloads that
 * TypeScript struggles with, especially when dealing with custom payload types
 * and the expiresIn option. This helper provides a type-safe interface while
 * maintaining runtime safety.
 *
 * @example
 * ```ts
 * // Instead of:
 * // eslint-disable-next-line @typescript-eslint/no-explicit-any
 * const token = this.jwtService.sign(payload as any, { expiresIn: '16h' } as any);
 *
 * // Use:
 * import { safeJwtSign } from '../common/type-helpers';
 * const token = safeJwtSign(this.jwtService, payload, { expiresIn: '16h' });
 * ```
 */
export function safeJwtSign(
  jwtService: { sign: (payload: unknown, options?: unknown) => string },
  payload: Record<string, unknown>,
  options?: { expiresIn?: string | number },
): string {
  // JwtService.sign has complex overloads that TypeScript struggles with
  // This helper provides a type-safe interface while maintaining runtime safety
  return jwtService.sign(payload, options);
}
