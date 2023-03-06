import { useModel } from './store';
const [
  {
    a = false,
    b: { c = [] },
  },
  disp,
] = useModel('main');
