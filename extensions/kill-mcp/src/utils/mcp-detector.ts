import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { homedir } from "os";
import path from "path";

export interface MCPServerConfig {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface MCPProcess {
  pid: number;
  name: string;
  command: string;
  fullCommand: string;
  ramUsageMB: number;
  ramPercentage: number;
  cpuPercentage: number;
  source: "claude-desktop" | "vscode" | "cursor" | "claude-code" | "unknown";
  configPath?: string;
  startTime?: string;
}

export interface MCPConfig {
  source: "claude-desktop" | "vscode" | "cursor" | "claude-code";
  path: string;
  servers: Record<string, MCPServerConfig>;
}

// Get all MCP configuration files
export function getMCPConfigs(): MCPConfig[] {
  const configs: MCPConfig[] = [];
  const home = homedir();

  // Claude Desktop config paths
  const claudeDesktopPaths = [
    path.join(home, "Library/Application Support/Claude/claude_desktop_config.json"),
    path.join(home, ".config/claude/claude_desktop_config.json"),
  ];

  for (const configPath of claudeDesktopPaths) {
    if (existsSync(configPath)) {
      try {
        const content = JSON.parse(readFileSync(configPath, "utf-8"));
        if (content.mcpServers) {
          configs.push({
            source: "claude-desktop",
            path: configPath,
            servers: content.mcpServers,
          });
        }
      } catch {
        // Invalid JSON, skip
      }
    }
  }

  // VS Code MCP config paths
  const vscodePaths = [
    path.join(home, "Library/Application Support/Code/User/mcp.json"),
    path.join(home, ".vscode/mcp.json"),
  ];

  for (const configPath of vscodePaths) {
    if (existsSync(configPath)) {
      try {
        const content = JSON.parse(readFileSync(configPath, "utf-8"));
        const servers = content.mcpServers || content.servers || content;
        if (typeof servers === "object") {
          configs.push({
            source: "vscode",
            path: configPath,
            servers: servers,
          });
        }
      } catch {
        // Invalid JSON, skip
      }
    }
  }

  // Cursor MCP config paths
  const cursorPaths = [
    path.join(home, ".cursor/mcp.json"),
    path.join(home, "Library/Application Support/Cursor/cursor_desktop_config.json"),
  ];

  for (const configPath of cursorPaths) {
    if (existsSync(configPath)) {
      try {
        const content = JSON.parse(readFileSync(configPath, "utf-8"));
        const servers = content.mcpServers || content.servers || content;
        if (typeof servers === "object") {
          configs.push({
            source: "cursor",
            path: configPath,
            servers: servers,
          });
        }
      } catch {
        // Invalid JSON, skip
      }
    }
  }

  // Claude Code config paths
  const claudeCodePaths = [
    path.join(home, ".claude/settings.json"),
    path.join(home, ".config/claude-code/settings.json"),
  ];

  for (const configPath of claudeCodePaths) {
    if (existsSync(configPath)) {
      try {
        const content = JSON.parse(readFileSync(configPath, "utf-8"));
        if (content.mcpServers) {
          configs.push({
            source: "claude-code",
            path: configPath,
            servers: content.mcpServers,
          });
        }
      } catch {
        // Invalid JSON, skip
      }
    }
  }

  return configs;
}

// Get running MCP processes
export function getMCPProcesses(): MCPProcess[] {
  const processes: MCPProcess[] = [];
  const configs = getMCPConfigs();

  // Build a map of known MCP commands for matching
  const knownMCPCommands = new Map<
    string,
    { name: string; source: MCPConfig["source"]; configPath: string }
  >();

  for (const config of configs) {
    for (const [serverName, serverConfig] of Object.entries(config.servers)) {
      const cmdKey = serverConfig.command + (serverConfig.args?.join(" ") || "");
      knownMCPCommands.set(cmdKey, {
        name: serverName,
        source: config.source,
        configPath: config.path,
      });
    }
  }

  try {
    // Get all processes with memory and CPU info using ps
    // %mem = memory percentage, rss = resident set size in KB
    const psOutput = execSync(
      `ps -eo pid,ppid,%mem,rss,%cpu,lstart,command | grep -E "(node|python|npx|uvx|deno)" | grep -v "grep"`,
      { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 }
    ).trim();

    if (!psOutput) return processes;

    const lines = psOutput.split("\n");

    for (const line of lines) {
      // Parse the ps output - lstart has a complex format like "Mon Jan 19 10:30:00 2024"
      const match = line.match(
        /^\s*(\d+)\s+(\d+)\s+([\d.]+)\s+(\d+)\s+([\d.]+)\s+(\w+\s+\w+\s+\d+\s+[\d:]+\s+\d+)\s+(.+)$/
      );

      if (!match) continue;

      const [, pidStr, ppidStr, memPercent, rssKB, cpuPercent, startTime, fullCommand] = match;
      const pid = parseInt(pidStr, 10);
      const ppid = parseInt(ppidStr, 10);
      const ramMB = Math.round(parseInt(rssKB, 10) / 1024);

      // Check if this looks like an MCP server process
      const isMCPProcess = isMCPServerProcess(fullCommand, configs);

      if (!isMCPProcess) continue;

      // Try to find the server name from config
      let serverName = "Unknown MCP Server";
      let source: MCPProcess["source"] = "unknown";
      let configPath: string | undefined;

      // Check against known MCP commands
      for (const [cmdPattern, info] of knownMCPCommands) {
        if (
          fullCommand.includes(cmdPattern) ||
          cmdPattern.split(" ").some((part) => fullCommand.includes(part))
        ) {
          serverName = info.name;
          source = info.source;
          configPath = info.configPath;
          break;
        }
      }

      // If not found in config, try to extract name from command
      if (serverName === "Unknown MCP Server") {
        serverName = extractServerName(fullCommand);
      }

      // Determine source from parent process if not found
      if (source === "unknown") {
        source = determineSourceFromParent(ppid);
      }

      processes.push({
        pid,
        name: serverName,
        command: fullCommand.split(" ")[0],
        fullCommand,
        ramUsageMB: ramMB,
        ramPercentage: parseFloat(memPercent),
        cpuPercentage: parseFloat(cpuPercent),
        source,
        configPath,
        startTime: formatStartTime(startTime),
      });
    }
  } catch {
    // ps command failed or no processes found
  }

  return processes;
}

// Check if a process looks like an MCP server
function isMCPServerProcess(command: string, configs: MCPConfig[]): boolean {
  const lowerCmd = command.toLowerCase();

  // Direct MCP indicators
  if (lowerCmd.includes("mcp") || lowerCmd.includes("model-context-protocol")) {
    return true;
  }

  // Check if command matches any configured server
  for (const config of configs) {
    for (const serverConfig of Object.values(config.servers)) {
      if (command.includes(serverConfig.command)) {
        // Check args too if present
        if (serverConfig.args?.some((arg) => command.includes(arg))) {
          return true;
        }
      }
    }
  }

  // Common MCP server patterns
  const mcpPatterns = [
    /mcp[-_]?server/i,
    /@modelcontextprotocol/i,
    /stdio.*server/i,
    /server\.js.*stdio/i,
    /server\.py.*stdio/i,
    /uvx.*mcp/i,
    /npx.*mcp/i,
    /-mcp$/i,
    /mcp-/i,
  ];

  return mcpPatterns.some((pattern) => pattern.test(command));
}

// Extract server name from command
function extractServerName(command: string): string {
  // Try to find MCP package name
  const mcpMatch = command.match(/(@[\w-]+\/)?[\w-]*mcp[\w-]*/i);
  if (mcpMatch) {
    return mcpMatch[0];
  }

  // Try to find server name from file path
  const pathMatch = command.match(/\/([^/]+)\.(js|ts|py)(\s|$)/);
  if (pathMatch) {
    return pathMatch[1].replace(/[-_]?server[-_]?/i, "").replace(/-/g, " ") || pathMatch[1];
  }

  // Try to get from npx/uvx package
  const pkgMatch = command.match(/(npx|uvx)\s+(@?[\w-]+\/[\w-]+|[\w-]+)/);
  if (pkgMatch) {
    return pkgMatch[2];
  }

  return "MCP Server";
}

// Try to determine source from parent process
function determineSourceFromParent(ppid: number): MCPProcess["source"] {
  try {
    const parentCmd = execSync(`ps -p ${ppid} -o command=`, { encoding: "utf-8" })
      .trim()
      .toLowerCase();

    if (parentCmd.includes("claude") && parentCmd.includes("desktop")) {
      return "claude-desktop";
    }
    if (parentCmd.includes("code") || parentCmd.includes("vscode")) {
      return "vscode";
    }
    if (parentCmd.includes("cursor")) {
      return "cursor";
    }
    if (parentCmd.includes("claude-code") || parentCmd.includes("claude_code")) {
      return "claude-code";
    }
  } catch {
    // Parent process lookup failed
  }

  return "unknown";
}

// Format start time to be more readable
function formatStartTime(startTime: string): string {
  try {
    const date = new Date(startTime);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}d ${diffHours % 24}h ago`;
    }
    if (diffHours > 0) {
      return `${diffHours}h ${diffMins % 60}m ago`;
    }
    if (diffMins > 0) {
      return `${diffMins}m ago`;
    }
    return "Just started";
  } catch {
    return startTime;
  }
}

// Kill a process by PID
export function killProcess(pid: number, force = false): boolean {
  try {
    const signal = force ? "-9" : "-15";
    execSync(`kill ${signal} ${pid}`, { encoding: "utf-8" });
    return true;
  } catch {
    return false;
  }
}

// Get source display name
export function getSourceDisplayName(source: MCPProcess["source"]): string {
  switch (source) {
    case "claude-desktop":
      return "Claude Desktop";
    case "vscode":
      return "VS Code";
    case "cursor":
      return "Cursor";
    case "claude-code":
      return "Claude Code";
    default:
      return "Unknown";
  }
}

// Get source icon
export function getSourceIcon(source: MCPProcess["source"]): string {
  switch (source) {
    case "claude-desktop":
      return "claude-icon.png";
    case "vscode":
      return "vscode-icon.png";
    case "cursor":
      return "cursor-icon.png";
    case "claude-code":
      return "claude-code-icon.png";
    default:
      return "mcp-icon.png";
  }
}

// Format RAM usage
export function formatRAMUsage(ramMB: number): string {
  if (ramMB >= 1024) {
    return `${(ramMB / 1024).toFixed(1)} GB`;
  }
  return `${ramMB} MB`;
}
