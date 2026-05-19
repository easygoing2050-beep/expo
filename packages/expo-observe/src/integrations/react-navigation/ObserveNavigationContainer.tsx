import {
  NavigationContainer,
  type NavigationContainerRef,
  type NavigationState,
  useNavigationContainerRef,
  getPathFromState,
} from '@react-navigation/native';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type Ref,
} from 'react';

import { attachActionListener } from './actionListener';
import { ObserveReactNavigationIntegrationContext } from './context';
import { createStateChangeHandler } from './handleStateChange';
import { isInitialized } from './init';
import { createReactNavigationIntegrationStorage } from './storage';
import type { GetPathname, NavigationStateLike } from './types';

type NavigationContainerProps = ComponentProps<typeof NavigationContainer>;

export type ObserveNavigationContainerProps = NavigationContainerProps;

function ObserveNavigationContainerImpl(
  props: ObserveNavigationContainerProps,
  forwardedRef: Ref<NavigationContainerRef<ReactNavigation.RootParamList>>
) {
  const { children, onStateChange, linking, ...rest } = props;
  const navigationRef = useNavigationContainerRef();

  useImperativeHandle(
    forwardedRef,
    () => navigationRef as unknown as NavigationContainerRef<ReactNavigation.RootParamList>,
    [navigationRef]
  );

  const [internal] = useState(() => {
    if (!isInitialized()) return null;
    const storage = createReactNavigationIntegrationStorage();
    const getPathname: GetPathname = linking?.config
      ? (state) => {
          if (!state) return undefined;
          return getPathFromState(
            state as unknown as NavigationState,
            linking.config as Parameters<typeof getPathFromState>[1]
          );
        }
      : (_state) => undefined;
    return {
      storage,
      getPathname,
      handleStateChange: createStateChangeHandler(storage, getPathname, performance.now()),
    };
  });

  const prevInitialized = useRef(isInitialized());
  if (prevInitialized.current !== isInitialized()) {
    throw new Error(
      `[expo-observe] React Navigation integration was ${isInitialized() ? 'enabled' : 'disabled'} after application mounted. Call ExpoObserve.configure() before rendering ObserveNavigationContainer.`
    );
  }

  useEffect(() => {
    if (!internal) return;
    return attachActionListener(navigationRef, internal.storage);
  }, [internal, navigationRef]);

  const onStateChangeMerged: NavigationContainerProps['onStateChange'] = (state) => {
    internal?.handleStateChange(state as unknown as NavigationStateLike | undefined);
    onStateChange?.(state);
  };

  const contextValue = useMemo(
    () => (internal ? { storage: internal.storage, getPathname: internal.getPathname } : null),
    [internal]
  );

  return (
    <NavigationContainer
      {...rest}
      linking={linking}
      ref={navigationRef as unknown as NavigationContainerProps['ref']}
      onStateChange={onStateChangeMerged}>
      <ObserveReactNavigationIntegrationContext.Provider value={contextValue}>
        {children}
      </ObserveReactNavigationIntegrationContext.Provider>
    </NavigationContainer>
  );
}

export const ObserveNavigationContainer = forwardRef(ObserveNavigationContainerImpl);
