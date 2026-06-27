# /data

Drop your Claude conversation export JSON here as `conversations.json` to enable sync.

## How to export from Claude

1. Go to claude.ai → Settings → Data export
2. Download the export ZIP
3. Extract the ZIP
4. Find the `conversations.json` file
5. Copy it to this `/data/` directory as `conversations.json`
6. Click the **Sync** button in the top right of the app

## File format expected

The file should be a JSON array of conversations, where each conversation has:
- `uuid`: string
- `name`: string
- `created_at`: ISO date string
- `chat_messages`: array of `{ sender, text, created_at }`

## Alternatively

You can POST the JSON directly to `/api/sync` as the `conversationJson` field in the request body.
