export type MfaStatus = "ENABLED" | "DISABLED" | "VERIFIED" | "NOT_VERIFIED"

export interface MfaLike {
  enabled?: boolean | null
  verifiedAt?: Date | string | null
  disabledAt?: Date | string | null
}

/**
 * Resolves high-level MFA status from a MFA-like object.
 *
 * @example
 * getMfaStatus({ enabled: true, verifiedAt: new Date() }) // 'VERIFIED'
 * getMfaStatus({ enabled: true, verifiedAt: null })       // 'ENABLED'
 * getMfaStatus({ enabled: false })                        // 'DISABLED'
 */
export function getMfaStatus(value: MfaLike): Omit<MfaStatus, "NOT_VERIFIED"> {
  if (!value.enabled || value.disabledAt) {
    return "DISABLED"
  }

  if (value.verifiedAt) {
    return "VERIFIED"
  }

  return "ENABLED"
}
