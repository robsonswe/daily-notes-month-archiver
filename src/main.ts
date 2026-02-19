import {
	App,
	Plugin,
	PluginSettingTab,
	Setting,
	TFile,
	TFolder,
	moment,
	Notice,
} from "obsidian";

interface ArchiverSettings {
	dailyNotesFolder: string;
	dateFormat: string;
	autoRunOnStartup: boolean;
	lastRunDate: string | null;
}

const DEFAULT_SETTINGS: ArchiverSettings = {
	dailyNotesFolder: "Agenda",
	dateFormat: "DD-MM-YY",
	autoRunOnStartup: true,
	lastRunDate: null,
};

export default class DailyArchiverPlugin extends Plugin {
	settings: ArchiverSettings;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: "archive-daily-notes",
			name: "Archive past daily notes into month folders",
			callback: () => this.archiveNotes(true),
		});

		this.addSettingTab(new ArchiverSettingTab(this.app, this));

		if (this.settings.autoRunOnStartup) {
			this.app.workspace.onLayoutReady(() => {
				this.runIfNeeded();
			});
		}
	}

	private async runIfNeeded() {
		const today = moment().format("YYYY-MM-DD");

		if (this.settings.lastRunDate === today) return;

		await this.archiveNotes(false);

		this.settings.lastRunDate = today;
		await this.saveSettings();
	}

	async archiveNotes(showNotice: boolean) {
		const folder = this.app.vault.getAbstractFileByPath(
			this.settings.dailyNotesFolder,
		);

		if (!(folder instanceof TFolder)) {
			if (showNotice) new Notice("Daily notes folder not found.");
			return;
		}

		const today = moment().startOf("day");

		// Only top-level markdown files
		const files = folder.children.filter(
			(f) => f instanceof TFile && f.parent?.path === folder.path,
		) as TFile[];

		const monthFolders = new Set<string>();

		for (const file of files) {
			if (!file.name.endsWith(".md")) continue;

			const parsed = moment(
				file.basename,
				this.settings.dateFormat,
				true,
			);
			if (!parsed.isValid()) continue;

			if (parsed.isBefore(today)) {
				monthFolders.add(parsed.format("MM-YY"));
			}
		}

		// Create month folders if needed
		for (const monthYear of monthFolders) {
			const path = `${this.settings.dailyNotesFolder}/${monthYear}`;
			if (!this.app.vault.getAbstractFileByPath(path)) {
				await this.app.vault.createFolder(path);
			}
		}

		// Move files
		for (const file of files) {
			if (!file.name.endsWith(".md")) continue;

			const parsed = moment(
				file.basename,
				this.settings.dateFormat,
				true,
			);
			if (!parsed.isValid()) continue;

			if (parsed.isBefore(today)) {
				const monthYear = parsed.format("MM-YY");
				const newPath = `${this.settings.dailyNotesFolder}/${monthYear}/${file.name}`;

				await this.app.fileManager.renameFile(file, newPath);
			}
		}

		if (showNotice) {
			new Notice("Daily notes archived successfully.");
		}
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData(),
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class ArchiverSettingTab extends PluginSettingTab {
	plugin: DailyArchiverPlugin;

	constructor(app: App, plugin: DailyArchiverPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Daily notes folder")
			.setDesc("Folder where daily notes are stored")
			.addText((text) =>
				text
					.setPlaceholder("Agenda")
					.setValue(this.plugin.settings.dailyNotesFolder)
					.onChange(async (value) => {
						this.plugin.settings.dailyNotesFolder = value.trim();
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Date format")
			.setDesc("Format used in daily note filenames")
			.addText((text) =>
				text
					.setPlaceholder("DD-MM-YY")
					.setValue(this.plugin.settings.dateFormat)
					.onChange(async (value) => {
						this.plugin.settings.dateFormat = value.trim();
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Run automatically on startup")
			.setDesc(
				"Archives past daily notes once per day when Obsidian starts.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.autoRunOnStartup)
					.onChange(async (value) => {
						this.plugin.settings.autoRunOnStartup = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
