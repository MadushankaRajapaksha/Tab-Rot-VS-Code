class MockMemento {
  private store = new Map<string, any>();

  get<T>(key: string, defaultValue?: T): T | undefined {
    return this.store.has(key) ? this.store.get(key) : defaultValue;
  }

  async update(key: string, value: any): Promise<void> {
    if (value === undefined) {
      this.store.delete(key);
    } else {
      this.store.set(key, value);
    }
  }

  key(): readonly string[] {
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

export const workspace = {
  getConfiguration: (section?: string) => ({
    get: <T>(key: string, defaultValue?: T): T => {
      const fullKey = section ? `${section}.${key}` : key;
      return (mockConfig as any)[key] ?? defaultValue;
    },
    has: (key: string) => key in mockConfig,
    inspect: () => undefined,
    update: async (key: string, value: any) => {
      (mockConfig as any)[key] = value;
    },
  }),
  textDocuments: [],
  onDidChangeConfiguration: (listener: any) => ({
    dispose: () => {}
  }),
};

export const Uri = {
  parse: (str: string) => ({
    toString: () => str,
    fsPath: str,
    scheme: "file",
  }),
  file: (path: string) => ({
    toString: () => `file://${path}`,
    fsPath: path,
    scheme: "file",
  }),
};

export function createMockContext():any{
    return {
      workspaceState,
      globalState: new MockMemento(),
      subscriptions: [],
      extensionPath: "/mock/extension",
      storagePath: "/mock/storage",
      asAbsolutePath: (p: string) => `/mock/extension/${p}`,
    };
}


export function setMockConfig(overrides: Partial<typeof mockConfig>) {
    mockConfig = { ...mockConfig, ...overrides };

}

export function resetMockConfig(){
    mockConfig = {
        stage1Threshold:60,
        stage2Threshold:1440,
        stage3Threshold:10080,
        enableDecorations:true,
        enableStatusBar:true
    };
}


export function resetWorkspaceState() {
  workspaceState._reset();
}


export enum OverviewRulerLane {
  Left = 1,
  Center = 2,
  Right = 4,
  Full = 7,
}