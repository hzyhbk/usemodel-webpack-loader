import { useModelState } from './store';

const { a = false, b: { c: { d } } = { c: {} } } = useModelState('main');
