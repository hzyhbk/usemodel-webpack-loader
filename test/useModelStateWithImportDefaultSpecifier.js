import store, { useModelState } from './store';
const {
  a = false,
  b: { c = [] },
} = useModelState('main');
