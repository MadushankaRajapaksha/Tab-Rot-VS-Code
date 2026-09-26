import * as vscode from "vscode";

export interface TabState {
  uri: string;
  lastVisited: number;
  decayStage: 0 | 1 | 2 | 3;
  isOpen?: boolean;
}

interface DatabaseSchema {
  thresholds: {
    stage1: number;
    stage2: number;
    stage3: number;
  };
  tabs: Record<string, TabState>;
}

type PersistedState = Record<string, TabState>;

export class TabTracker {
  private tabs: Map<string, TabState>;
  private context: vscode.ExtensionContext;
  private thresholds: [number, number, number];
  private config: vscode.WorkspaceConfiguration;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.tabs = new Map();
    this.config = vscode.workspace.getConfiguration("tabRot");
    this.thresholds = this.loadThresholds();

    this.loadState();

    // Listen for configuration changes
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("tabRot")) {
        this.config = vscode.workspace.getConfiguration("tabRot");
        this.thresholds = this.loadThresholds();
        this.updateAllDecayStages();
      }
    });
  }

  private loadThresholds(): [number, number, number] {
    const config = vscode.workspace.getConfiguration("tabRot");
    const arrayThresholds = config.get<number[]>("decayThresholds");
    if (arrayThresholds && Array.isArray(arrayThresholds) && arrayThresholds.length >= 3) {
      return this.parseThresholds(arrayThresholds);
    }
    const db = this.context.globalState.get<{
      s1: number;
      s2: number;
      s3: number;
    }>("tabRot.thresholdsDB");
    if (db) {
      return this.parseThresholds([db.s1, db.s2, db.s3]);
    }

    const s1 = config.get<number>("stage1Threshold", 60);
    const s2 = config.get<number>("stage2Threshold", 1440);
    const s3 = config.get<number>("stage3Threshold", 10080);
    return this.parseThresholds([s1, s2, s3]);
  }

  private normalizeUri(uri: string | vscode.Uri): string {
    return typeof uri === "string" ? uri : uri.toString();
  }

  private parseThresholds(raw: number[]): [number, number, number] {
    const clean = raw.map((v) => Math.max(1, Math.floor(v)));
    const s1 = clean[0] ?? 60;
    const s2 = Math.max(s1, clean[1] ?? 1440);
    const s3 = Math.max(s2, clean[2] ?? s2 * 2);
    return [s1, s2, s3];
  }

  hasTab(uri: string | vscode.Uri): boolean {
    const key = this.normalizeUri(uri);
    return this.tabs.has(key);
  }

  registerTab(uri: string | vscode.Uri): void {
    this.touchTab(uri, true);
  }

  touchTab(uri: string | vscode.Uri, updateTimestamp: boolean = true): void {
    const key = this.normalizeUri(uri);
    const existing = this.tabs.get(key);
    const now = Date.now();
    this.tabs.set(key, {
      uri: key,
      lastVisited: existing && updateTimestamp === false ? existing.lastVisited : now,
      decayStage: existing && updateTimestamp === false ? existing.decayStage : 0,
      isOpen: true,
    });
    this.saveState();
  }

  removeTab(uri: string | vscode.Uri): void {
    const key = this.normalizeUri(uri);
    if (this.tabs.delete(key)) {
      this.saveState();
    }
  }

  private computeStage(ageMinutes: number): 0 | 1 | 2 | 3 {
    if (ageMinutes < this.thresholds[0]) return 0;
    if (ageMinutes < this.thresholds[1]) return 1;
    if (ageMinutes < this.thresholds[2]) return 2;
    return 3;
  }

  getDecayStage(uri: string | vscode.Uri): 0 | 1 | 2 | 3 {
    const key = this.normalizeUri(uri);
    const tab = this.tabs.get(key);
    if (!tab) return 0;

    const ageMinutes = (Date.now() - tab.lastVisited) / 60000;
    tab.decayStage = this.computeStage(ageMinutes);
    return tab.decayStage;
  }

  calculateDecayStage(uri: string | vscode.Uri): 0 | 1 | 2 | 3 {
    return this.getDecayStage(uri);
  }

  updateAllStages(): void {
    const now = Date.now();
    for (const tab of this.tabs.values()) {
      const ageMinutes = (now - tab.lastVisited) / 60000;
      tab.decayStage = this.computeStage(ageMinutes);
    }
  }

  updateAllDecayStages(): void {
    this.updateAllStages();
  }

  getDecayTabs(): TabState[] {
    const decayed: TabState[] = [];
    const now = Date.now();
    for (const tab of this.tabs.values()) {
      if (tab.decayStage > 0) {
        decayed.push({ ...tab });
      }
    }
    return decayed;
  }
 
  getAllDecayedTabs(): TabState[] {
    return this.getDecayTabs();
  }

  getDecayedTabsCount(): number {
    return this.getDecayTabs().length;
  }

  restoreTab(uri: string | vscode.Uri): void {
    const key = typeof uri === "string" ? uri : uri.toString();
    const existing = this.tabs.get(key);
    if (existing) {
      existing.lastVisited = Date.now();
      existing.decayStage = 0;
      this.saveState();
    }
  }

  restoreAllTabs(): void {
    const now = Date.now();
    for (const tab of this.tabs.values()) {
      tab.lastVisited = now;
      tab.decayStage = 0;
    }
    this.saveState();
  }

  getTab(uri: string | vscode.Uri): TabState | undefined {
    const tab = this.tabs.get(this.normalizeUri(uri));
    return tab ? { ...tab } : undefined;
  }

  getTabState(uri: string | vscode.Uri): TabState | undefined {
    return this.getTab(uri);
  }

  getAllTabs(): TabState[] {
    return Array.from(this.tabs.values()).map((t) => ({ ...t }));
  }

  saveState(): void {
    const persisted: PersistedState = {};
    for (const [key, tab] of this.tabs) {
      persisted[key] = tab;
    }
    this.context.workspaceState.update("tabRot.state", persisted);
  }

  private loadState(): void {
    const persisted = this.context.workspaceState.get<PersistedState>(
      "tabRot.state",
      {}
    );
    this.tabs = new Map();

    for (const [key, tab] of Object.entries(persisted)) {
      if (
        tab &&
        typeof tab.uri === "string" &&
        typeof tab.lastVisited === "number"
      ) {
        const clamped = Math.max(
          0,
          Math.min(3, Math.floor(tab.decayStage || 0))
        ) as 0 | 1 | 2 | 3;
        this.tabs.set(key, {
          uri: tab.uri,
          lastVisited: tab.lastVisited,
          decayStage: clamped,
          isOpen: tab.isOpen ?? true,
        });
      }
    }
  }
}
