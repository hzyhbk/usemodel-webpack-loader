const { parse: babelParse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

// get all the valuePaths from the data object
const getValuePathsAndNodes = data => {
  const valuePaths = [];
  const valueNodes = [];
  const queue = [['', data]];

  while (queue.length > 0) {
    const [parentPath, currData] = queue.shift();
    if (t.isObjectPattern(currData)) {
      currData.properties.forEach(item => {
        if (t.isRestElement(item)) {
          throw new Error(
            `[usemodel-loader: error]: 暂不支持【...】剩余参数的写法。问题代码${
              generate(item).code
            }`
          );
        }
        const path =
          parentPath.length > 0
            ? `${parentPath}.${item.key.name}`
            : item.key.name;

        // 直接取某一属性 const { a, b, c } = {}
        if (t.isIdentifier(item.value)) {
          valueNodes.push(item);
          valuePaths.push(path);
          // 取某一属性并且设置默认值 const { a: { b } = {} } = {}
        } else if (t.isAssignmentPattern(item.value)) {
          if (t.isIdentifier(item.value.left)) {
            valueNodes.push(item);
            valuePaths.push(path);
          } else {
            // 取某一属性并且设置默认值，且默认值为空对象，就继续往下一层遍历
            if (
              t.isObjectExpression(item.value.right) &&
              item.value.right.properties.length === 0
            ) {
              queue.push([path, item.value.left]);
            } else {
              // 如果默认值为非空对象，则停止遍历
              console.log(
                `[usemodel-loader: warning]: 暂不支持默认值为非空对象的写法。问题代码：${
                  generate(item).code
                }`
              );
              valueNodes.push(item);
              valuePaths.push(path);
            }
          }
        } else {
          queue.push([path, item.value]);
        }
      });
    }
  }
  return { valuePaths, valueNodes };
};

// a.b.c  => memberExpression or optionalMemberExpression Node
const convertStringToMemberExpression = (str, optional = true) => {
  const identifiers = str.split('.');

  let expression = t.identifier(identifiers[0]);

  for (let i = 1; i < identifiers.length; i++) {
    expression = optional
      ? t.optionalMemberExpression(
          expression,
          t.identifier(identifiers[i]),
          false,
          true
        )
      : t.memberExpression(
          expression,
          t.identifier(identifiers[i]),
          false,
          true
        );
  }

  return expression;
};

/**
 *
 * ({ main: main }) => ({ a: main.a, b: main.b, c: main.c })
 * @param {*} modelName
 * @param {*} properties
 * @returns
 */
function getSelectorFn(modelName, properties) {
  const ast = t.arrowFunctionExpression(
    [
      t.objectPattern([
        t.objectProperty(t.identifier(modelName), t.identifier(modelName)),
      ]),
    ],
    t.objectExpression(
      properties.map(item => {
        const valuePaths = item.split('.');
        const valuePathsLen = valuePaths.length;
        const lastPath = valuePaths[valuePathsLen - 1];

        return t.objectProperty(
          t.identifier(lastPath),
          convertStringToMemberExpression(`${modelName}.${item}`)
        );
      })
    )
  );
  return ast;
}

function getNode(code) {
  return babelParse(code, {
    sourceType: 'module',
    plugins: ['classProperties', 'typescript', 'jsx'],
  });
}

module.exports = function (source) {
  try {
    const ast = getNode(source);
    let rootStoreImportName = '__btripStore__';
    traverse(ast, {
      ImportDeclaration: function (path) {
        const isModelSpec = path.node.specifiers.find(
          a =>
            t.isImportSpecifier(a) &&
            ['useModel', 'useModelState'].includes(a.imported.name)
        );
        if (isModelSpec) {
          const hasDefaultSpec = path.node.specifiers.find(a =>
            t.isImportDefaultSpecifier(a)
          );
          if (!hasDefaultSpec) {
            path.node.specifiers.unshift(
              t.importDefaultSpecifier(t.identifier(rootStoreImportName))
            );
          } else {
            rootStoreImportName = hasDefaultSpec.local.name;
          }
        }
      },
      CallExpression: function (path) {
        const defaultUseSelectorFn = `${rootStoreImportName}.useSelector`;
        if (path.node.callee.name === 'useModelState') {
          path.node.callee = convertStringToMemberExpression(
            defaultUseSelectorFn,
            false
          );

          const modelName = path.node.arguments[0].value;
          const parentNode = path.parent.id;

          if (t.isObjectPattern(parentNode)) {
            const { valuePaths, valueNodes } =
              getValuePathsAndNodes(parentNode);
            path.parent.id = t.objectPattern(valueNodes);
            path.node.arguments[0] = getSelectorFn(modelName, valuePaths);
          }
        }
        if (path.node.callee.name === 'useModel') {
          const modelName = path.node.arguments[0].value;
          const parentNode = path.parent.id;
          if (t.isArrayPattern(parentNode)) {
            // 参数列表
            const { valuePaths, valueNodes } = getValuePathsAndNodes(
              parentNode.elements[0]
            );
            if (parentNode.elements.length === 1) {
              path.node.callee = convertStringToMemberExpression(
                defaultUseSelectorFn,
                false
              );
              path.parent.id = t.objectPattern(valueNodes);
              path.node.arguments[0] = getSelectorFn(modelName, valuePaths);
            }
            if (parentNode.elements.length === 2) {
              const dispName = `${rootStoreImportName}.dispatch.${modelName}`;

              path.parent.id.elements[0] = t.objectPattern(valueNodes);

              path.replaceWith(
                t.arrayExpression([
                  t.callExpression(
                    convertStringToMemberExpression(
                      defaultUseSelectorFn,
                      false
                    ),
                    [getSelectorFn(modelName, valuePaths)]
                  ),
                  convertStringToMemberExpression(dispName, false),
                ])
              );
            }
          }
        }
      },
    });
    return generate(ast, { retainLines: false }).code;
  } catch (e) {
    console.log('[usemodel-loader: error]: ', e, source);
    return source;
  }
};
