import type { PlatformPermission } from "@workspace/db/schema"
import { Translation } from "./shared.js"

export const platformPermissionTranslations = {
  // ============================================
  // USERS
  // ============================================
  "user.view": { fa: "مشاهده کاربران", en: "View Users" },
  "user.create": { fa: "ایجاد کاربر", en: "Create User" },
  "user.update": { fa: "ویرایش کاربر", en: "Update User" },
  "user.delete": { fa: "حذف کاربر", en: "Delete User" },
  "user.suspend": { fa: "تعلیق کاربر", en: "Suspend User" },
  "user.activate": { fa: "فعال‌سازی کاربر", en: "Activate User" },

  "user.credential.view": {
    fa: "مشاهده اطلاعات احراز هویت کاربر",
    en: "View User Credentials",
  },
  "user.credential.manage": {
    fa: "مدیریت اطلاعات احراز هویت کاربر",
    en: "Manage User Credentials",
  },
  "user.mfa.view": {
    fa: "مشاهده وضعیت MFA کاربر",
    en: "View User MFA",
  },
  "user.mfa.manage": {
    fa: "مدیریت MFA کاربر",
    en: "Manage User MFA",
  },
  "user.otp.view": {
    fa: "مشاهده OTPهای کاربر",
    en: "View User OTPs",
  },

  "user.session.view": {
    fa: "مشاهده نشست‌های کاربر",
    en: "View User Sessions",
  },
  "user.session.revoke": {
    fa: "لغو نشست‌های کاربر",
    en: "Revoke User Sessions",
  },
  "user.device.view": {
    fa: "مشاهده دستگاه‌های کاربر",
    en: "View User Devices",
  },
  "user.device.revoke": {
    fa: "لغو دستگاه‌های کاربر",
    en: "Revoke User Devices",
  },

  "user.notification.view": {
    fa: "مشاهده اعلان‌های کاربر",
    en: "View User Notifications",
  },
  "user.notification.manage": {
    fa: "مدیریت اعلان‌های کاربر",
    en: "Manage User Notifications",
  },
  "user.media.view": {
    fa: "مشاهده رسانه‌های کاربر",
    en: "View User Media",
  },
  "user.media.manage": {
    fa: "مدیریت رسانه‌های کاربر",
    en: "Manage User Media",
  },

  "user.impersonate": {
    fa: "ورود به‌جای کاربر",
    en: "Impersonate User",
  },

  // ============================================
  // ADMINS
  // ============================================
  "admin.view": { fa: "مشاهده ادمین‌ها", en: "View Admins" },
  "admin.create": { fa: "ایجاد ادمین", en: "Create Admin" },
  "admin.update": { fa: "ویرایش ادمین", en: "Update Admin" },
  "admin.delete": { fa: "حذف ادمین", en: "Delete Admin" },
  "admin.suspend": { fa: "تعلیق ادمین", en: "Suspend Admin" },
  "admin.activate": { fa: "فعال‌سازی ادمین", en: "Activate Admin" },

  // ============================================
  // RBAC
  // ============================================
  "rbac.role.view": {
    fa: "مشاهده نقش‌ها",
    en: "View Roles",
  },
  "rbac.role.create": {
    fa: "ایجاد نقش",
    en: "Create Role",
  },
  "rbac.role.update": {
    fa: "ویرایش نقش",
    en: "Update Role",
  },
  "rbac.role.delete": {
    fa: "حذف نقش",
    en: "Delete Role",
  },
  "rbac.role.assign": {
    fa: "اختصاص نقش",
    en: "Assign Role",
  },

  "rbac.permission.view": {
    fa: "مشاهده دسترسی‌ها",
    en: "View Permissions",
  },
  "rbac.permission.manage": {
    fa: "مدیریت دسترسی‌ها",
    en: "Manage Permissions",
  },

  // ============================================
  // PLATFORM SETTINGS
  // ============================================
  "platform.setting.view": {
    fa: "مشاهده تنظیمات پلتفرم",
    en: "View Platform Settings",
  },
  "platform.setting.update": {
    fa: "ویرایش تنظیمات پلتفرم",
    en: "Update Platform Settings",
  },

  // ============================================
  // SECURITY OPERATIONS
  // ============================================
  "security.overview.view": {
    fa: "مشاهده نمای کلی امنیت",
    en: "View Security Overview",
  },
  "security.session.view": {
    fa: "مشاهده نشست‌های امنیتی",
    en: "View Security Sessions",
  },
  "security.session.revoke": {
    fa: "لغو نشست‌های امنیتی",
    en: "Revoke Security Sessions",
  },
  "security.device.view": {
    fa: "مشاهده دستگاه‌های امنیتی",
    en: "View Security Devices",
  },
  "security.device.revoke": {
    fa: "لغو دستگاه‌های امنیتی",
    en: "Revoke Security Devices",
  },
  "security.otp.view": {
    fa: "مشاهده OTPهای امنیتی",
    en: "View Security OTPs",
  },
  "security.mfa.view": {
    fa: "مشاهده MFA امنیتی",
    en: "View Security MFA",
  },
  "security.mfa.manage": {
    fa: "مدیریت MFA امنیتی",
    en: "Manage Security MFA",
  },
  "security.ip.block": {
    fa: "مسدودسازی IP",
    en: "Block IP",
  },
  "security.ip.unblock": {
    fa: "رفع مسدودی IP",
    en: "Unblock IP",
  },

  // ============================================
  // NOTIFICATIONS
  // ============================================
  "notification.view": {
    fa: "مشاهده اعلان‌ها",
    en: "View Notifications",
  },
  "notification.create": {
    fa: "ایجاد اعلان",
    en: "Create Notification",
  },
  "notification.update": {
    fa: "ویرایش اعلان",
    en: "Update Notification",
  },
  "notification.delete": {
    fa: "حذف اعلان",
    en: "Delete Notification",
  },
  "notification.send": {
    fa: "ارسال اعلان",
    en: "Send Notification",
  },

  // ============================================
  // MEDIA
  // ============================================
  "media.view": {
    fa: "مشاهده رسانه‌ها",
    en: "View Media",
  },
  "media.create": {
    fa: "ایجاد رسانه",
    en: "Create Media",
  },
  "media.update": {
    fa: "ویرایش رسانه",
    en: "Update Media",
  },
  "media.delete": {
    fa: "حذف رسانه",
    en: "Delete Media",
  },

  // ============================================
  // TICKETS
  // ============================================
  "ticket.view": {
    fa: "مشاهده تیکت‌ها",
    en: "View Tickets",
  },
  "ticket.create": {
    fa: "ایجاد تیکت",
    en: "Create Ticket",
  },
  "ticket.update": {
    fa: "ویرایش تیکت",
    en: "Update Ticket",
  },
  "ticket.delete": {
    fa: "حذف تیکت",
    en: "Delete Ticket",
  },
  "ticket.assign": {
    fa: "اختصاص تیکت",
    en: "Assign Ticket",
  },
  "ticket.reply": {
    fa: "پاسخ به تیکت",
    en: "Reply to Ticket",
  },
  "ticket.close": {
    fa: "بستن تیکت",
    en: "Close Ticket",
  },
  "ticket.reopen": {
    fa: "بازگشایی تیکت",
    en: "Reopen Ticket",
  },
  "ticket.manage": {
    fa: "مدیریت تیکت‌ها",
    en: "Manage Tickets",
  },

  // ============================================
  // FEEDBACK
  // ============================================
  "feedback.view": {
    fa: "مشاهده بازخوردها",
    en: "View Feedback",
  },
  "feedback.manage": {
    fa: "مدیریت بازخوردها",
    en: "Manage Feedback",
  },
  "feedback.delete": {
    fa: "حذف بازخورد",
    en: "Delete Feedback",
  },

  // ============================================
  // REVIEWS
  // ============================================
  "review.view": {
    fa: "مشاهده نظرات",
    en: "View Reviews",
  },
  "review.moderate": {
    fa: "بررسی نظرات",
    en: "Moderate Reviews",
  },
  "review.delete": {
    fa: "حذف نظر",
    en: "Delete Review",
  },
  "review.reconsideration.view": {
    fa: "مشاهده درخواست‌های بازبینی",
    en: "View Reconsideration Requests",
  },
  "review.reconsideration.resolve": {
    fa: "بررسی درخواست‌های بازبینی",
    en: "Resolve Reconsideration Requests",
  },

  // ============================================
  // AUDIT LOGS
  // ============================================
  "audit.view": {
    fa: "مشاهده لاگ‌های ممیزی",
    en: "View Audit Logs",
  },
  "audit.export": {
    fa: "خروجی گرفتن از لاگ‌های ممیزی",
    en: "Export Audit Logs",
  },

  // ============================================
  // APPLICATION LOGS
  // ============================================
  "application_log.view": {
    fa: "مشاهده لاگ‌های اپلیکیشن",
    en: "View Application Logs",
  },
  "application_log.export": {
    fa: "خروجی گرفتن از لاگ‌های اپلیکیشن",
    en: "Export Application Logs",
  },

  // ============================================
  // SYSTEM
  // ============================================
  "system.health.view": {
    fa: "مشاهده سلامت سیستم",
    en: "View System Health",
  },
  "system.metrics.view": {
    fa: "مشاهده متریک‌های سیستم",
    en: "View System Metrics",
  },
  "system.config.view": {
    fa: "مشاهده تنظیمات سیستم",
    en: "View System Config",
  },
  "system.config.update": {
    fa: "ویرایش تنظیمات سیستم",
    en: "Update System Config",
  },
  "system.data.export": {
    fa: "خروجی‌گیری از داده‌ها",
    en: "Export Data",
  },
  "system.data.import": {
    fa: "استخراج/ورود داده‌های منو",
    en: "Import / Extract Menu Data",
  },
  "system.backup.view": {
    fa: "مشاهده نسخه‌های پشتیبان",
    en: "View Backups",
  },
  "system.backup.create": {
    fa: "ایجاد نسخه پشتیبان",
    en: "Create Backup",
  },
  "system.backup.restore": {
    fa: "بازیابی نسخه پشتیبان",
    en: "Restore Backup",
  },
  "system.backup.delete": {
    fa: "حذف نسخه پشتیبان",
    en: "Delete Backup",
  },

  // ============================================
  // CAFES
  // ============================================
  "cafe.view": { fa: "مشاهده کافه‌ها", en: "View Cafes" },
  "cafe.create": { fa: "ایجاد کافه", en: "Create Cafe" },
  "cafe.update": { fa: "ویرایش کافه", en: "Update Cafe" },
  "cafe.delete": { fa: "حذف کافه", en: "Delete Cafe" },
  "cafe.suspend": { fa: "تعلیق کافه", en: "Suspend Cafe" },
  "cafe.activate": { fa: "فعال‌سازی کافه", en: "Activate Cafe" },

  // ============================================
  // BRANCHES
  // ============================================
  "branch.view": { fa: "مشاهده شعبه‌ها", en: "View Branches" },
  "branch.create": { fa: "ایجاد شعبه", en: "Create Branch" },
  "branch.update": { fa: "ویرایش شعبه", en: "Update Branch" },
  "branch.delete": { fa: "حذف شعبه", en: "Delete Branch" },
  "branch.suspend": { fa: "تعلیق شعبه", en: "Suspend Branch" },
  "branch.activate": { fa: "فعال‌سازی شعبه", en: "Activate Branch" },

  // ============================================
  // SUBSCRIPTION PLANS
  // ============================================
  "subscription_plan.view": {
    fa: "مشاهده پلان‌های اشتراک",
    en: "View Subscription Plans",
  },
  "subscription_plan.create": {
    fa: "ایجاد پلان اشتراک",
    en: "Create Subscription Plan",
  },
  "subscription_plan.update": {
    fa: "ویرایش پلان اشتراک",
    en: "Update Subscription Plan",
  },
  "subscription_plan.delete": {
    fa: "حذف پلان اشتراک",
    en: "Delete Subscription Plan",
  },

  // ============================================
  // SUBSCRIPTIONS
  // ============================================
  "subscription.view": { fa: "مشاهده اشتراک‌ها", en: "View Subscriptions" },
  "subscription.create": { fa: "ایجاد اشتراک", en: "Create Subscription" },
  "subscription.update": { fa: "ویرایش اشتراک", en: "Update Subscription" },
  "subscription.delete": { fa: "حذف اشتراک", en: "Delete Subscription" },
  "subscription.cancel": { fa: "لغو اشتراک", en: "Cancel Subscription" },
  "subscription.renew": { fa: "تمدید اشتراک", en: "Renew Subscription" },
  "subscription.gift": {
    fa: "اعطای روزهای اشتراک",
    en: "Gift Subscription Days",
  },

  // ============================================
  // MENU CATEGORIES
  // ============================================
  "menu_category.view": {
    fa: "مشاهده دسته‌بندی‌های منو",
    en: "View Menu Categories",
  },
  "menu_category.create": {
    fa: "ایجاد دسته‌بندی منو",
    en: "Create Menu Category",
  },
  "menu_category.update": {
    fa: "ویرایش دسته‌بندی منو",
    en: "Update Menu Category",
  },
  "menu_category.delete": {
    fa: "حذف دسته‌بندی منو",
    en: "Delete Menu Category",
  },

  // ============================================
  // PRODUCTS
  // ============================================
  "product.view": { fa: "مشاهده محصولات", en: "View Products" },
  "product.create": { fa: "ایجاد محصول", en: "Create Product" },
  "product.update": { fa: "ویرایش محصول", en: "Update Product" },
  "product.delete": { fa: "حذف محصول", en: "Delete Product" },

  // ============================================
  // MENUS
  // ============================================
  "menu.view": { fa: "مشاهده منوها", en: "View Menus" },
  "menu.create": { fa: "ایجاد منو", en: "Create Menu" },
  "menu.update": { fa: "ویرایش منو", en: "Update Menu" },
  "menu.delete": { fa: "حذف منو", en: "Delete Menu" },

  // ============================================
  // ORDERS
  // ============================================
  "order.view": { fa: "مشاهده سفارشات", en: "View Orders" },
  "order.create": { fa: "ایجاد سفارش", en: "Create Order" },
  "order.update": { fa: "ویرایش سفارش", en: "Update Order" },
  "order.delete": { fa: "حذف سفارش", en: "Delete Order" },
  "order.cancel": { fa: "لغو سفارش", en: "Cancel Order" },
  "order.refund": { fa: "استرداد سفارش", en: "Refund Order" },

  // ============================================
  // TABLES
  // ============================================
  "table.view": { fa: "مشاهده میزها", en: "View Tables" },
  "table.create": { fa: "ایجاد میز", en: "Create Table" },
  "table.update": { fa: "ویرایش میز", en: "Update Table" },
  "table.delete": { fa: "حذف میز", en: "Delete Table" },

  // ============================================
  // FINANCE
  // ============================================
  "finance.view": { fa: "مشاهده مالی", en: "View Finance" },
  "finance.transaction.view": {
    fa: "مشاهده تراکنش‌ها",
    en: "View Transactions",
  },
  "finance.transaction.create": {
    fa: "ایجاد تراکنش",
    en: "Create Transaction",
  },
  "finance.transaction.manage": {
    fa: "پردازش برداشت‌های کافه",
    en: "Manage Cafe Withdrawal Payouts",
  },
  "finance.report.view": {
    fa: "مشاهده گزارش مالی",
    en: "View Financial Report",
  },
  "finance.report.export": {
    fa: "خروجی گزارش مالی",
    en: "Export Financial Report",
  },

  // ============================================
  // REVENUE
  // ============================================
  "revenue.view": { fa: "مشاهده درآمد", en: "View Revenue" },
  "revenue.report.view": {
    fa: "مشاهده گزارش درآمد",
    en: "View Revenue Report",
  },
  "revenue.report.export": {
    fa: "خروجی گزارش درآمد",
    en: "Export Revenue Report",
  },

  // ============================================
  // PLATFORM WALLETS
  // ============================================
  "platform_wallet.view": { fa: "مشاهده کیف پول‌ها", en: "View Wallets" },
  "platform_wallet.create": { fa: "ایجاد کیف پول", en: "Create Wallet" },
  "platform_wallet.update": {
    fa: "ویرایش موجودی کیف پول",
    en: "Adjust Wallet Balance",
  },
  "platform_wallet.transaction.view": {
    fa: "مشاهده تراکنش‌های کیف پول",
    en: "View Wallet Transactions",
  },
  "platform_wallet.card.view": {
    fa: "مشاهده کارت‌های بانکی",
    en: "View Wallet Cards",
  },
  "platform_wallet.card.manage": {
    fa: "تأیید/رد کارت‌های بانکی",
    en: "Manage Wallet Cards",
  },
  "platform_wallet.withdraw.view": {
    fa: "مشاهده درخواست‌های برداشت",
    en: "View Withdrawal Requests",
  },
  "platform_wallet.withdraw.manage": {
    fa: "پردازش درخواست‌های برداشت",
    en: "Process Withdrawals",
  },

  // ============================================
  // PAYROLL
  // ============================================
  "payroll.view": { fa: "مشاهده حقوق و دستمزد", en: "View Payroll" },
  "payroll.create": { fa: "ایجاد حقوق و دستمزد", en: "Create Payroll" },
  "payroll.update": { fa: "ویرایش حقوق و دستمزد", en: "Update Payroll" },
  "payroll.delete": { fa: "حذف حقوق و دستمزد", en: "Delete Payroll" },
  "payroll.approve": { fa: "تأیید حقوق و دستمزد", en: "Approve Payroll" },
  "payroll.process": { fa: "پردازش حقوق و دستمزد", en: "Process Payroll" },

  // ============================================
  // SHIFTS
  // ============================================
  "shift.view": { fa: "مشاهده شیفت‌ها", en: "View Shifts" },
  "shift.create": { fa: "ایجاد شیفت", en: "Create Shift" },
  "shift.update": { fa: "ویرایش شیفت", en: "Update Shift" },
  "shift.delete": { fa: "حذف شیفت", en: "Delete Shift" },
  "shift.assign": { fa: "اختصاص شیفت", en: "Assign Shift" },

  // ============================================
  // PLATFORM CATEGORIES
  // ============================================
  "platform_category.view": {
    fa: "مشاهده دسته‌بندی‌های پلتفرم",
    en: "View Platform Categories",
  },
  "platform_category.create": {
    fa: "ایجاد دسته‌بندی پلتفرم",
    en: "Create Platform Category",
  },
  "platform_category.update": {
    fa: "ویرایش دسته‌بندی پلتفرم",
    en: "Update Platform Category",
  },
  "platform_category.delete": {
    fa: "حذف دسته‌بندی پلتفرم",
    en: "Delete Platform Category",
  },
  "platform_category_request.view": {
    fa: "مشاهده درخواست‌های دسته‌بندی",
    en: "View Category Requests",
  },
  "platform_category_request.manage": {
    fa: "تأیید/رد درخواست‌های دسته‌بندی",
    en: "Manage Category Requests",
  },

  // ============================================
  // ANALYTICS
  // ============================================
  "analytics.view": { fa: "مشاهده تحلیل‌ها", en: "View Analytics" },
  "analytics.report.view": {
    fa: "مشاهده گزارش‌های تحلیلی",
    en: "View Analytics Reports",
  },
  "analytics.report.export": {
    fa: "خروجی گزارش‌های تحلیلی",
    en: "Export Analytics Reports",
  },
} as const satisfies Record<PlatformPermission, Translation>
