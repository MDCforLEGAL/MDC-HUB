# MDC HUB

Public file shelf. No logo. The name is the mark.

## Add a file

1. Put the file in the `files` folder.
2. Add it to `files.json`:

```json
{
  "name": "My file",
  "file": "files/my-file.png",
  "type": "image",
  "note": "Short note"
}
```

3. Upload the folder again.

## Host on Cloudflare Pages

1. Open https://dash.cloudflare.com and sign in.
2. Go to **Workers & Pages** → **Create** → **Pages** → **Upload assets**.
3. Zip the `mdc-hub` folder contents (index.html must be at the root of the zip).
4. Upload the zip.
5. You get a free `something.pages.dev` link. Everyone can open it.
