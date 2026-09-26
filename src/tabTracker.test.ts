import { TabTracker } from './tabTracker';
import {
  createMockContext,
  setMockConfig,
  resetMockConfig,
  resetWorkspaceState,
  Uri
} from '../tests/mocks/vscode';

// ---------- Test helpers ----------

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function uri(path: string) {
  return Uri.file(path) as any;
}

function advanceTime(ms: number) {
  jest.advanceTimersByTime(ms);
}

// ---------- Setup / Teardown ----------

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-09-24T12:00:00Z'));
  resetMockConfig();
  resetWorkspaceState();
});

afterEach(() => {
  jest.useRealTimers();
});

// ============================================================
//  TESTS
// ============================================================

describe('TabTracker', () => {
  describe('initialization', () => {
    it('starts with no tracked tabs', () => {
      const ctx = createMockContext();
      const tracker = new TabTracker(ctx);

      expect(tracker.getDecayedTabsCount()).toBe(0);
      expect(tracker.getAllDecayedTabs()).toEqual([]);
    });

    it('loads thresholds from configuration', () => {
      setMockConfig({ stage1Threshold: 5, stage2Threshold: 10, stage3Threshold: 15 });
      const ctx = createMockContext();
      const tracker = new TabTracker(ctx);

      // After 6 minutes → should be stage 1
      advanceTime(6 * MINUTE);
      tracker.touchTab(uri('/a.ts'), false);
      advanceTime(6 * MINUTE);

      expect(tracker.calculateDecayStage(uri('/a.ts'))).toBe(1);
    });
  });

  describe('touchTab', () => {
    it('creates a new entry with stage 0 on first touch', () => {
      const ctx = createMockContext();
      const tracker = new TabTracker(ctx);

      tracker.touchTab(uri('/a.ts'));

      const state = tracker.getTabState(uri('/a.ts'));
      expect(state).toBeDefined();
      expect(state!.decayStage).toBe(0);
      expect(state!.lastVisited).toBe(Date.now());
    });

    it('updates timestamp and resets stage when updateTimestamp=true', () => {
      const ctx = createMockContext();
      const tracker = new TabTracker(ctx);

      // Touch once
      tracker.touchTab(uri('/a.ts'));
      advanceTime(2 * HOUR);
      tracker.updateAllDecayStages();
      expect(tracker.calculateDecayStage(uri('/a.ts'))).toBe(1);

      // Touch again with updateTimestamp=true
      tracker.touchTab(uri('/a.ts'), true);

      expect(tracker.calculateDecayStage(uri('/a.ts'))).toBe(0);
      expect(tracker.getTabState(uri('/a.ts'))!.lastVisited).toBe(Date.now());
    });

    it('does NOT update timestamp when updateTimestamp=false', () => {
      const ctx = createMockContext();
      const tracker = new TabTracker(ctx);

      tracker.touchTab(uri('/a.ts'));
      const originalTime = tracker.getTabState(uri('/a.ts'))!.lastVisited;

      advanceTime(1 * HOUR);
      tracker.touchTab(uri('/a.ts'), false);

      expect(tracker.getTabState(uri('/a.ts'))!.lastVisited).toBe(originalTime);
    });
  });

  describe('removeTab', () => {
    it('removes a tracked tab', () => {
      const ctx = createMockContext();
      const tracker = new TabTracker(ctx);

      tracker.touchTab(uri('/a.ts'));
      tracker.touchTab(uri('/b.ts'));
      expect(tracker.getDecayedTabsCount()).toBe(0); // both fresh

      tracker.removeTab(uri('/a.ts'));

      expect(tracker.getTabState(uri('/a.ts'))).toBeUndefined();
      expect(tracker.getTabState(uri('/b.ts'))).toBeDefined();
    });

    it('is a no-op for unknown URIs', () => {
      const ctx = createMockContext();
      const tracker = new TabTracker(ctx);

      expect(() => tracker.removeTab(uri('/unknown.ts'))).not.toThrow();
    });
  });

  describe('calculateDecayStage', () => {
    it('returns 0 for fresh tabs', () => {
      const ctx = createMockContext();
      const tracker = new TabTracker(ctx);

      tracker.touchTab(uri('/a.ts'));

      expect(tracker.calculateDecayStage(uri('/a.ts'))).toBe(0);
    });

    it('returns 1 after stage1Threshold', () => {
      setMockConfig({ stage1Threshold: 60 });
      const ctx = createMockContext();
      const tracker = new TabTracker(ctx);

      tracker.touchTab(uri('/a.ts'));
      advanceTime(61 * MINUTE);

      expect(tracker.calculateDecayStage(uri('/a.ts'))).toBe(1);
    });

    it('returns 2 after stage2Threshold', () => {
      setMockConfig({ stage1Threshold: 60, stage2Threshold: 1440 });
      const ctx = createMockContext();
      const tracker = new TabTracker(ctx);

      tracker.touchTab(uri('/a.ts'));
      advanceTime(1441 * MINUTE); // 1 day + 1 min

      expect(tracker.calculateDecayStage(uri('/a.ts'))).toBe(2);
    });

    it('returns 3 after stage3Threshold', () => {
      setMockConfig({ stage1Threshold: 60, stage2Threshold: 1440, stage3Threshold: 10080 });
      const ctx = createMockContext();
      const tracker = new TabTracker(ctx);

      tracker.touchTab(uri('/a.ts'));
      advanceTime(10081 * MINUTE); // 1 week + 1 min

      expect(tracker.calculateDecayStage(uri('/a.ts'))).toBe(3);
    });

    it('returns 0 for unknown URIs', () => {
      const ctx = createMockContext();
      const tracker = new TabTracker(ctx);

      expect(tracker.calculateDecayStage(uri('/unknown.ts'))).toBe(0);
    });

    it('respects custom thresholds', () => {
      setMockConfig({ stage1Threshold: 5, stage2Threshold: 10, stage3Threshold: 15 });
      const ctx = createMockContext();
      const tracker = new TabTracker(ctx);

      tracker.touchTab(uri('/a.ts'));

      advanceTime(4 * MINUTE);
      expect(tracker.calculateDecayStage(uri('/a.ts'))).toBe(0);

      advanceTime(2 * MINUTE); // 6 min total
      expect(tracker.calculateDecayStage(uri('/a.ts'))).toBe(1);

      advanceTime(5 * MINUTE); // 11 min total
      expect(tracker.calculateDecayStage(uri('/a.ts'))).toBe(2);

      advanceTime(5 * MINUTE); // 16 min total
      expect(tracker.calculateDecayStage(uri('/a.ts'))).toBe(3);
    });
  });

  describe('updateAllDecayStages', () => {
    it('recalculates stages for all tabs', () => {
      const ctx = createMockContext();
      const tracker = new TabTracker(ctx);

      tracker.touchTab(uri('/a.ts'));
      advanceTime(30 * MINUTE);
      tracker.touchTab(uri('/b.ts'));
      advanceTime(30 * MINUTE);
      tracker.touchTab(uri('/c.ts'));

      // Now: a = 60m old, b = 30m old, c = 0m old
      tracker.updateAllDecayStages();

      expect(tracker.calculateDecayStage(uri('/a.ts'))).toBe(1);
      expect(tracker.calculateDecayStage(uri('/b.ts'))).toBe(0);
      expect(tracker.calculateDecayStage(uri('/c.ts'))).toBe(0);
    });
  });

  describe('getDecayedTabsCount', () => {
    it('counts only tabs with stage > 0', () => {
      const ctx = createMockContext();
      const tracker = new TabTracker(ctx);

      tracker.touchTab(uri('/a.ts'));
      tracker.touchTab(uri('/b.ts'));
      tracker.touchTab(uri('/c.ts'));

      advanceTime(2 * HOUR);
      tracker.updateAllDecayStages();

      // All three should now be stage 1+
      expect(tracker.getDecayedTabsCount()).toBe(3);
    });

    it('returns 0 when no tabs are decayed', () => {
      const ctx = createMockContext();
      const tracker = new TabTracker(ctx);

      tracker.touchTab(uri('/a.ts'));
      expect(tracker.getDecayedTabsCount()).toBe(0);
    });
  });

  describe('getAllDecayedTabs', () => {
    it('returns only decayed tabs sorted by stage descending', () => {
      const ctx = createMockContext();
      const tracker = new TabTracker(ctx);

      // Create tabs at different ages
      tracker.touchTab(uri('/d.ts'));              // 7d old → stage 3
      advanceTime(6 * DAY);
      tracker.touchTab(uri('/c.ts'));              // 1d old → stage 2
      advanceTime(22 * HOUR);
      tracker.touchTab(uri('/b.ts'));              // 2h old → stage 1
      advanceTime(2 * HOUR);
      tracker.touchTab(uri('/a.ts'));              // fresh

      tracker.updateAllDecayStages();

      const decayed = tracker.getAllDecayedTabs();

      expect(decayed).toHaveLength(3); // /a.ts is fresh, not included
      expect(decayed[0].uri).toContain('/d.ts'); // stage 3 first
      expect(decayed[1].uri).toContain('/c.ts'); // stage 2
      expect(decayed[2].uri).toContain('/b.ts'); // stage 1
    });

    it('returns empty array when no tabs are decayed', () => {
      const ctx = createMockContext();
      const tracker = new TabTracker(ctx);

      tracker.touchTab(uri('/a.ts'));
      expect(tracker.getAllDecayedTabs()).toEqual([]);
    });
  });

  describe('restoreTab / restoreAllTabs', () => {
    it('restoreTab resets a single tab to stage 0', () => {
      const ctx = createMockContext();
      const tracker = new TabTracker(ctx);

      tracker.touchTab(uri('/a.ts'));
      advanceTime(2 * HOUR);
      tracker.updateAllDecayStages();
      expect(tracker.calculateDecayStage(uri('/a.ts'))).toBe(1);

      tracker.restoreTab(uri('/a.ts'));

      expect(tracker.calculateDecayStage(uri('/a.ts'))).toBe(0);
    });

    it('restoreAllTabs resets every tab', () => {
      const ctx = createMockContext();
      const tracker = new TabTracker(ctx);

      tracker.touchTab(uri('/a.ts'));
      advanceTime(2 * HOUR);
      tracker.touchTab(uri('/b.ts'));
      advanceTime(22 * HOUR);
      tracker.touchTab(uri('/c.ts'));
      advanceTime(6 * DAY);

      tracker.updateAllDecayStages();
      expect(tracker.getDecayedTabsCount()).toBe(3);

      tracker.restoreAllTabs();

      expect(tracker.getDecayedTabsCount()).toBe(0);
      expect(tracker.calculateDecayStage(uri('/a.ts'))).toBe(0);
      expect(tracker.calculateDecayStage(uri('/b.ts'))).toBe(0);
      expect(tracker.calculateDecayStage(uri('/c.ts'))).toBe(0);
    });
  });

  describe('persistence', () => {
    it('state survives a fresh TabTracker instance', () => {
      const ctx = createMockContext();

      // First instance — create some state
      const tracker1 = new TabTracker(ctx);
      tracker1.touchTab(uri('/a.ts'));
      advanceTime(2 * HOUR);
      tracker1.updateAllDecayStages();

      // Second instance — should load the same state
      const tracker2 = new TabTracker(ctx);

      expect(tracker2.getTabState(uri('/a.ts'))).toBeDefined();
      expect(tracker2.calculateDecayStage(uri('/a.ts'))).toBe(1);
    });

    it('removed tabs are not reloaded', () => {
      const ctx = createMockContext();
      const tracker1 = new TabTracker(ctx);

      tracker1.touchTab(uri('/a.ts'));
      tracker1.touchTab(uri('/b.ts'));
      tracker1.removeTab(uri('/a.ts'));

      const tracker2 = new TabTracker(ctx);

      expect(tracker2.getTabState(uri('/a.ts'))).toBeUndefined();
      expect(tracker2.getTabState(uri('/b.ts'))).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('handles boundary exactly at threshold (not past it)', () => {
      setMockConfig({ stage1Threshold: 60 });
      const ctx = createMockContext();
      const tracker = new TabTracker(ctx);

      tracker.touchTab(uri('/a.ts'));
      advanceTime(59 * MINUTE);

      // 59 minutes — should still be stage 0
      expect(tracker.calculateDecayStage(uri('/a.ts'))).toBe(0);

      advanceTime(1 * MINUTE); // exactly 60 min
      // At exactly the threshold, behavior depends on >= vs >.
      // Our code uses >=, so it should be stage 1.
      expect(tracker.calculateDecayStage(uri('/a.ts'))).toBe(1);
    });

    it('handles multiple rapid touches', () => {
      const ctx = createMockContext();
      const tracker = new TabTracker(ctx);

      for (let i = 0; i < 100; i++) {
        tracker.touchTab(uri(`/file${i}.ts`));
      }

      expect(tracker.getDecayedTabsCount()).toBe(0);
    });

    it('handles empty URI string gracefully', () => {
      const ctx = createMockContext();
      const tracker = new TabTracker(ctx);

      expect(() => tracker.touchTab(uri(''))).not.toThrow();
      expect(() => tracker.removeTab(uri(''))).not.toThrow();
    });
  });
});
