// Core API client logic shared between the admin, panel, and website apps.
// Wire it up with app-specific dependencies via createApiStack({ ... }).
//
// Sessions are opaque server-side tokens: the browser just sends the `sid`
// cookie, and the server slides/rotates it automatically. So there is no
// client-driven token refresh — a 401 means the session is genuinely gone and
// the caller (useFetchApi) clears state and redirects to login.

// ── Types ─────────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  status: number
  response?: ApiResponse<unknown>

  constructor(
    message: string,
    status: number,
    response?: ApiResponse<unknown>
  ) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.response = response
  }
}

export type ApiResponse<T> = {
  data: T
  success: boolean
  status: number
  message?: string
}

export type ApiRequestBody =
  | BodyInit
  | Record<string, unknown>
  | null
  | undefined

export type ApiRequestOptions<TBody = unknown> = Omit<RequestInit, "body"> & {
  body?: TBody
  /**
   * Suppress the automatic redirect-to-login on a 401 in useFetchApi. Use for the
   * logout call and any endpoint where a 401 is an expected, handled outcome.
   */
  skipAuthRefresh?: boolean
}

export type SseHandlers = {
  onEvent: (event: string, data: string) => void
  onConnected?: () => void
  onDisconnected?: () => void
}

// ── Pure helpers ──────────────────────────────────────────────────────────────

export function isSpecialBody(body: unknown): boolean {
  return (
    (typeof FormData !== "undefined" && body instanceof FormData) ||
    (typeof Blob !== "undefined" && body instanceof Blob) ||
    (typeof ArrayBuffer !== "undefined" && body instanceof ArrayBuffer) ||
    (typeof URLSearchParams !== "undefined" &&
      body instanceof URLSearchParams) ||
    (typeof ReadableStream !== "undefined" && body instanceof ReadableStream)
  )
}

export function shouldJsonEncode(body: unknown): boolean {
  if (body == null) return false
  if (typeof body !== "object") return false
  return !isSpecialBody(body)
}

export function normalizeResponseMessage(
  response: Response,
  payload: unknown
): string {
  if (payload && typeof payload === "object" && "message" in payload) {
    const msg = (payload as { message?: unknown }).message
    if (typeof msg === "string" && msg.trim()) return msg
  }
  return response.statusText || "Request failed"
}

export async function readResponse<T>(
  response: Response
): Promise<ApiResponse<T>> {
  const text = await response.text()

  if (!text) {
    return { success: response.ok, status: response.status, data: null as T }
  }

  let payload: unknown = text
  try {
    payload = JSON.parse(text)
  } catch {}

  if (!response.ok) {
    return {
      success: false,
      status: response.status,
      message: normalizeResponseMessage(response, payload),
      data: null as T,
    }
  }

  return { success: true, status: response.status, data: payload as T }
}

// ── Factory ───────────────────────────────────────────────────────────────────

export interface ApiClientDeps {
  /** Build an absolute API URL from a relative path, e.g. "/v1/auth/logout" */
  buildApiUrl: (path: string) => string
}

/**
 * Creates the API client factory. Call once at module level per app.
 */
