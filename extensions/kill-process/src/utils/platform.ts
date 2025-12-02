import { Image } from "@raycast/api";
import { Process } from "../types";

/**
 * Platform detection utilities
 */
export const platform = process.platform;
export const isMac = platform === "darwin";
export const isWindows = platform === "win32";

/**
 * Get platform-specific process list command
 */
export function getProcessListCommand(): string {
  if (isWindows) {
    // Windows: Use PowerShell CIM + Perf counters to get accurate CPU% and memory (KB)
    // We output a single line per process using a '|' delimiter to avoid issues with spaces in names/paths
    // Fields: Id|ParentPid|CPU%|MemKB|Path|ProcessName
    return (
      `powershell -NoProfile "` +
      `$ErrorActionPreference='SilentlyContinue'; ` +
      // Get basic process info (includes ParentProcessId and ExecutablePath)
      `$procs = Get-CimInstance Win32_Process | Select-Object ProcessId, ParentProcessId, Name, ExecutablePath, WorkingSetSize; ` +
      // Get formatted perf data that already includes CPU percent per process
      `$perf = Get-CimInstance Win32_PerfFormattedData_PerfProc_Process | Select-Object IDProcess, PercentProcessorTime; ` +
      // Build a map from PID to CPU%
      `$map = @{}; foreach ($p in $perf) { $map[$p.IDProcess] = $p.PercentProcessorTime } ` +
      // Emit one line per process using a safe delimiter
      `foreach ($p in $procs) { ` +
      `  $cpu = $map[$p.ProcessId]; ` +
      `  if ($null -eq $cpu) { $cpu = 0 } ` +
      `  $memKB = [int]([double]$p.WorkingSetSize / 1KB); ` +
      `  $path = if ($p.ExecutablePath) { $p.ExecutablePath } else { '' }; ` +
      // Replace backslashes to keep consistency with POSIX-style parsing and icons downstream
      `  $path = $path -replace '\\\\','/'; ` +
         `  "$($p.ProcessId)|$($p.ParentProcessId)|$cpu|$memKB|$path|$($p.Name)" ` +
      `}"`
    );
  } else {
    // macOS: Use ps command
    return "ps -eo pid,ppid,pcpu,rss,comm";
  }
}

/**
 * Get platform-specific kill command
 */
export function getKillCommand(pid: number, force: boolean = false): string {
  if (isWindows) {
    return force ? `taskkill /F /PID ${pid}` : `taskkill /PID ${pid}`;
  } else {
    // macOS
    return force ? `sudo kill -9 ${pid}` : `kill -9 ${pid}`;
  }
}

/**
 * Parse process information based on platform
 */
export function parseProcessLine(line: string): Partial<Process> | null {
  if (!line.trim()) return null;

  if (isWindows) {
    // Windows PowerShell output format (custom): Id|ParentPid|CPU%|MemKB|Path|ProcessName
    const parts = line.split("|");
    if (parts.length < 6) return null;

    const [id, ppid, cpu, memKB, path, ...nameParts] = parts;
    const processName = nameParts.join("|").trim();

    return {
      id: parseInt(id) || 0,
      pid: parseInt(ppid) || 0,
      // Already a CPU percentage from Perf counters (can exceed 100 on multi-core)
      cpu: parseFloat(cpu) || 0,
      // Memory is emitted in KB to match macOS rss semantics used elsewhere
      mem: parseInt(memKB) || 0,
      path: path?.trim() || "",
      processName: processName || "",
    };
  } else {
    // macOS: ps output format
    const defaultValue = ["", "", "", "", "", ""];
    const regex = /(\d+)\s+(\d+)\s+(\d+[.|,]\d+)\s+(\d+)\s+(.*)/;
    const [, id, pid, cpu, mem, path] = line.match(regex) ?? defaultValue;

    if (!id) return null;

    const processName = path.match(/[^/]*[^/]*$/i)?.[0] ?? "";

    return {
      id: parseInt(id),
      pid: parseInt(pid),
      cpu: parseFloat(cpu),
      mem: parseInt(mem),
      path: path,
      processName: processName,
    };
  }
}

/**
 * Detect process type based on platform
 */
export function getProcessType(path: string): Process["type"] {
  if (isMac) {
    // macOS-specific detection
    const isPrefPane = path.includes(".prefPane");
    const isApp = path.includes(".app/");
    return isPrefPane ? "prefPane" : isApp ? "app" : "binary";
  } else if (isWindows) {
    // Windows-specific detection
    const isApp =
      path.toLowerCase().endsWith(".exe") &&
      (path.toLowerCase().includes("program files") || path.toLowerCase().includes("applications"));
    return isApp ? "app" : "binary";
  } else {
    // Fallback for unsupported platforms
    return "binary";
  }
}

/**
 * Extract application name based on platform
 */
export function getAppName(path: string, processName: string): string | undefined {
  if (isMac) {
    // macOS: Extract from .app bundle path
    return path.match(/(?<=\/)[^/]+(?=\.app\/)/)?.[0];
  } else if (isWindows) {
    // Windows: Use process name without .exe extension
    return processName.replace(/\.exe$/i, "");
  } else {
    // Fallback for unsupported platforms
    return processName;
  }
}

/**
 * Get platform-specific file icon
 */
export function getFileIcon(process: Process): Image.ImageLike {
  if (isMac) {
    // macOS-specific icon handling
    if (process.type === "prefPane") {
      return {
        fileIcon: process.path?.replace(/(.+\.prefPane)(.+)/, "$1") ?? "",
      };
    }

    if (process.type === "app" || process.type === "aggregatedApp") {
      return { fileIcon: process.path?.replace(/(.+\.app)(.+)/, "$1") ?? "" };
    }

    return "/System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/ExecutableBinaryIcon.icns";
  } else if (isWindows) {
    // Windows-specific icon handling
    if (process.type === "app") {
      return { fileIcon: process.path };
    }
    return "🖥️"; // Generic computer icon for Windows binaries
  } else {
    // Fallback for unsupported platforms
    return "⚙️"; // Generic gear icon
  }
}

/**
 * Get platform-specific error messages and help
 */
export function getPlatformSpecificErrorHelp(isForceKill: boolean): {
  title: string;
  message?: string;
  helpUrl?: string;
} {
  if (isMac && isForceKill) {
    return {
      title: "Failed to Force Kill Process",
      message: "Please ensure that touch ID/password prompt is enabled for sudo",
      helpUrl: "https://dev.to/siddhantkcode/enable-touch-id-authentication-for-sudo-on-macos-sonoma-14x-4d28",
    };
  } else if (isWindows && isForceKill) {
    return {
      title: "Failed to Force Kill Process",
      message: "Administrative privileges may be required. Try running as administrator.",
    };
  } else {
    return {
      title: "Failed to Kill Process",
      message: "The process could not be terminated. It may have already exited or require elevated privileges.",
    };
  }
}
