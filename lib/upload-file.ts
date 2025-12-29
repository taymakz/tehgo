interface UploadError {
  provider: string;
  message: string;
  details?: unknown;
}

interface Provider<T = unknown> {
  name: string;
  url: string;
  method: "POST";
  formField: string;
  transformUrl?: (url: string) => string;
  parseResponse: (response: T) => string | null;
}

interface UploadResult {
  url: string;
}

interface TmpFilesResponse {
  status: string;
  data: { url: string };
}

const providers: Provider<TmpFilesResponse>[] = [
  {
    name: "tmpfiles",
    url: "https://tmpfiles.org/api/v1/upload",
    method: "POST",
    formField: "file",
    transformUrl: (url: string) => {
      const match = url.match(/https?:\/\/tmpfiles\.org\/(\d+)\/(.+)/);
      if (match) {
        const [, number, filename] = match;
        return `https://tmpfiles.org/dl/${number}/${filename}`;
      }
      return url.replace(
        /https?:\/\/tmpfiles\.org\//,
        "https://tmpfiles.org/dl/",
      );
    },
    parseResponse: (response: { status: string; data: { url: string } }) => {
      if (response.status === "success" && response.data?.url) {
        return response.data.url;
      }
      return null;
    },
  },
];

export async function uploadFile(
  file: File,
  onProgress?: (data: { percent: number; speed: number }) => void,
  cancelRef?: { current: (() => void) | null },
): Promise<UploadResult> {
  const errors: UploadError[] = [];

  for (const provider of providers) {
    try {
      const formData = new FormData();
      formData.append(provider.formField, file);

      return await new Promise<UploadResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        let lastLoaded = 0;
        let lastTimestamp = Date.now();

        if (cancelRef) {
          cancelRef.current = () => xhr.abort();
        }

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable && onProgress) {
            const percent = (event.loaded / event.total) * 100;
            const now = Date.now();
            const timeDelta = (now - lastTimestamp) / 1000;
            const bytesDelta = event.loaded - lastLoaded;
            const speed = timeDelta > 0 ? bytesDelta / timeDelta : 0;
            onProgress({ percent: Math.round(percent), speed });
            lastLoaded = event.loaded;
            lastTimestamp = now;
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText);
              const url = provider.parseResponse(result);
              if (!url) {
                reject(
                  new Error(`Invalid response format from ${provider.name}`),
                );
                return;
              }
              const finalUrl = provider.transformUrl
                ? provider.transformUrl(url)
                : url;
              resolve({ url: finalUrl });
            } catch (error) {
              reject(
                new Error(
                  `Failed to parse response from ${provider.name}: ${error}`,
                ),
              );
            }
          } else {
            reject(new Error(`HTTP error: ${xhr.status} ${xhr.statusText}`));
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Network error during upload"));
        });

        xhr.addEventListener("abort", () => {
          reject(new Error(`Upload canceled for ${provider.name}`));
        });

        xhr.open(provider.method, provider.url, true);
        xhr.send(formData);
      });
    } catch (error) {
      errors.push({
        provider: provider.name,
        message: `Failed to upload to ${provider.name}`,
        details: error instanceof Error ? error.message : error,
      });
    }
  }

  throw new Error(
    `All upload providers failed:\n${errors.map((e) => `${e.provider}: ${e.message} (${e.details})`).join("\n")}`,
  );
}
