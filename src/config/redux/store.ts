import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';

type EmptyRootState = Record<string, never>;

// Redux is mounted before the Zustand slices move, so the root reducer starts as a stable no-op.
const rootReducer = (state: EmptyRootState = {}) => state;

const Store = configureStore({
  reducer: rootReducer,
});

type RootState = ReturnType<typeof Store.getState>;
type AppDispatch = typeof Store.dispatch;

// Define Typed Hooks
const useAppDispatch = useDispatch.withTypes<AppDispatch>();
const useAppSelector = useSelector.withTypes<RootState>();

export { Store, useAppDispatch, useAppSelector };
export type { AppDispatch, RootState };
