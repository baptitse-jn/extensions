/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Mem API Key - Your Mem API key. Get it from Mem Settings > Flows > API */
  "apiKey": string,
  /** Default Instructions - Default instructions for Mem AI when processing your notes (e.g., 'Tag with #inbox and summarize') */
  "defaultInstructions": string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `quick-capture` command */
  export type QuickCapture = ExtensionPreferences & {}
  /** Preferences accessible in the `capture-clipboard` command */
  export type CaptureClipboard = ExtensionPreferences & {}
  /** Preferences accessible in the `capture-selection` command */
  export type CaptureSelection = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `quick-capture` command */
  export type QuickCapture = {}
  /** Arguments passed to the `capture-clipboard` command */
  export type CaptureClipboard = {}
  /** Arguments passed to the `capture-selection` command */
  export type CaptureSelection = {}
}
