import * as vscode from "vscode";
import { TabTracker } from "./tabTracker";

export class TabDecorator {
  private stage1!: vscode.TextEditorDecorationType;
  private stage2!: vscode.TextEditorDecorationType;
  private stage3!: vscode.TextEditorDecorationType;

  private tracker: TabTracker;
  private disposables: vscode.Disposable[] = [];

  constructor(context: vscode.ExtensionContext, tracker: TabTracker) {
    this.tracker = tracker;
    this.createDecorationTypes();
    context.subscriptions.push(this);
  }

  private createDecorationTypes(): void {
    // Dispose previous if any
    this.dispose();

    // Stage 1 - Faded
    this.stage1 = vscode.window.createTextEditorDecorationType({
      color: new vscode.ThemeColor("tabRot.stage1Color"),
      backgroundColor: new vscode.ThemeColor("tabRot.stage1Background"),
      isWholeLine: true,
      overviewRulerColor: new vscode.ThemeColor("tabRot.stage1Overview"),
      overviewRulerLane: vscode.OverviewRulerLane.Right,
    });

    // Stage 2 - Grainy
    this.stage2 = vscode.window.createTextEditorDecorationType({
      color: new vscode.ThemeColor("tabRot.stage2Color"),
      backgroundColor: new vscode.ThemeColor("tabRot.stage2Background"),
      borderColor: new vscode.ThemeColor("tabRot.stage2Border"),
      border: "1px dashed",
      borderRadius: "2px",
      isWholeLine: true,
      overviewRulerColor: new vscode.ThemeColor("tabRot.stage2Overview"),
      overviewRulerLane: vscode.OverviewRulerLane.Right,
    });

    // Stage 3 - Cracked
    this.stage3 = vscode.window.createTextEditorDecorationType({
      color: new vscode.ThemeColor("tabRot.stage3Color"),
      backgroundColor: new vscode.ThemeColor("tabRot.stage3Background"),
      borderColor: new vscode.ThemeColor("tabRot.stage3Border"),
      border: "1px solid",
      borderRadius: "2px",
      textDecoration: "line-through wavy rgba(130, 65, 35, 0.7)",
      isWholeLine: true,
      overviewRulerColor: new vscode.ThemeColor("tabRot.stage3Overview"),
      overviewRulerLane: vscode.OverviewRulerLane.Right,
    });

    this.disposables = [this.stage1, this.stage2, this.stage3];
  }

  private clearDecorations(editor: vscode.TextEditor): void {
    editor.setDecorations(this.stage1, []);
    editor.setDecorations(this.stage2, []);
    editor.setDecorations(this.stage3, []);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getEditorRange(editor: vscode.TextEditor): vscode.Range {
    const lineCount = editor.document.lineCount;
    if (lineCount === 0) {
      return new vscode.Range(0, 0, 0, 0);
    }
    const lastLine = lineCount - 1;
    const lastChar = editor.document.lineAt(lastLine).text.length;
    return new vscode.Range(0, 0, lastLine, lastChar);
  }

  async flashRestore(editor: vscode.TextEditor): Promise<void> {
    if (!vscode.window.visibleTextEditors.includes(editor)) return;

    const flash1 = vscode.window.createTextEditorDecorationType({
      backgroundColor: new vscode.ThemeColor("tabRot.restoreFlash1"),
      isWholeLine: true,
    });
    const flash2 = vscode.window.createTextEditorDecorationType({
      backgroundColor: new vscode.ThemeColor("tabRot.restoreFlash2"),
      isWholeLine: true,
    });

    const fullRange = this.getEditorRange(editor);

    editor.setDecorations(flash1, [fullRange]);
    await this.delay(250);
    editor.setDecorations(flash1, []);

    if (vscode.window.visibleTextEditors.includes(editor)) {
      editor.setDecorations(flash2, [fullRange]);
      await this.delay(250);
      editor.setDecorations(flash2, []);
    }

    flash1.dispose();
    flash2.dispose();

    this.updateDecorations();
  }

  updateDecorations(): void {
    const config = vscode.workspace.getConfiguration("tabRot");
    if (!config.get<boolean>("enableDecorations", true)) {
      for (const editor of vscode.window.visibleTextEditors) {
        this.clearDecorations(editor);
      }
      return;
    }

    for (const editor of vscode.window.visibleTextEditors) {
      const uri = editor.document.uri.toString();
      const stage = this.tracker.getDecayStage(uri);

      this.clearDecorations(editor);

      if (stage === 0) continue;

      const fullRange = this.getEditorRange(editor);

      if (stage === 1) {
        editor.setDecorations(this.stage1, [fullRange]);
      } else if (stage === 2) {
        editor.setDecorations(this.stage2, [fullRange]);
      } else if (stage === 3) {
        editor.setDecorations(this.stage3, [fullRange]);
      }
    }
  }

  clearEditor(editor: vscode.TextEditor): void {
    this.clearDecorations(editor);
  }

  dispose(): void {
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];
  }
}

export class TabFileDecorationProvider implements vscode.FileDecorationProvider {
  private _onDidChangeFileDecorations = new vscode.EventEmitter<vscode.Uri | vscode.Uri[] | undefined>();
  readonly onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;

  constructor(private tracker: TabTracker) {}

  refresh(): void {
    this._onDidChangeFileDecorations.fire(undefined);
  }

  provideFileDecoration(uri: vscode.Uri): vscode.ProviderResult<vscode.FileDecoration> {
    const config = vscode.workspace.getConfiguration("tabRot");
    if (!config.get<boolean>("enableDecorations", true)) {
      return undefined;
    }

    const stage = this.tracker.getDecayStage(uri);
    if (stage === 0) return undefined;

    switch (stage) {
      case 1:
        return {
          badge: "🍂",
          tooltip: "Tab Rot: Stage 1 (Faded)",
          color: new vscode.ThemeColor("tabRot.stage1Overview"),
          propagate: false,
        };
      case 2:
        return {
          badge: "🍁",
          tooltip: "Tab Rot: Stage 2 (Grainy)",
          color: new vscode.ThemeColor("tabRot.stage2Overview"),
          propagate: false,
        };
      case 3:
        return {
          badge: "💀",
          tooltip: "Tab Rot: Stage 3 (Cracked)",
          color: new vscode.ThemeColor("tabRot.stage3Overview"),
          propagate: false,
        };
      default:
        return undefined;
    }
  }
}
