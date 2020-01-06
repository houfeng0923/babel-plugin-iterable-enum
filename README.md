# babel-plugin-iterable-enum

Make typescript enum iterable.

## Install

Using npm:

```sh
npm install --save-dev babel-plugin-iterable-enum
```

or using yarn:

```sh
yarn add babel-plugin-iterable-enum --dev
```

## Usage

`.babelrc`

```json
{
  "plugins": ["iterable-enum", "@babel/transform-typescript"]
}
```

### Output

```
// Before

enum Direction { Left, Right, Down, Up };

// After

const Direction = {
  Left: 0,
  Right: 1,
  Down: 2,
  Up: 3,
  '__proto__': {
    0: 'Left',
    1: 'Right',
    2: 'Down',
    3: 'Up'
  }
};

// so, we can iterable enum using `Object.keys(Direction)`
```
