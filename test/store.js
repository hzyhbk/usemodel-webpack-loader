export function useModel(modelName) {
  return [{}, {}];
}
export function useModelState(modelName) {
  return [{}, {}];
}
const store = {
  useModel,
  useModelState,
  useSelector() {},
  dispatch: {},
};

export default store;
