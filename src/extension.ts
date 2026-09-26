import * as vscode from "vscode";
import { TabTracker } from "./tabTracker";
import { TabDecorator, TabFileDecorationProvider } from "./tabDecorator";
import { RotStatusBar } from "./statusBar";
import { DecayTreeProvider } from "./decayView";
import { TabRotSettingsPanel } from "./settingsPanel";
 


let tracker: TabTracker;
let decorator: TabDecorator;
let fileDecorationProvider: TabFileDecorationProvider;
let statusBar: RotStatusBar;
let treeProvider: DecayTreeProvider;
let treeView: vscode.TreeView<any>;
let updateInterval: ReturnType<typeof setInterval>;

const activate = (context: vscode.ExtensionContext) => {
  console.log("Tab Rot is now active!");
  console.log("[TabRot] Extension activating...");

  tracker = new TabTracker(context);
  decorator = new TabDecorator(context, tracker);
  fileDecorationProvider = new TabFileDecorationProvider(tracker);
  statusBar = new RotStatusBar(tracker);
  treeProvider = new DecayTreeProvider(tracker, context);

  // Register TreeDataProvider & TreeView
  treeView = vscode.window.createTreeView("tabRot.decayedTabs", {
    treeDataProvider: treeProvider,
  });
  context.subscriptions.push(treeView);

  // Register FileDecorationProvider for editor tabs & explorer
  const fileDecDisposable = vscode.window.registerFileDecorationProvider(
    fileDecorationProvider
  );
  context.subscriptions.push(fileDecDisposable);

  // Track initial open documents without overwriting saved timestamps
  const openDocs = vscode.workspace.textDocuments;
  console.log(`[TabRot] Found ${openDocs.length} open documents on activation`);

  for (const doc of openDocs) {
    if (!doc.isUntitled && doc.uri.scheme === "file") {
      tracker.registerTab(doc.uri);
      console.log(`[TabRot] Registered tab: ${doc.uri.toString()}`);
    }
  }

  // Initial update
  tracker.updateAllStages();
  decorator.updateDecorations();
  statusBar.update();
  treeProvider.refresh();
  fileDecorationProvider.refresh();

  // Active editor change: restore decayed tab with animation or touch
  const activateEditorDisposable = vscode.window.onDidChangeActiveTextEditor(
    async (editor) => {
      if (editor && !editor.document.isUntitled && editor.document.uri.scheme === "file") {
        const uri = editor.document.uri.toString();
        const stage = tracker.getDecayStage(uri);

        if (stage > 0) {
          // Play restore animation and restore tab
          await decorator.flashRestore(editor);
          tracker.restoreTab(uri);
          vscode.window.showInformationMessage("✨ Tab restored!");
        } else {
          tracker.touchTab(uri);
        }

        decorator.updateDecorations();
        statusBar.update();
        treeProvider.refresh();
        fileDecorationProvider.refresh();
      }
    }
  );
  context.subscriptions.push(activateEditorDisposable);

  // Visible editors change
  const visibleEditorsDisposable = vscode.window.onDidChangeVisibleTextEditors(
    () => {
      decorator.updateDecorations();
    }
  );
  context.subscriptions.push(visibleEditorsDisposable);

  // Typing in editor keeps it fresh
  const changeDocDisposable = vscode.workspace.onDidChangeTextDocument((e) => {
    if (!e.document.isUntitled && e.document.uri.scheme === "file") {
      tracker.touchTab(e.document.uri);
    }
  });
  context.subscriptions.push(changeDocDisposable);

  // Opening new document
  const openDocDisposable = vscode.workspace.onDidOpenTextDocument((doc) => {
    if (!doc.isUntitled && doc.uri.scheme === "file") {
      tracker.registerTab(doc.uri);
      statusBar.update();
      treeProvider.refresh();
      fileDecorationProvider.refresh();
    }
  });
  context.subscriptions.push(openDocDisposable);

  // Document closed
  const closeEditorDisposable = vscode.workspace.onDidCloseTextDocument(
    (doc) => {
      if (!doc.isUntitled && doc.uri.scheme === "file") {
        const uri = doc.uri.toString();
        tracker.removeTab(uri);
        console.log(`[TabRot] Removed tab: ${uri}`);
        decorator.updateDecorations();
        statusBar.update();
        treeProvider.refresh();
        fileDecorationProvider.refresh();
      }
    }
  );
  context.subscriptions.push(closeEditorDisposable);

  // Periodic stage recalculation (every 15 seconds for responsiveness)
  updateInterval = setInterval(() => {
    const beforeStages = new Map<string, number>();
    for (const tab of tracker.getAllTabs()) {
      beforeStages.set(tab.uri, tab.decayStage);
    }

    tracker.updateAllStages();
    decorator.updateDecorations();
    statusBar.update();
    treeProvider.refresh();
    fileDecorationProvider.refresh();

    const config = vscode.workspace.getConfiguration("tabRot");
    if (config.get<boolean>("showNotification", false)) {
      for (const tab of tracker.getAllTabs()) {
        const oldStage = beforeStages.get(tab.uri) || 0;
        if (tab.decayStage > oldStage) {
          const mins = Math.round((Date.now() - tab.lastVisited) / 60000);
          const relPath = vscode.workspace.asRelativePath(tab.uri);
          vscode.window.showInformationMessage(
            `📉 ${relPath} reached stage ${tab.decayStage} (unvisited for ${mins} minutes)`
          );
        }
      }
    }
  }, 15000);

  context.subscriptions.push({
    dispose: () => {
      clearInterval(updateInterval);
    },
  } as vscode.Disposable);

  // Commands

  //cmd:  settings open comand 

  const openSettingsCmd = vscode.commands.registerCommand(
    "tabRot.showSettings",
    () => {
      TabRotSettingsPanel.createOrShow(context.extensionPath, context);
    }
  );
  context.subscriptions.push(openSettingsCmd);

  // cmd: restore active tab
  const restoreTabCmd = vscode.commands.registerCommand(
    "tabRot.restoreTab",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }

      const uri = editor.document.uri.toString();
      await decorator.flashRestore(editor);
      tracker.restoreTab(uri);
      decorator.updateDecorations();
      statusBar.update();
      treeProvider.refresh();
      fileDecorationProvider.refresh();
      vscode.window.showInformationMessage("✨ Tab restored!");
      console.log(`[TabRot] Restored tab: ${uri}`);
    }
  );
  context.subscriptions.push(restoreTabCmd);

  // cmd: restore all tabs
  const restoreAllTabsCmd = vscode.commands.registerCommand(
    "tabRot.restoreAllTabs",
    async () => {
      for (const editor of vscode.window.visibleTextEditors) {
        await decorator.flashRestore(editor);
      }
      tracker.restoreAllTabs();
      decorator.updateDecorations();
      statusBar.update();
      treeProvider.refresh();
      fileDecorationProvider.refresh();
      vscode.window.showInformationMessage("✨ All tabs restored!");
      console.log("[TabRot] Restored all tabs");
    }
  );
  context.subscriptions.push(restoreAllTabsCmd);

  // cmd: show decayed tabs sidebar
  const showDecayedCmd = vscode.commands.registerCommand(
    "tabRot.showDecayedTabs",
    () => {
      vscode.commands.executeCommand("tabRot.decayedTabs.focus");
      console.log("[TabRot] Show decayed tabs sidebar");
    }
  );
  context.subscriptions.push(showDecayedCmd);

  // open decayed tab from sidebar
  const openDecayedCmd = vscode.commands.registerCommand(
    "tabRot.openDecayedTab",
    async (uri: vscode.Uri | string) => {
      const targetUri = typeof uri === "string" ? vscode.Uri.parse(uri) : uri;
      const doc = await vscode.workspace.openTextDocument(targetUri);
      await vscode.window.showTextDocument(doc);
    }
  );
  context.subscriptions.push(openDecayedCmd);

  // status bar click handler
  const focusSidebarCommand = vscode.commands.registerCommand(
    "tabRot.focusSidebar",
    () => {
      vscode.commands.executeCommand("tabRot.showDecayedTabs");
    }
  );
  context.subscriptions.push(focusSidebarCommand);

  console.log("[TabRot] Extension activated successfully");
};

const deactivate = () => {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
  if (decorator) {
    decorator.dispose();
  }
  if (statusBar) {
    statusBar.dispose();
  }
  console.log("[TabRot] Extension deactivated successfully");
};

export { activate, deactivate };
