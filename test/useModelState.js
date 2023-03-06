import { useModelState } from './store';
const {
  a = false,
  b: { c = [] },
  d: {
    e: { f },
  },
} = useModelState('main');
