import { z } from "zod"
import { isValidIranPhone, normalizePhone } from "./phone"

const PASSWORD_MIN = 8
const PASSWORD_MAX = 128

const requiredString = (message: string) =>
  z.string().trim().min(1, { message })

const passwordRules = (label = "رمز عبور") =>
  requiredString(`${label} الزامی است`)
    .min(PASSWORD_MIN, {
      message: `${label} باید حداقل ${PASSWORD_MIN} کاراکتر باشد`,
    })
    .max(PASSWORD_MAX, {
      message: `${label} باید حداکثر ${PASSWORD_MAX} کاراکتر باشد`,
    })
    .regex(/[a-z]/, {
      message: `${label} باید حداقل یک حرف کوچک انگلیسی داشته باشد`,
    })
    .regex(/[A-Z]/, {
      message: `${label} باید حداقل یک حرف بزرگ انگلیسی داشته باشد`,
    })
    .regex(/[0-9]/, {
      message: `${label} باید حداقل یک عدد داشته باشد`,
    })

export const phoneSchema = requiredString("شماره موبایل الزامی است")
  .transform((value) => normalizePhone(value))
  .refine((value) => isValidIranPhone(value), {
    message: "شماره موبایل معتبر نیست",
  })

export const passwordSchema = passwordRules("رمز عبور")

export const newPasswordSchema = passwordRules("رمز عبور جدید")

export const confirmPasswordSchema = requiredString("تکرار رمز عبور الزامی است")

export const newPasswordWithConfirmSchema = z
  .object({
    newPassword: newPasswordSchema,
    confirmPassword: confirmPasswordSchema,
  })
  .superRefine(({ newPassword, confirmPassword }, ctx) => {
    if (newPassword !== confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "تکرار رمز عبور با رمز عبور جدید یکسان نیست",
      })
    }
  })
