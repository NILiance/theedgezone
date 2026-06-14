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
