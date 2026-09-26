import * as vscode from "vscode";
import { TabTracker, TabState } from "./tabTracker";

export class DecayItem extends vscode.TreeItem {
  constructor(
    public readonly tab: TabState,
    iconUri: vscode.Uri
  ) {
    const uri = tab && tab.uri ? vscode.Uri.parse(tab.uri) : vscode.Uri.file("");
    const filename = uri.path ? (uri.path.split("/").pop() || uri.path) : "Unknown";

    const stageLabels = ["Fresh", "Faded", "Grainy", "Cracked"];
    const stageEmojis = ["🌿", "🍂", "🍁", "💀"];
    super(filename, vscode.TreeItemCollapsibleState.None);

    this.iconPath = iconUri;
    this.resourceUri = uri;

    if (!tab) return;

    this.description = `${stageEmojis[tab.decayStage] || ""} ${
      stageLabels[tab.decayStage] || ""
    }`;
    this.tooltip = `Last visited: ${formatTimeAgo(tab.lastVisited)}\n${uri.fsPath}`;
    this.command = {
      command: "tabRot.openDecayedTab",
      title: "Open Decayed Tab",
      arguments: [uri],
    };
    this.contextValue = `decayStage${tab.decayStage}`;
  }
}

function formatTimeAgo(timestamp: number): string {
  const minutes = Math.floor((Date.now() - timestamp) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h ago`;
}

export class DecayTreeProvider implements vscode.TreeDataProvider<DecayItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<
    DecayItem | undefined | void
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(
    private tracker: TabTracker,
    private context: vscode.ExtensionContext
  ) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
    this.updateContextKey();
  }

  private updateContextKey(): void {
    const hasDecayed = this.tracker.getDecayTabs().length > 0;
    vscode.commands.executeCommand(
      "setContext",
      "tabRot.hasDecayed",
      hasDecayed
    );
  }

  getTreeItem(element: DecayItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: DecayItem): DecayItem[] {
    if (element) {
      return [];
    }
    const decayed = this.tracker.getDecayTabs();
    if (!decayed) return [];
    return decayed
      .filter((tab): tab is TabState => tab !== undefined && tab !== null && typeof tab.uri === "string")
      .map((tab) => {
        const iconName = this.getIconName(tab.decayStage);
        const iconPath = vscode.Uri.joinPath(
          this.context.extensionUri,
          "resources",
          "icons",
          iconName
        );
        return new DecayItem(tab, iconPath);
      });
  }

  private getIconName(stage: number): string {
    switch (stage) {
      case 1:
        return "faded.svg";
      case 2:
        return "grainy.svg";
      case 3:
        return "cracked.svg";
      default:
        return "fresh.svg";
    }
  }
}

// Alias for backwards compatibility
export { DecayTreeProvider as DecayThreeProvider };
