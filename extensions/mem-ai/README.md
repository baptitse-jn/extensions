# Mem AI for Raycast

Capture notes, ideas and knowledge to your [Mem AI](https://mem.ai) Second Brain directly from Raycast.

## Features

### Commands

- **Quick Capture** - Form to write and save notes with optional AI processing
- **Capture Clipboard** - Instantly send clipboard content to Mem (no-view)
- **Capture Selection** - Send selected text to Mem (no-view)

### AI Extension (@mem)

Use `@mem` in Raycast AI Chat to interact with your knowledge base:

```
@mem sauvegarde cette idée : utiliser l'IA pour automatiser les rapports
@mem note à retenir : réunion avec le client demain à 14h
@mem ajoute à ma base de connaissances : Les 3 piliers du PKM sont capture, organize, share
```

## Setup

### 1. Get your Mem API Key

1. Log in to [Mem](https://mem.ai)
2. Go to **Settings** → **Flows**
3. Click on **API**
4. Click **+ Create API Key**
5. Copy the generated key

### 2. Configure the extension

1. Open Raycast
2. Search for "Mem AI"
3. Press `⌘,` to open preferences
4. Paste your API Key

## Usage

### Quick Capture

1. Open Raycast and search "Quick Capture to Mem"
2. Write your note
3. Toggle "Use Mem AI" for intelligent organization
4. Optionally add custom instructions
5. Press Enter to save

### Capture from Clipboard

1. Copy any text
2. Open Raycast and search "Capture Clipboard to Mem"
3. Done! The content is saved with AI processing

### Capture Selection

1. Select text in any app
2. Open Raycast and search "Capture Selection to Mem"
3. Done! The selection is saved with AI processing

### AI Extension

1. Open Raycast AI Chat
2. Type `@mem` followed by your request
3. Raycast AI will interact with Mem on your behalf

## API Endpoints Used

- **Mem It (v2)** - `POST https://api.mem.ai/v2/mem-it`
  - AI-powered note creation with automatic organization
  - Bearer token authentication

- **Create Mem (v0)** - `POST https://api.mem.ai/v0/mems`
  - Simple note creation
  - ApiAccessToken authentication

## Development

```bash
# Install dependencies
npm install

# Start development
npm run dev

# Build for production
npm run build

# Lint code
npm run lint
```

## License

MIT

## Author

Baptiste - [Polaria](https://polaria.ai) / [My Wai](https://mywai.fr)
