# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a Raycast extension that monitors and manages MCP (Model Context Protocol) servers running on macOS. It detects MCP processes from multiple applications (Claude Desktop, VS Code, Cursor, Claude Code), displays their resource usage, and provides process management capabilities.

## Development Commands

### Setup
```bash
npm install
```

### Development
```bash
npm run dev          # Start development mode with hot reload (primary development command)
npm run build        # Build for production
```

### Code Quality
```bash
npm run lint         # Run ESLint checks
npm run fix-lint     # Auto-fix linting issues
```

### Publishing
```bash
npm run publish      # Publish extension to Raycast Store
```

## Architecture

### Core Components

**Entry Point** (`src/index.tsx`)
- Main list view component displaying all running MCP servers
- Handles process filtering by source (Claude Desktop, VS Code, Cursor, Claude Code)
- Manages kill actions (graceful and force kill) with confirmation dialogs
- Provides real-time resource usage display (RAM/CPU)

**MCP Detection Engine** (`src/utils/mcp-detector.ts`)
- Scans running processes using `ps` command to find MCP servers
- Reads MCP configuration files from multiple sources:
  - Claude Desktop: `~/Library/Application Support/Claude/claude_desktop_config.json`
  - VS Code: `~/Library/Application Support/Code/User/mcp.json`
  - Cursor: `~/.cursor/mcp.json`
  - Claude Code: `~/.claude/settings.json`
- Matches running processes to configured servers
- Extracts resource usage metrics (RAM, CPU, runtime)
- Determines parent application by analyzing process tree

**Detail View** (`src/components/MCPServerDetail.tsx`)
- Full-screen detail view for individual MCP server processes
- Shows complete command, configuration path, and resource metrics
- Provides quick actions for process management

### Key Data Flow

1. **Process Discovery**: `getMCPProcesses()` executes `ps` to list all node/python/npx/uvx processes, parses output for MCP patterns
2. **Config Matching**: Compares running processes against configs loaded by `getMCPConfigs()`
3. **Source Detection**: If not found in configs, traces parent process ID to determine which app spawned the server
4. **Display**: Formats data for Raycast List UI with color-coded tags for RAM/CPU/source

### Process Matching Logic

The detector uses multiple strategies to identify MCP servers:
- Direct MCP indicators in command (e.g., "mcp", "model-context-protocol")
- Regex patterns for common MCP naming conventions (`mcp-server`, `@modelcontextprotocol`, etc.)
- Matching against configured server commands from config files
- Parent process analysis (PPID lookup to trace back to Claude/VS Code/Cursor)

### Configuration File Format

MCP configs follow this structure:
```typescript
{
  "mcpServers": {
    "server-name": {
      "command": "node" | "python" | "npx" | "uvx",
      "args": ["arg1", "arg2"],
      "env": { "KEY": "value" }
    }
  }
}
```

## Platform-Specific Notes

- **macOS Only**: This extension is designed specifically for macOS
- Uses macOS-specific paths (`~/Library/Application Support/...`)
- Process management via Unix `kill` command (signal 15 for graceful, 9 for force)
- Requires `ps` command with BSD-style options

## Key Features

- **Auto-refresh**: Process list updates automatically every 5 seconds
- **Error handling**: User-friendly toast notifications for errors
- **Security**: PID validation and safe process killing using `spawnSync`
- **Robust parsing**: Uses `etime` instead of `lstart` for locale-independent time parsing
- **Configurable thresholds**: RAM and CPU thresholds exported as constants

## Testing the Extension

To test changes in a live Raycast environment:
1. Run `npm run dev` - this starts the Raycast development mode
2. Open Raycast (⌘+Space) and type "List MCP Servers"
3. The extension will hot-reload when you save changes
4. Process list refreshes automatically every 5 seconds

## Code Style

- Uses Prettier with 100-character line width, 2-space tabs
- Follows @raycast/eslint-config rules
- TypeScript with strict mode enabled

## Important Constants

**RAM Thresholds** (in `mcp-detector.ts`):
- `HIGH`: 500 MB (red)
- `MEDIUM`: 200 MB (orange)
- `MODERATE`: 100 MB (yellow)

**CPU Thresholds**:
- `HIGH`: 50% (red)
- `MEDIUM`: 20% (orange)
