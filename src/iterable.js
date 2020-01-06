import { types } from '@babel/core';
import generate from '@babel/generator';

export default {
  TSEnumDeclaration(path) {
    if (!path.node.const) {
      path.replaceWith(
        types.variableDeclaration('const', [
          types.variableDeclarator(
            types.identifier(path.node.id.name),
            types.objectExpression(
              TSEnumMembersToObjectProperties(path.get('members')),
            ),
          ),
        ]),
      );
      path.skip();
    }
  },
};

const TSEnumMembersToObjectProperties = memberPaths => {
  const isStringEnum = memberPaths.some(memberPath =>
    types.isStringLiteral(memberPath.node.initializer),
  );
  let currentValue = 0;
  const constValues = {};
  const protoPropNodes = [];
  const ownerPropNodes = memberPaths.map(path => {
    const keyNode = computeKeyNodeFromIdPath(path.get('id'));
    const key = getKeyFromKeyNode(keyNode);
    const valueNode = computeValueNodeFromEnumMemberPath(path, isStringEnum, constValues, currentValue);
    const value = getValueFromValueNode(valueNode);
    constValues[key] = value;
    if (types.isNumericLiteral(valueNode)) {
      currentValue = value + 1;
      protoPropNodes.push(types.objectProperty(valueNode, keyNode));
    } else if (types.isStringLiteral(valueNode)) {
      currentValue = null;
    }
    return types.objectProperty(keyNode, valueNode);
  });
  return protoPropNodes.length > 0 ? ownerPropNodes.concat(types.objectProperty(
    types.stringLiteral('__proto__'),
    types.objectExpression(protoPropNodes)
  )) : ownerPropNodes;
};

const computeKeyNodeFromIdPath = idPath => {
  const id = idPath.node;
  let keyNode;
  if (types.isIdentifier(id)) {
    const key = id.name;
    keyNode = types.identifier(key);
  } else if (types.isStringLiteral(id)) {
    const key = id.value;
    keyNode = types.stringLiteral(key);
  } else if (types.isNumericLiteral(id)) {
    throw idPath.buildCodeFrameError(
      'An enum member cannot have a numeric name.',
    );
  } else {
    throw idPath.buildCodeFrameError('Enum member expected.');
  }
  return keyNode;
};

const getKeyFromKeyNode = keyNode => {
  let key;
  if (types.isIdentifier(keyNode)) {
    key = keyNode.name;
  } else if (types.isStringLiteral(keyNode)) {
    key = keyNode.value;
  }
  return key;
};

const computeValueNodeFromEnumMemberPath = (tsEnumMemberPath, isStringEnum, constValues, currentValue) => {
  const initializerPath = tsEnumMemberPath.get('initializer');
  const initializer = initializerPath.node;
  let value;
  if (initializer) {
    if (types.isNumericLiteral(initializer) || types.isStringLiteral(initializer)) {
      value = initializer.value;
    } else if (types.isIdentifier(initializer)) {
      value = constValues[initializer.name];
      validateConstEnumMemberAccess(tsEnumMemberPath, value);
    } else if (isNumericUnaryExpression(initializer) || isNumericBinaryExpression(initializer)) {
      if (isStringEnum) {
        throw initializerPath.buildCodeFrameError(
          'Computed values are not permitted in an enum with string valued members.',
        );
      }
      initializerPath.traverse(accessConstEnumMemberVisitor, { constValues });
      value = eval(generate(initializer).code);
    } else {
      throw initializerPath.buildCodeFrameError(
        'Enum initializer must be a string literal or numeric expression.',
      );
    }
  } else {
    if (currentValue === null) {
      throw tsEnumMemberPath.buildCodeFrameError(
        'Enum member must have initializer..',
      );
    }
    value = currentValue;
  }
  let valueNode;
  if (Number.isFinite(value)) {
    valueNode = types.numericLiteral(value);
  } else if (typeof value === 'string') {
    valueNode = types.stringLiteral(value);
  } else {
    throw new Error('`value` is not a number or string');
  }

  return valueNode;
};

const getValueFromValueNode = valueNode => {
  let value;
  if (types.isNumericLiteral(valueNode) || types.isStringLiteral(valueNode)) {
    value = valueNode.value;
  }
  return value;
};

const isNumericUnaryExpression = node => types.isUnaryExpression(node) &&
  new Set(['+', '-', '~']).has(node.operator);

const isNumericBinaryExpression = node => types.isBinaryExpression(node) &&
  new Set([ '+', '-', '/', '%', '*', '**', '&', '|', '>>', '>>>', '<<', '^' ]).has(node.operator);

const validateConstEnumMemberAccess = (path, value) => {
  if (value === undefined) {
    throw path.buildCodeFrameError(
      'Enum initializer identifier must reference a previously defined enum member.',
    );
  }
};

const accessConstEnumMemberVisitor = {
  enter(path) {
    if (types.isIdentifier(path.node)) {
      const constValues = this.constValues;
      const value = constValues[path.node.name];
      validateConstEnumMemberAccess(path, value);
      path.replaceWith(types.numericLiteral(value));
      path.skip();
    } else if (!(
      types.isNumericLiteral(path.node) ||
      isNumericUnaryExpression(path.node) ||
      isNumericBinaryExpression(path.node)
    )
    ) {
      throw path.buildCodeFrameError('Must be numeric expression.');
    }
  },
};
