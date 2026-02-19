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
	minAgeDays: number;
	autoRunOnStartup: boolean;
	lastRunDate: string | null;
}

const DEFAULT_SETTINGS: ArchiverSettings = {
	dailyNotesFolder: "Agenda",
	dateFormat: "DD-MM-YY",
	minAgeDays: 1,
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
			this.app.workspace.onLayoutReady(async () => {
				await this.runIfNeeded();
			});
		}
	}

	private async runIfNeeded() {
		const today = moment().format("YYYY-MM-DD");

		if (this.settings.lastRunDate === today) {
			return;
		}

		try {
			const movedCount = await this.archiveNotes(false);
			
			if (movedCount > 0) {
				new Notice(`Auto-archived ${movedCount} daily notes.`);
			}

			this.settings.lastRunDate = today;
			await this.saveSettings();
		} catch (error) {
			console.error("Daily Notes Month Archiver: Auto-run failed", error);
		}
	}

	async archiveNotes(showNotice: boolean): Promise<number> {
		const folder = this.app.vault.getAbstractFileByPath(
			this.settings.dailyNotesFolder,
		);

		if (!(folder instanceof TFolder)) {
			if (showNotice) new Notice("Daily notes folder not found.");
			return 0;
		}

		const thresholdDate = moment()
			.startOf("day")
			.subtract(this.settings.minAgeDays - 1, "days");

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

			if (parsed.isBefore(thresholdDate)) {
				monthFolders.add(parsed.format("MM-YY"));
			}
		}

		for (const monthYear of monthFolders) {
			const path = `${this.settings.dailyNotesFolder}/${monthYear}`;
			if (!this.app.vault.getAbstractFileByPath(path)) {
				await this.app.vault.createFolder(path);
			}
		}

		let movedCount = 0;
		// Move files
		for (const file of files) {
			if (!file.name.endsWith(".md")) continue;

			const parsed = moment(
				file.basename,
				this.settings.dateFormat,
				true,
			);
			if (!parsed.isValid()) continue;

			if (parsed.isBefore(thresholdDate)) {
				const monthYear = parsed.format("MM-YY");
				const newPath = `${this.settings.dailyNotesFolder}/${monthYear}/${file.name}`;

				// Check if file already exists in destination
				const existingFile = this.app.vault.getAbstractFileByPath(newPath);
				if (existingFile instanceof TFile) {
					await this.app.vault.delete(existingFile);
				}

				await this.app.fileManager.renameFile(file, newPath);
				movedCount++;
			}
		}

		if (showNotice) {
			if (movedCount > 0) {
				new Notice(`Successfully archived ${movedCount} daily notes.`);
			} else {
				new Notice("No daily notes to archive.");
			}
		}

		return movedCount;
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<ArchiverSettings>,
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
					.setPlaceholder("Enter date format")
					.setValue(this.plugin.settings.dateFormat)
					.onChange(async (value) => {
						this.plugin.settings.dateFormat = value.trim();
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Minimum age (days)")
			.setDesc("Only archive files older than this many days (1 = everything except today)")
			.addText((text) =>
				text
					.setPlaceholder("1")
					.setValue(this.plugin.settings.minAgeDays.toString())
					.onChange(async (value) => {
						const num = parseInt(value);
						if (!isNaN(num) && num >= 1) {
							this.plugin.settings.minAgeDays = num;
							await this.plugin.saveSettings();
						}
					}),
			);

		new Setting(containerEl)
			.setName("Automatic run on startup")
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
