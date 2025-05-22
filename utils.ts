import { placeholderChar as defaultPlaceholderChar } from './constants';

export function convertMaskToPlaceholder(
  mask: Array<string | RegExp> = [],
  placeholderChar: string = defaultPlaceholderChar
): string {
  if (!isArray(mask)) {
    throw new Error(
      'Text-mask: convertMaskToPlaceholder; The mask must be an array.'
    );
  }

  if (mask.includes(placeholderChar)) {
    throw new Error(
      `Placeholder character must not be used inside the mask.\n\n` +
        `Received placeholder: ${JSON.stringify(placeholderChar)}\n` +
        `Received mask: ${JSON.stringify(mask)}`
    );
  }

  return mask
    .map((char) => (char instanceof RegExp ? placeholderChar : char))
    .join('');
}

export function isArray(value: unknown): value is any[] {
  return Array.isArray(value);
}

export function isString(value: unknown): value is string {
  return typeof value === 'string' || value instanceof String;
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isNil(value: unknown): value is null | undefined {
  return value === null || typeof value === 'undefined';
}

const strCaretTrap = '[]';

export interface ProcessCaretTrapsResult {
  maskWithoutCaretTraps: Array<string | RegExp>;
  indexes: number[];
}

/**
 * Removes caret traps (`[]`) from the mask and returns both cleaned mask and indexes where they were found.
 */
export function processCaretTraps(
  mask: Array<string | RegExp | string>
): ProcessCaretTrapsResult {
  const indexes: number[] = [];
  const resultMask: Array<string | RegExp> = [];

  mask.forEach((item, index) => {
    if (item === strCaretTrap) {
      indexes.push(index);
    } else {
      resultMask.push(item);
    }
  });

  return {
    maskWithoutCaretTraps: resultMask,
    indexes,
  };
}
