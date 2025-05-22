import { convertMaskToPlaceholder, isArray, processCaretTraps } from '../utils';
import { placeholderChar as defaultPlaceholderChar } from '../constants';

type Mask =
  | Array<string | RegExp>
  | ((value: string, config?: any) => Array<string | RegExp> | false);

interface ConformToMaskConfig {
  guide?: boolean;
  previousConformedValue?: string;
  placeholderChar?: string;
  placeholder?: string;
  currentCaretPosition?: number;
  keepCharPositions?: boolean;
}

interface ConformToMaskResult {
  conformedValue: string;
  meta: {
    someCharsRejected: boolean;
  };
}

const emptyString = '';

export default function conformToMask(
  rawValue: string = emptyString,
  mask: Mask,
  config: ConformToMaskConfig = {}
): ConformToMaskResult {
  if (!isArray(mask)) {
    if (typeof mask === 'function') {
      const result = mask(rawValue, config);
      if (result === false)
        return { conformedValue: rawValue, meta: { someCharsRejected: false } };
      mask = processCaretTraps(result).maskWithoutCaretTraps;
    } else {
      throw new Error(
        'Text-mask: conformToMask; The mask must be an array or a function.'
      );
    }
  }

  const {
    guide = true,
    previousConformedValue = emptyString,
    placeholderChar = defaultPlaceholderChar,
    placeholder = convertMaskToPlaceholder(mask, placeholderChar),
    currentCaretPosition,
    keepCharPositions,
  } = config;

  const suppressGuide = guide === false && previousConformedValue !== undefined;
  const rawValueLength = rawValue.length;
  const previousConformedValueLength = previousConformedValue.length;
  const placeholderLength = placeholder.length;
  const maskLength = mask.length;
  const editDistance = rawValueLength - previousConformedValueLength;
  const isAddition = editDistance > 0;
  const indexOfFirstChange =
    typeof currentCaretPosition === 'number'
      ? currentCaretPosition + (isAddition ? -editDistance : 0)
      : 0;
  const indexOfLastChange = indexOfFirstChange + Math.abs(editDistance);

  if (keepCharPositions === true && !isAddition) {
    let compensatingPlaceholderChars = '';
    for (let i = indexOfFirstChange; i < indexOfLastChange; i++) {
      if (placeholder[i] === placeholderChar) {
        compensatingPlaceholderChars += placeholderChar;
      }
    }
    rawValue =
      rawValue.slice(0, indexOfFirstChange) +
      compensatingPlaceholderChars +
      rawValue.slice(indexOfFirstChange);
  }

  const rawValueArr = rawValue.split('').map((char, i) => ({
    char,
    isNew: i >= indexOfFirstChange && i < indexOfLastChange,
  }));

  for (let i = rawValueLength - 1; i >= 0; i--) {
    const { char } = rawValueArr[i];
    if (char !== placeholderChar) {
      const shouldOffset =
        i >= indexOfFirstChange && previousConformedValueLength === maskLength;
      if (char === placeholder[shouldOffset ? i - editDistance : i]) {
        rawValueArr.splice(i, 1);
      }
    }
  }

  let conformedValue = '';
  let someCharsRejected = false;

  placeholderLoop: for (let i = 0; i < placeholderLength; i++) {
    const charInPlaceholder = placeholder[i];

    if (charInPlaceholder === placeholderChar) {
      if (rawValueArr.length > 0) {
        while (rawValueArr.length > 0) {
          const { char: rawValueChar, isNew } = rawValueArr.shift()!;

          if (rawValueChar === placeholderChar && suppressGuide !== true) {
            conformedValue += placeholderChar;
            continue placeholderLoop;
          } else if ((mask[i] as RegExp).test(rawValueChar)) {
            if (
              keepCharPositions !== true ||
              isNew === false ||
              previousConformedValue === emptyString ||
              guide === false ||
              !isAddition
            ) {
              conformedValue += rawValueChar;
            } else {
              const rawValueArrLength = rawValueArr.length;
              let indexOfNextAvailablePlaceholderChar: number | null = null;
              for (let j = 0; j < rawValueArrLength; j++) {
                const charData = rawValueArr[j];
                if (
                  charData.char !== placeholderChar &&
                  charData.isNew === false
                )
                  break;
                if (charData.char === placeholderChar) {
                  indexOfNextAvailablePlaceholderChar = j;
                  break;
                }
              }
              if (indexOfNextAvailablePlaceholderChar !== null) {
                conformedValue += rawValueChar;
                rawValueArr.splice(indexOfNextAvailablePlaceholderChar, 1);
              } else {
                i--;
              }
            }
            continue placeholderLoop;
          } else {
            someCharsRejected = true;
          }
        }
      }

      if (!suppressGuide) {
        conformedValue += placeholder.slice(i);
      }
      break;
    } else {
      conformedValue += charInPlaceholder;
    }
  }

  if (suppressGuide && !isAddition) {
    let indexOfLastFilledPlaceholderChar: number | null = null;
    for (let i = 0; i < conformedValue.length; i++) {
      if (placeholder[i] === placeholderChar) {
        indexOfLastFilledPlaceholderChar = i;
      }
    }
    conformedValue =
      indexOfLastFilledPlaceholderChar !== null
        ? conformedValue.slice(0, indexOfLastFilledPlaceholderChar + 1)
        : '';
  }

  return {
    conformedValue,
    meta: { someCharsRejected },
  };
}
