<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## User deployment preference

- Do not deploy or publish this project through GPT Sites / ChatGPT Sites.
- Do not upload or synchronize this project's source through GPT Sites helpers.
- Continue development, builds, and verification locally. Publishing to any other host requires the user to specify that destination.
- The existing `.openai/hosting.json` records a previous deployment only; it does not authorize further hosting actions.
- The user has authorized the `baidu` SSH server for the progress API/database and `Fizgrad/Sententia` on GitHub Pages for the frontend. These are the selected deployment targets.
- Keep database files, real environment files, account credentials, and private keys out of Git and all frontend artifacts. `NEXT_PUBLIC_*` values are public browser configuration.
