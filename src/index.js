import { declare } from '@babel/helper-plugin-utils';
import syntaxTypeScript from '@babel/plugin-syntax-typescript';
import visitor from './iterable';

export default declare((api) => {
  api.assertVersion(7);

  return {
    name: 'iterable-enum',
    inherits: syntaxTypeScript,
    visitor,
  };
});