export function createApiStack(deps: ApiClientDeps) {
  // ── SSE ───────────────────────────────────────────────────────────────────────

  function sseDelay(ms: number, signal: AbortSignal): Promise<void> {
    return new Promise((resolve) => {
      const t = setTimeout(resolve, ms)
      signal.addEventListener(
        "abort",
        () => {
          clearTimeout(t)
          resolve()
        },
        { once: true }
      )
    })
  }

  async function fetchSSEStream(
    path: string,
    handlers: SseHandlers,
    signal: AbortSignal
  ): Promise<void> {
    const url = deps.buildApiUrl(path)

    while (!signal.aborted) {
      try {
        const response = await fetch(url, {
          credentials: "include",
          headers: { Accept: "text/event-stream" },
          signal,
        })

        // 401 = session gone; the server can't recover it for us. Stop the loop.
        if (response.status === 401) {
          handlers.onDisconnected?.()
          break
        }

        if (!response.ok || !response.body) {
          handlers.onDisconnected?.()
          await sseDelay(3000, signal)
          continue
        }

        handlers.onConnected?.()

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ""

        try {
          while (!signal.aborted) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split("\n")
            buffer = lines.pop() ?? ""

            let currentEvent = "message"
            let currentData = ""

            for (const line of lines) {
              if (line.startsWith("event: ")) {
                currentEvent = line.slice(7).trim()
              } else if (line.startsWith("data: ")) {
                currentData = line.slice(6)
              } else if (line.trim() === "" && currentData !== "") {
                handlers.onEvent(currentEvent, currentData)
                currentEvent = "message"
                currentData = ""
              }
            }
          }
        } finally {
          reader.cancel().catch(() => {})
        }

        handlers.onDisconnected?.()
        await sseDelay(1000, signal)
      } catch {
        if (signal.aborted) break
        handlers.onDisconnected?.()
        await sseDelay(3000, signal)
      }
    }
  }

  // ── createApiClient ───────────────────────────────────────────────────────────

  function createApiClient() {
    const request = async <TResponse, TBody = unknown>(
      path: string,
      options: ApiRequestOptions<TBody> = {}
    ): Promise<ApiResponse<TResponse>> => {
      const { body, headers, skipAuthRefresh, ...rest } = options
      void skipAuthRefresh // handled by useFetchApi, not at the transport layer

      const jsonBody = shouldJsonEncode(body)

      const baseHeaders: HeadersInit = {
        ...(jsonBody ? { "Content-Type": "application/json" } : {}),
        ...(headers ?? {}),
      }

      const requestBody =
        typeof FormData !== "undefined" && body instanceof FormData
          ? body
          : jsonBody
            ? JSON.stringify(body)
            : (body as BodyInit | null | undefined)

      // Drop Content-Type for FormData so the browser sets the multipart boundary.
      const finalHeaders =
        typeof FormData !== "undefined" && body instanceof FormData
          ? (() => {
              const h = new Headers(baseHeaders)
              h.delete("Content-Type")
              return h
            })()
          : baseHeaders

      try {
        const response = await fetch(deps.buildApiUrl(path), {
          ...rest,
          headers: finalHeaders,
          body: requestBody,
          credentials: rest.credentials ?? "include",
        })

        const envelope = await readResponse<TResponse>(response)

        if (!response.ok || envelope.success === false) {
          throw new ApiError(
            envelope.message ?? response.statusText ?? "Request failed",
            response.status,
            envelope
          )
        }

        return envelope
      } catch (error) {
        if (error instanceof ApiError) throw error
        throw new ApiError(
          error instanceof Error ? error.message : "Unexpected network error",
          0
        )
      }
    }

    return {
      request,

      get: <TResponse>(
        path: string,
        options?: Omit<ApiRequestOptions, "body" | "method">
      ) => request<TResponse>(path, { ...options, method: "GET" }),

      post: <TResponse, TBody = unknown>(
        path: string,
        body?: TBody,
        options?: Omit<ApiRequestOptions<TBody>, "body" | "method">
      ) =>
        request<TResponse, TBody>(path, { ...options, method: "POST", body }),

      put: <TResponse, TBody = unknown>(
        path: string,
        body?: TBody,
        options?: Omit<ApiRequestOptions<TBody>, "body" | "method">
      ) => request<TResponse, TBody>(path, { ...options, method: "PUT", body }),

      patch: <TResponse, TBody = unknown>(
        path: string,
        body?: TBody,
        options?: Omit<ApiRequestOptions<TBody>, "body" | "method">
      ) =>
        request<TResponse, TBody>(path, { ...options, method: "PATCH", body }),

      delete: <TResponse, TBody = unknown>(
        path: string,
        body?: TBody,
        options?: Omit<ApiRequestOptions<TBody>, "body" | "method">
      ) =>
        request<TResponse, TBody>(path, { ...options, method: "DELETE", body }),

      sse: (path: string, handlers: SseHandlers, signal: AbortSignal) =>
        fetchSSEStream(path, handlers, signal),
    }
  }

  return { createApiClient }
}
