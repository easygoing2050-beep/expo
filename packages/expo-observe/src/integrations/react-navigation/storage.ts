export interface ScreenTimes {
  dispatchTime?: number;
  lastInteractiveCall?: number;
}

export interface PendingAction {
  actionType: string;
  dispatchTime: number;
}

export interface ReactNavigationIntegrationStorage {
  pendingActions: PendingAction[];
  renderedScreensIds: Set<string>;
  hasRecordedInitialTtr: boolean;
  screenTimes: Record<string, ScreenTimes>;
  interactiveScreensIds: Set<string>;
}

export function createReactNavigationIntegrationStorage(): ReactNavigationIntegrationStorage {
  return {
    pendingActions: [],
    renderedScreensIds: new Set(),
    hasRecordedInitialTtr: false,
    screenTimes: {},
    interactiveScreensIds: new Set(),
  };
}
