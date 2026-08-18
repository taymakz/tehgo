import { zip, type Zippable } from "fflate"

export type ZipEntry = { name: string; blob: Blob }

// Bundles multiple exported images into one .zip so "export all" downloads
// a single file instead of triggering N separate browser downloads.
export async function zipFiles(entries: ZipEntry[]): Promise<Blob> {
  const data: Zippable = {}
  await Promise.all(
    entries.map(async ({ name, blob }) => {
      data[name] = new Uint8Array(await blob.arrayBuffer())
    })
  )

  return new Promise((resolve, reject) => {
    zip(data, { level: 6 }, (err, out) => {
      if (err) reject(err)
      else resolve(new Blob([out as BlobPart], { type: "application/zip" }))
    })
  })
}
