update storage.buckets
set allowed_mime_types = array[
  'text/csv',
  'application/json',
  'application/zip',
  'application/x-zip-compressed',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'application/octet-stream'
]
where id = 'audit_uploads';