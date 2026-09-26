"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OverviewRulerLane = exports.Uri = exports.workspace = void 0;
exports.createMockContext = createMockContext;
exports.setMockConfig = setMockConfig;
exports.resetMockConfig = resetMockConfig;
exports.resetWorkspaceState = resetWorkspaceState;
class MockMemento {
    store = new Map();
    get(key, defaultValue) {
        return this.store.has(key) ? this.store.get(key) : defaultValue;
    }
    async update(key, value) {
        if (value === undefined) {
            this.store.delete(key);
        }
        else {
            this.store.set(key, value);
        }
    }
    key() {
        return Array.from(this.store.keys());
    }
    _reset() {
        this.store.clear();
    }
}
let mockConfig = {
    stage1Threshold: 60, // minutes
    stage2Threshold: 1440,
    stage3Threshold: 10080,
    enableDecorations: true,
    enableStatusBar: true,
};
const workspaceState = new MockMemento();
exports.workspace = {
    getConfiguration: (section) => ({
        get: (key, defaultValue) => {
            const fullKey = section ? `${section}.${key}` : key;
            return mockConfig[key] ?? defaultValue;
        },
        has: (key) => key in mockConfig,
        inspect: () => undefined,
        update: async (key, value) => {
            mockConfig[key] = value;
        },
    }),
    textDocuments: [],
    onDidChangeConfiguration: (listener) => ({
        dispose: () => { }
    }),
};
exports.Uri = {
    parse: (str) => ({
        toString: () => str,
        fsPath: str,
        scheme: "file",
    }),
    file: (path) => ({
        toString: () => `file://${path}`,
        fsPath: path,
        scheme: "file",
    }),
};
function createMockContext() {
    return {
        workspaceState,
        globalState: new MockMemento(),
        subscriptions: [],
        extensionPath: "/mock/extension",
        storagePath: "/mock/storage",
        asAbsolutePath: (p) => `/mock/extension/${p}`,
    };
}
function setMockConfig(overrides) {
    mockConfig = { ...mockConfig, ...overrides };
}
function resetMockConfig() {
    mockConfig = {
        stage1Threshold: 60,
        stage2Threshold: 1440,
        stage3Threshold: 10080,
        enableDecorations: true,
        enableStatusBar: true
    };
}
function resetWorkspaceState() {
    workspaceState._reset();
}
var OverviewRulerLane;
(function (OverviewRulerLane) {
    OverviewRulerLane[OverviewRulerLane["Left"] = 1] = "Left";
    OverviewRulerLane[OverviewRulerLane["Center"] = 2] = "Center";
    OverviewRulerLane[OverviewRulerLane["Right"] = 4] = "Right";
    OverviewRulerLane[OverviewRulerLane["Full"] = 7] = "Full";
})(OverviewRulerLane || (exports.OverviewRulerLane = OverviewRulerLane = {}));
//# sourceMappingURL=vscode.js.map