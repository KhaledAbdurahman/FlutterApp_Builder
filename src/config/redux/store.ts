import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { builderReducer } from '@/stores/builder/builder-slice';

const Store = configureStore({
  reducer: {
    builder: builderReducer,
  },
});

type RootState = ReturnType<typeof Store.getState>;
type AppDispatch = typeof Store.dispatch;

// Define Typed Hooks
const useAppDispatch = useDispatch.withTypes<AppDispatch>();
const useAppSelector = useSelector.withTypes<RootState>();

export { Store, useAppDispatch, useAppSelector };
export type { AppDispatch, RootState };
