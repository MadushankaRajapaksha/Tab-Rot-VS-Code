import * as vscode from "vscode";
import { TabTracker } from "./tabTracker";

export class RotStatusBar {
  private item: vscode.StatusBarItem;
  private tracker: TabTracker;

  constructor(tracker: TabTracker) {
    this.tracker = tracker;
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.item.command = "tabRot.showDecayedTabs";
    this.item.tooltip = "Tab Rot: Click to view decayed tabs";
  }

  update(): void {
    const config = vscode.workspace.getConfiguration("tabRot");
    if (!config.get<boolean>("enableStatusBar", true)) {
      this.item.hide();
      return;
    }

    const decayed = this.tracker.getDecayTabs();
    const count = decayed.length;

    if (count > 0) {
      this.item.text = `$(flame) ${count} rotting tab${count > 1 ? "s" : ""}`;
      this.item.tooltip = `${count} rotting tab${count > 1 ? "s" : ""} — Click to show in sidebar`;
      this.item.show();
    } else {
      this.item.text = `$(sparkle) Tabs Fresh`;
      this.item.tooltip = "All tabs are fresh — Tab Rot is active";
      this.item.show();
    }
  }

  dispose(): void {
    this.item.dispose();
  }
}