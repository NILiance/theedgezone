-- Site-assets bucket was set up for site-builder image/video uploads only:
-- 10 MB cap, restricted MIME list. The brand-kit assembler tries to upload
-- the full brand-kit.zip there and fails with:
--   mime type application/zip is not supported
-- Add zip + pdf to the allowlist and bump the cap to 100 MB so a real
-- brand kit (images + 8-page brand guide + fonts + vectors) fits.

update storage.buckets
   set allowed_mime_types = array[
         'image/png','image/jpeg','image/webp','image/gif','image/svg+xml',
         'video/mp4','video/webm',
         'application/zip','application/pdf'
       ],
       file_size_limit = 100 * 1024 * 1024
 where id = 'site-assets';
