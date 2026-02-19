# Daily Notes Month Archiver

Automatically archives past daily notes into month-year folders (e.g., `MM-YY`).

This plugin helps keep your daily notes folder clean by moving notes from previous days into organized subfolders.

## Features

- **Automatic Archiving**: Moves past daily notes into subfolders named like `02-26` (February 2026).
- **Auto-Run**: Optionally archives your notes once per day when Obsidian starts.
- **Smart Overwrite**: If a note already exists in the destination folder, it will be overwritten by the newer version during archiving.
- **Customizable**:
    - **Daily notes folder**: Define where your daily notes are kept.
    - **Date format**: Support for custom date formats in filenames (e.g., `YYYY-MM-DD`, `DD-MM-YY`).
    - **Minimum age (days)**: Only archive files older than a specific number of days (default is 1).

## How to use

1. Install the plugin.
2. Go to **Settings → Daily Notes Month Archiver**.
3. Set your **Daily notes folder** (e.g., `Agenda`).
4. Set the **Date format** to match your files (e.g., `DD-MM-YY`).
5. Set the **Minimum age (days)** (e.g., `1` to archive everything except today, or `30` to keep the last month's notes in the main folder).
6. (Optional) Enable **Run automatically on startup**.
7. You can also trigger the archiving manually via the command palette: **Archive past daily notes into month folders**.

## Installation

### From Community Plugins (Soon)
1. Search for "Daily Notes Month Archiver" in Obsidian's community plugin browser.
2. Install and enable.

### Manual Installation
1. Download `main.js`, `manifest.json` from the [latest release](https://github.com/robsonswe/daily-notes-month-archiver/releases).
2. Create a folder named `daily-notes-month-archiver` in your vault's `.obsidian/plugins/` directory.
3. Copy the files into that folder.
4. Reload Obsidian and enable the plugin in **Settings → Community plugins**.

## Development

- `npm i` to install dependencies.
- `npm run dev` to start compilation in watch mode.
- `npm run build` to create a production build.

## Funding

If you find this plugin useful, you can support its development through my [GitHub Sponsor](https://github.com/sponsors/robsonswe) page.

## License

This project is licensed under the [0-BSD License](LICENSE).
