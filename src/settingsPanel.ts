import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export class TabRotSettingsPanel {
  public static currentPanel: TabRotSettingsPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private disposable: vscode.Disposable[] = [];
  private context: vscode.ExtensionContext;

  private constructor(panel: vscode.WebviewPanel, extensionPath: string, context: vscode.ExtensionContext) {
    this.panel = panel;
    this.context = context;
    this.panel.onDidDispose(() => this.dispose(), null, this.disposable);
    this.panel.webview.onDidReceiveMessage(
      (msg) => this.handleMessage(msg),
      null,
      this.disposable
    );
    this.render(extensionPath);
  }
  static createOrShow(extensionPath: string, context: vscode.ExtensionContext): void {
    const colum = vscode.ViewColumn.One;
    if (TabRotSettingsPanel.currentPanel) {
      TabRotSettingsPanel.currentPanel.panel.reveal(colum);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "tabRotSettings",
      "Tab Rot Settings",
      colum,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(extensionPath, "resources")),
        ],
      }
    );

    TabRotSettingsPanel.currentPanel = new TabRotSettingsPanel(
      panel,
      extensionPath,
      context
    );
  }

  private handleMessage(msg: any): void {
    if (msg.command === "save") {
      const db = this.context.globalState.get<any>("tabRot.database") || {
        thresholds: { stage1: 60, stage2: 1440, stage3: 10080 },
        tabs: {},
      };
      db.thresholds = {
        stage1: msg.stage1Threshold,
        stage2: msg.stage2Threshold,
        stage3: msg.stage3Threshold,
      };
      this.context.globalState.update("tabRot.database", db);

      // Also update workspace config for backwards compatibility
      const config = vscode.workspace.getConfiguration("tabRot");
      config.update("stage1Threshold", msg.stage1Threshold, true);
      config.update("stage2Threshold", msg.stage2Threshold, true);
      config.update("stage3Threshold", msg.stage3Threshold, true);

      vscode.window.showInformationMessage("✅ Settings saved to database!");
    }
  }
  private render(extensionPath: string): void {
    const htmlPath = path.join(extensionPath, "resources", "settings.html");
    let html = fs.readFileSync(htmlPath, "utf-8");

    const db = this.context.globalState.get<any>("tabRot.database");
    const thresholds = db?.thresholds || { stage1: 60, stage2: 1440, stage3: 10080 };
    const config = vscode.workspace.getConfiguration("tabRot");

    const values = {
      stage1: thresholds.stage1 || config.get<number>("stage1Threshold", 60),
      stage2: thresholds.stage2 || config.get<number>("stage2Threshold", 1440),
      stage3: thresholds.stage3 || config.get<number>("stage3Threshold", 1440),
      enableDecorations: config.get<boolean>("enableDecorations", true),
      enableStatusBar: config.get<boolean>("enableStatusBar", true),
      showNotifications: config.get<boolean>("showNotifications", false),
    };

    this.panel.webview.html = html;

    setTimeout(() => {
      this.panel.webview.postMessage({ command: "init", ...values });
    }, 50);
  }
  dispose() {
    TabRotSettingsPanel.currentPanel = undefined;
    this.panel.dispose();
    for (const d of this.disposable) {
      d.dispose();
    }
  }
}
