/**
 * @jest-environment node
 */
import compiler from './compiler.js';

test('useModel', async () => {
  const stats = await compiler('useModel.js', {});
  const output = stats.toJson({ source: true }).modules[0].source;
  expect(output).toBe(`import __btripStore__, { useModel } from './store';
const {
  a = false,
  e,
  f: g,
  c = [],
  d
} = __btripStore__.useSelector(({
  main: main
}) => ({
  a: main?.a,
  e: main?.e,
  f: main?.f,
  c: main?.b?.c,
  d: main?.b?.d
}));`);
});

test('useModelWithDisp', async () => {
  const stats = await compiler('useModelWithDisp.js', {});
  const output = stats.toJson({ source: true }).modules[0].source;
  expect(output).toBe(`import __btripStore__, { useModel } from './store';
const [{
  a = false,
  c = []
}, disp] = [__btripStore__.useSelector(({
  main: main
}) => ({
  a: main?.a,
  c: main?.b?.c
})), __btripStore__.dispatch.main];`);
});

test('useModelWithImportDefaultSpecifier', async () => {
  const stats = await compiler('useModelWithImportDefaultSpecifier.js', {});
  const output = stats.toJson({ source: true }).modules[0].source;
  expect(output).toBe(`import store, { useModel } from './store';
const [{
  a = false,
  c = []
}, disp] = [store.useSelector(({
  main: main
}) => ({
  a: main?.a,
  c: main?.b?.c
})), store.dispatch.main];`);
});

test('useModelState', async () => {
  const stats = await compiler('useModelState.js', {});
  const output = stats.toJson({ source: true }).modules[0].source;
  expect(output).toBe(`import __btripStore__, { useModelState } from './store';
const {
  a = false,
  c = [],
  f
} = __btripStore__.useSelector(({
  main: main
}) => ({
  a: main?.a,
  c: main?.b?.c,
  f: main?.d?.e?.f
}));`);
});

test('useModelStateWithRest', async () => {
  const stats = await compiler('useModelStateWithRest.js', {});
  const output = stats.toJson({ source: true }).modules[0].source;
  expect(output).toBe(`import { useModelState } from './store';
const { a = false, ...d } = useModelState('main');
`);
});

test('useModelStateWithObjRest', async () => {
  const stats = await compiler('useModelStateWithObjRest.js', {});
  const output = stats.toJson({ source: true }).modules[0].source;
  expect(output).toBe(`import { useModelState } from './store';
const { a = false, b: { c, ...d } = {} } = useModelState('main');
`);
});

test('useModelStateWithDefaultObjValue', async () => {
  const stats = await compiler('useModelStateWithDefaultObjValue.js', {});
  const output = stats.toJson({ source: true }).modules[0].source;
  expect(output).toBe(`import __btripStore__, { useModelState } from './store';
const {
  a = false,
  b: {
    c: {
      d
    }
  } = {
    c: {}
  }
} = __btripStore__.useSelector(({
  main: main
}) => ({
  a: main?.a,
  b: main?.b
}));`);
});

test('useModelStateWithImportDefaultSpecifier', async () => {
  const stats = await compiler(
    'useModelStateWithImportDefaultSpecifier.js',
    {}
  );
  const output = stats.toJson({ source: true }).modules[0].source;
  expect(output).toBe(`import store, { useModelState } from './store';
const {
  a = false,
  c = []
} = store.useSelector(({
  main: main
}) => ({
  a: main?.a,
  c: main?.b?.c
}));`);
});
