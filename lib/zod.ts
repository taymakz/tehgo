import * as zod from "zod";

// Custom error message
const requiredError = "این فیلد الزامی می باشد";

// Extend ZodString to include the `required` method
zod.ZodString.prototype.required = function (message = requiredError) {
  return this.min(1, { message }); // This adds the required validation
};

// Optionally declare the module for TypeScript
declare module "zod" {
  interface ZodString {
    required(message?: string): this;
  }
}
