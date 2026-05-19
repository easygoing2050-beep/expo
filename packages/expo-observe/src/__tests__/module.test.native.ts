/* eslint-disable @typescript-eslint/no-require-imports */
const mockNative = {
  configure: jest.fn(),
  setBundleDefaults: jest.fn(),
  dispatchEvents: jest.fn(() => Promise.resolve()),
};

jest.mock('expo', () => ({
  requireNativeModule: jest.fn(() => mockNative),
}));

jest.mock('../integrations/expo-router/router', () => ({
  isRouterInstalled: true,
  optionalRouter: undefined,
}));

jest.mock('../integrations/expo-router/init', () => ({
  initRouterIntegration: jest.fn(),
  isInitialized: jest.fn(() => false),
  initListeners: jest.fn(() => () => {}),
}));

jest.mock('../integrations/react-navigation/reactNavigation', () => ({
  isReactNavigationInstalled: true,
  optionalReactNavigation: undefined,
}));

jest.mock('../integrations/react-navigation/init', () => ({
  initReactNavigationIntegration: jest.fn(),
  isInitialized: jest.fn(() => false),
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
  jest.doMock('expo', () => ({ requireNativeModule: jest.fn(() => mockNative) }));
  jest.doMock('../integrations/expo-router/router', () => ({
    isRouterInstalled: true,
    optionalRouter: undefined,
  }));
  jest.doMock('../integrations/expo-router/init', () => ({
    initRouterIntegration: jest.fn(),
    isInitialized: jest.fn(() => false),
    initListeners: jest.fn(() => () => {}),
  }));
  jest.doMock('../integrations/react-navigation/reactNavigation', () => ({
    isReactNavigationInstalled: true,
    optionalReactNavigation: undefined,
  }));
  jest.doMock('../integrations/react-navigation/init', () => ({
    initReactNavigationIntegration: jest.fn(),
    isInitialized: jest.fn(() => false),
  }));
});

function loadModule() {
  return require('../module').default as typeof import('../module').default;
}

function loadInit() {
  return require('../integrations/expo-router/init') as typeof import('../integrations/expo-router/init');
}

function loadReactNavigationInit() {
  return require('../integrations/react-navigation/init') as typeof import('../integrations/react-navigation/init');
}

describe('module Proxy', () => {
  it.each([true, false, undefined])(
    "forwards a integrations object to native when 'expo-router' is %s",
    (router) => {
      const ExpoObserve = loadModule();
      ExpoObserve.configure({
        environment: 'test',
        integrations: { 'expo-router': router },
      });
      expect(mockNative.configure).toHaveBeenCalledWith({
        environment: 'test',
        integrations: { 'expo-router': router },
      });
    }
  );

  it("calls initRouterIntegration when router is installed and integrations['expo-router'] is true", () => {
    const ExpoObserve = loadModule();
    const { initRouterIntegration } = loadInit();
    ExpoObserve.configure({
      environment: 'test',
      integrations: { 'expo-router': true },
    });
    expect(initRouterIntegration).toHaveBeenCalledTimes(1);
  });

  it('skips initRouterIntegration by default', () => {
    const ExpoObserve = loadModule();
    const { initRouterIntegration } = loadInit();
    ExpoObserve.configure({ environment: 'test' });
    expect(initRouterIntegration).not.toHaveBeenCalled();
    expect(mockNative.configure).toHaveBeenCalledWith({
      environment: 'test',
    });
  });

  it('skips initRouterIntegration when router is not installed, but passes the integrations object unchanged', () => {
    jest.doMock('../integrations/expo-router/router', () => ({
      isRouterInstalled: false,
      optionalRouter: undefined,
    }));
    jest.doMock('../integrations/react-navigation/reactNavigation', () => ({
      isReactNavigationInstalled: false,
      optionalReactNavigation: undefined,
    }));
    const ExpoObserve = loadModule();
    const { initRouterIntegration } = loadInit();
    ExpoObserve.configure({ integrations: { 'expo-router': true } });
    expect(initRouterIntegration).not.toHaveBeenCalled();
    expect(mockNative.configure).toHaveBeenCalledWith({
      integrations: { 'expo-router': true },
    });
  });

  it("calls initReactNavigationIntegration when integrations['react-navigation'] is true and react-navigation is installed", () => {
    const ExpoObserve = loadModule();
    const { initReactNavigationIntegration } = loadReactNavigationInit();
    ExpoObserve.configure({
      environment: 'test',
      integrations: { 'react-navigation': true },
    });
    expect(initReactNavigationIntegration).toHaveBeenCalledTimes(1);
  });

  it("initializes react-navigation even when expo-router is installed, as long as 'react-navigation' is the only flag set", () => {
    const ExpoObserve = loadModule();
    const { initRouterIntegration } = loadInit();
    const { initReactNavigationIntegration } = loadReactNavigationInit();
    ExpoObserve.configure({
      environment: 'test',
      integrations: { 'react-navigation': true },
    });
    expect(initRouterIntegration).not.toHaveBeenCalled();
    expect(initReactNavigationIntegration).toHaveBeenCalledTimes(1);
  });

  it('does NOT call initReactNavigationIntegration when both flags are true', () => {
    const ExpoObserve = loadModule();
    const { initRouterIntegration } = loadInit();
    const { initReactNavigationIntegration } = loadReactNavigationInit();
    ExpoObserve.configure({
      environment: 'test',
      integrations: { 'expo-router': true, 'react-navigation': true },
    });
    expect(initRouterIntegration).toHaveBeenCalledTimes(1);
    expect(initReactNavigationIntegration).not.toHaveBeenCalled();
  });

  it('skips initReactNavigationIntegration when react-navigation is not installed', () => {
    jest.doMock('../integrations/react-navigation/reactNavigation', () => ({
      isReactNavigationInstalled: false,
      optionalReactNavigation: undefined,
    }));
    const ExpoObserve = loadModule();
    const { initReactNavigationIntegration } = loadReactNavigationInit();
    ExpoObserve.configure({
      environment: 'test',
      integrations: { 'react-navigation': true },
    });
    expect(initReactNavigationIntegration).not.toHaveBeenCalled();
  });

  it('skips both integrations by default', () => {
    const ExpoObserve = loadModule();
    const { initRouterIntegration } = loadInit();
    const { initReactNavigationIntegration } = loadReactNavigationInit();
    ExpoObserve.configure({ environment: 'test' });
    expect(initRouterIntegration).not.toHaveBeenCalled();
    expect(initReactNavigationIntegration).not.toHaveBeenCalled();
  });

  it('passes through dispatchEvents and setBundleDefaults to native', () => {
    const ExpoObserve = loadModule();
    ExpoObserve.dispatchEvents();
    ExpoObserve.setBundleDefaults({ environment: 'production', isJsDev: false });
    expect(mockNative.dispatchEvents).toHaveBeenCalledTimes(1);
    expect(mockNative.setBundleDefaults).toHaveBeenCalledWith({
      environment: 'production',
      isJsDev: false,
    });
  });

  it('returns the native function via Reflect.get for unknown props', () => {
    const ExpoObserve = loadModule();
    expect((ExpoObserve as { dispatchEvents: unknown }).dispatchEvents).toBe(
      mockNative.dispatchEvents
    );
  });
});
