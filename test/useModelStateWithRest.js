import { useModelState } from './store';
const { a = false, ...d } = useModelState('main');
