import { useModel } from './store';
const [
  {
    a = false,
    b: { c = [], d },
    e,
    f: g,
  },
] = useModel('main');
