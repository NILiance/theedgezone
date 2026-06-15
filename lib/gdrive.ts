/**
 * Google Drive uploader via service account.
 *
 * Env:
 *   GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON — entire service-account JSON pasted
 *     as a single env value. We parse it and authenticate with the
 *     google-auth-library JWT flow.
 *   GOOGLE_DRIVE_PARENT_FOLDER_ID — optional folder inside the service
 *     account's Drive to nest uploads under. The folder must be shared
 *     with the service account email.
 *
 * All uploads:
 *   1. Create a folder per talent if none exists.
 *   2. Upload the kit ZIP into that folder.
 *   3. Set "anyone with link can view" on the file.
 *   4. Return the public webViewLink + webContentLink.
 */
import { env } from '@/lib/env'

export interface DriveUpload {
  fileId: string
  webViewLink: string
  webContentLink: string
}

export function gdriveConfigured(): boolean {
  return Boolean(env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON)
}

async function getDriveClient() {
  if (!env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON) return null
  const { google } = await import('googleapis')
  let parsed: { client_email: string; private_key: string }
  try {
    parsed = JSON.parse(env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON)
  } catch {
    throw new Error('GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON is not valid JSON')
  }
  const auth = new google.auth.JWT({
    email: parsed.client_email,
    key: parsed.private_key.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/drive'],
  })
  await auth.authorize()
  return google.drive({ version: 'v3', auth })
}

/**
 * Idempotent folder creation: returns the existing folder's id, or creates
 * a new one under `parentId`. Matches the legacy WP plugin's
 * `ezf_gdrive_ensure_folder` so the resulting structure is the same.
 */
type DriveClient = NonNullable<Awaited<ReturnType<typeof getDriveClient>>>

async function ensureFolder(
  drive: DriveClient,
  parentId: string,
  folderName: string
): Promise<string> {
  // Look for an existing folder with this name under the parent.
  const escapedName = folderName.replace(/'/g, "\\'")
  const q = `name='${escapedName}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`
  const existing = await drive.files.list({
    q,
    fields: 'files(id, name)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  })
  if (existing.data.files && existing.data.files.length > 0) {
    return existing.data.files[0]!.id!
  }
  // Otherwise create it.
  const created = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id',
    supportsAllDrives: true,
  })
  if (!created.data.id) throw new Error('Drive folder create returned no id')
  return created.data.id
}

/**
 * Mirror a buffer to Drive using the legacy folder hierarchy:
 *   {PARENT_FOLDER_ID} > {userName} > {brandSlug} > {subfolder} > filename
 *
 * Non-fatal — callers should treat failures as a warning, not an error.
 * Returns `null` when Drive isn't configured (no env vars).
 *
 * Background semantics: Supabase Storage is the source of truth for
 * serving images in `<img src>`; this mirror is just for the talent and
 * admin to browse in Drive, plus offsite backup. Equivalent to the
 * legacy `ezf_gdrive_sync_file` call after `nilbd_save_image_to_uploads`.
 */
export async function mirrorImageToDrive(opts: {
  buffer: Buffer
  filename: string
  mimeType: string
  /** Top-level folder under PARENT_FOLDER — the talent's display name. */
  userName: string
  /** Per-brand subfolder under the talent's folder. */
  brandSlug: string
  /** Optional subfolder inside the brand folder (e.g. 'concepts', 'arsenal/business_card'). */
  subfolder?: string
}): Promise<DriveUpload | null> {
  const drive = await getDriveClient()
  if (!drive) return null
  const rootId = env.GOOGLE_DRIVE_PARENT_FOLDER_ID
  if (!rootId) return null

  const userFolder = await ensureFolder(drive, rootId, opts.userName)
  let parent = await ensureFolder(drive, userFolder, opts.brandSlug)
  if (opts.subfolder) {
    // Allow nested subfolders separated by '/'.
    for (const segment of opts.subfolder.split('/').filter(Boolean)) {
      parent = await ensureFolder(drive, parent, segment)
    }
  }

  const { Readable } = await import('stream')
  const stream = Readable.from(opts.buffer)
  const fileRes = await drive.files.create({
    requestBody: {
      name: opts.filename,
      parents: [parent],
      mimeType: opts.mimeType,
    },
    media: { mimeType: opts.mimeType, body: stream },
    fields: 'id, webViewLink, webContentLink',
    supportsAllDrives: true,
  })

  const fileId = fileRes.data.id
  if (!fileId) throw new Error('Drive image upload returned no id')

  // Make it visible to anyone with the link — matches the legacy default.
  await drive.permissions.create({
    fileId,
    requestBody: { role: 'reader', type: 'anyone' },
    supportsAllDrives: true,
  })

  return {
    fileId,
    webViewLink: fileRes.data.webViewLink ?? `https://drive.google.com/file/d/${fileId}/view`,
    webContentLink: fileRes.data.webContentLink ?? `https://drive.google.com/uc?id=${fileId}`,
  }
}

/** Upload a ZIP buffer to Drive and make it publicly viewable. */
export async function uploadZipToDrive(
  zipBuffer: Buffer,
  filename: string,
  parentFolderName?: string
): Promise<DriveUpload> {
  const drive = await getDriveClient()
  if (!drive) throw new Error('Drive not configured')

  // Optional: nest under a per-talent folder
  let folderId = env.GOOGLE_DRIVE_PARENT_FOLDER_ID ?? undefined
  if (parentFolderName) {
    const folderRes = await drive.files.create({
      requestBody: {
        name: parentFolderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: folderId ? [folderId] : undefined,
      },
      fields: 'id',
    })
    folderId = folderRes.data.id ?? folderId
  }

  // Drive's Node SDK wants the body as a Readable stream — wrap the
  // buffer cheaply.
  const { Readable } = await import('stream')
  const stream = Readable.from(zipBuffer)

  const fileRes = await drive.files.create({
    requestBody: {
      name: filename,
      parents: folderId ? [folderId] : undefined,
      mimeType: 'application/zip',
    },
    media: { mimeType: 'application/zip', body: stream },
    fields: 'id, webViewLink, webContentLink',
  })

  const fileId = fileRes.data.id
  if (!fileId) throw new Error('Drive returned no file id')

  // Make it public (anyone with link can view)
  await drive.permissions.create({
    fileId,
    requestBody: { role: 'reader', type: 'anyone' },
  })

  // Re-fetch to get the public webViewLink (the field is sometimes empty
  // until permissions are set).
  const meta = await drive.files.get({
    fileId,
    fields: 'id, webViewLink, webContentLink',
  })
  return {
    fileId,
    webViewLink: meta.data.webViewLink ?? `https://drive.google.com/file/d/${fileId}/view`,
    webContentLink: meta.data.webContentLink ?? `https://drive.google.com/uc?id=${fileId}`,
  }
}
