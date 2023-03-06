import { useModelState } from './store';
const { a = false, b: { c, ...d } = {} } = useModelState('main');
