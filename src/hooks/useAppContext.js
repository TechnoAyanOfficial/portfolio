import { useContext } from 'react';
import { AppContext } from '@/app';

export function useAppContext() {
  return useContext(AppContext);
}
