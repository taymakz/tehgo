import { ApiResponseType } from "@/types/request";
import { toast } from "sonner";

// Fetch Wrapper
export async function fetchApi<T>(
  url: string,
  options: RequestInit = {},
): Promise<ApiResponseType<T>> {
  // Base Options
  options.headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  try {
    const response = await fetch(`/api/backend/${url}`, options);
    if (!response.ok) {
      throw new Error("مشکلی در ارتباط با سرور پیش آمده است: ");
    }
    return response.json();
  } catch (error: any) {
     
    // Handle error based on HTTP status or specific error message
    return handleFetchError<T>(error);
  }
}
/**
 * handleFetchError - Function to handle general API errors.
 * @param {any} error - Error object from $fetch.
 * @returns {ApiResponseType<T>} - Error response in the expected format.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleFetchError<T>(error: any): ApiResponseType<T> {
  if (error.status === 429) {
    toast("لطفا لحظاتی بعد تلاش کنید");
    return {
      success: false,
      status: error.response?.status,
      message: "لطفا لحظاتی بعد تلاش کنید",
      data: null,
    } as ApiResponseType<T>;
  } else if (error.status === 403) {
    toast("دسترسی غیرمجاز");
    return {
      success: false,
      status: error.response?.status,
      message: "دسترسی غیرمجاز",
      data: null,
    } as ApiResponseType<T>;
  } else if (error.message.includes("<no response> Failed to fetch")) {
    toast("درحال حاضر سرور در دسترس نمیباشد");
    return {
      success: false,
      status: 503,
      message: "درحال حاضر سرور در دسترس نمیباشد",
      data: null,
    } as ApiResponseType<T>;
  } else {
    return {
      success: false,
      status: error.response?.status,
      message: "مشکلی در عملیات رخ داده",
      data: null,
    } as ApiResponseType<T>;
  }
}
