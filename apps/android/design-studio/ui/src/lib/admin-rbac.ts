import { PlatformPermission } from "@workspace/db"
import { platformPermissionTranslations } from "../translations/admin-rbac.js"

export type PermissionSource =
  | ReadonlyArray<PlatformPermission>
  | ReadonlySet<PlatformPermission>

function isPermissionArray(
  permissions: PermissionSource
): permissions is ReadonlyArray<PlatformPermission> {
  return Array.isArray(permissions)
}

function permissionSourceHas(
  permissions: PermissionSource,
  permission: PlatformPermission
): boolean {
  if (isPermissionArray(permissions)) {
    return permissions.includes(permission)
  }

  return permissions.has(permission)
}

export function hasPlatformPermission(
  permissions: PermissionSource,
  permission: PlatformPermission
): boolean {
  return permissionSourceHas(permissions, permission)
}

export function hasAnyPlatformPermission(
  permissions: PermissionSource,
  requiredPermissions: ReadonlyArray<PlatformPermission>
): boolean {
  if (requiredPermissions.length === 0) {
    return true
  }

  return requiredPermissions.some((permission) =>
    permissionSourceHas(permissions, permission)
  )
}

export function hasAllPlatformPermissions(
  permissions: PermissionSource,
  requiredPermissions: ReadonlyArray<PlatformPermission>
): boolean {
  if (requiredPermissions.length === 0) {
    return true
  }

  return requiredPermissions.every((permission) =>
    permissionSourceHas(permissions, permission)
  )
}

export function getMissingPlatformPermissions(
  permissions: PermissionSource,
  requiredPermissions: ReadonlyArray<PlatformPermission>
): PlatformPermission[] {
  return requiredPermissions.filter(
    (permission) => !permissionSourceHas(permissions, permission)
  )
}

export function uniquePlatformPermissions(
  permissions: ReadonlyArray<PlatformPermission>
): PlatformPermission[] {
  return Array.from(new Set(permissions))
}

export function translatePlatformPermission(
  permission: PlatformPermission,
  locale: "fa" | "en" = "fa"
): string {
  return platformPermissionTranslations[permission][locale]
}

export function translatePlatformPermissions(
  permissions: ReadonlyArray<PlatformPermission>,
  locale: "fa" | "en" = "fa"
): string[] {
  return permissions.map((permission) =>
    translatePlatformPermission(permission, locale)
  )
}
