import { transformAsync } from '@babel/core';
import plugin from '../src';

const options = {
  plugins: [plugin],
};

it('Transform default values', async () => {
  const input = `enum Direction { Left, Right, Down, Up };`;
  const { code } = await transformAsync(input, options);
  expect(code).toMatchSnapshot();
});


it('Transforms default string values', async () => {
  const input = `enum Direction {
    Left = 'Left',
    Right = 'Right',
    Down = 'Down',
    Up = 'Up'
  };`
  const { code } = await transformAsync(input, options);
  expect(code).toMatchSnapshot();
});

it('Transforms computed values', async () => {
  const input = `enum Direction {
    Left,
    Right,
    Down,
    Up,
    Front = Up
  };`
  const { code } = await transformAsync(input, options);
  expect(code).toMatchSnapshot();
});


it('Ignore transforms const enum', async () => {
  const input = `const enum Direction {
    Left = 'Left',
    Right = 'Right',
    Down = 'Down',
    Up = 'Up'
  };`
  const { code } = await transformAsync(input, options);
  expect(code).toMatchSnapshot();
});
