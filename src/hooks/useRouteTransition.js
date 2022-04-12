import { useContext } from 'react';
import { TransitionContext } from '@/app';

export function useRouteTransition() {
  return useContext(TransitionContext);
}
