const defaultArray: any[] = [];
const emptyString = '';

interface AdjustCaretPositionArgs {
  previousConformedValue?: string;
  previousPlaceholder?: string;
  currentCaretPosition?: number;
  conformedValue: string;
  rawValue: string;
  placeholderChar: string;
  placeholder: string;
  indexesOfPipedChars?: number[];
  caretTrapIndexes?: number[];
}

export default function adjustCaretPosition({
  previousConformedValue = emptyString,
  previousPlaceholder = emptyString,
  currentCaretPosition = 0,
  conformedValue,
  rawValue,
  placeholderChar,
  placeholder,
  indexesOfPipedChars = defaultArray,
  caretTrapIndexes = defaultArray,
}: AdjustCaretPositionArgs): number {
  if (currentCaretPosition === 0 || !rawValue.length) {
    return 0;
  }

  const rawValueLength = rawValue.length;
  const previousConformedValueLength = previousConformedValue.length;
  const placeholderLength = placeholder.length;
  const conformedValueLength = conformedValue.length;
  const editLength = rawValueLength - previousConformedValueLength;
  const isAddition = editLength > 0;
  const isFirstRawValue = previousConformedValueLength === 0;
  const isPartialMultiCharEdit =
    editLength > 1 && !isAddition && !isFirstRawValue;

  if (isPartialMultiCharEdit) {
    return currentCaretPosition;
  }

  const possiblyHasRejectedChar =
    isAddition &&
    (previousConformedValue === conformedValue ||
      conformedValue === placeholder);

  let startingSearchIndex = 0;
  let trackRightCharacter = false;
  let targetChar: string | undefined;

  if (possiblyHasRejectedChar) {
    startingSearchIndex = currentCaretPosition - editLength;
  } else {
    const normalizedConformedValue = conformedValue.toLowerCase();
    const normalizedRawValue = rawValue.toLowerCase();
    const leftHalfChars = normalizedRawValue
      .substring(0, currentCaretPosition)
      .split(emptyString);
    const intersection = leftHalfChars.filter(
      (char) => normalizedConformedValue.indexOf(char) !== -1
    );
    targetChar = intersection[intersection.length - 1];

    const previousLeftMaskChars = previousPlaceholder
      .substring(0, intersection.length)
      .split(emptyString)
      .filter((char) => char !== placeholderChar).length;

    const leftMaskChars = placeholder
      .substring(0, intersection.length)
      .split(emptyString)
      .filter((char) => char !== placeholderChar).length;

    const maskLengthChanged = leftMaskChars !== previousLeftMaskChars;

    const targetIsMaskMovingLeft =
      previousPlaceholder[intersection.length - 1] !== undefined &&
      placeholder[intersection.length - 2] !== undefined &&
      previousPlaceholder[intersection.length - 1] !== placeholderChar &&
      previousPlaceholder[intersection.length - 1] !==
        placeholder[intersection.length - 1] &&
      previousPlaceholder[intersection.length - 1] ===
        placeholder[intersection.length - 2];

    if (
      !isAddition &&
      (maskLengthChanged || targetIsMaskMovingLeft) &&
      previousLeftMaskChars > 0 &&
      placeholder.indexOf(targetChar) > -1 &&
      rawValue[currentCaretPosition] !== undefined
    ) {
      trackRightCharacter = true;
      targetChar = rawValue[currentCaretPosition];
    }

    const pipedChars = indexesOfPipedChars.map(
      (index) => normalizedConformedValue[index]
    );

    const countTargetCharInPipedChars = pipedChars.filter(
      (c) => c === targetChar
    ).length;
    const countTargetCharInIntersection = intersection.filter(
      (c) => c === targetChar
    ).length;
    const countTargetCharInPlaceholder = placeholder
      .substring(0, placeholder.indexOf(placeholderChar))
      .split(emptyString)
      .filter(
        (char, index) => char === targetChar && rawValue[index] !== char
      ).length;

    const requiredNumberOfMatches =
      countTargetCharInPlaceholder +
      countTargetCharInIntersection +
      countTargetCharInPipedChars +
      (trackRightCharacter ? 1 : 0);

    let numberOfEncounteredMatches = 0;
    for (let i = 0; i < conformedValueLength; i++) {
      const conformedValueChar = normalizedConformedValue[i];
      startingSearchIndex = i + 1;
      if (conformedValueChar === targetChar) {
        numberOfEncounteredMatches++;
      }
      if (numberOfEncounteredMatches >= requiredNumberOfMatches) {
        break;
      }
    }
  }

  if (isAddition) {
    let lastPlaceholderChar = startingSearchIndex;
    for (let i = startingSearchIndex; i <= placeholderLength; i++) {
      if (placeholder[i] === placeholderChar) {
        lastPlaceholderChar = i;
      }
      if (
        placeholder[i] === placeholderChar ||
        caretTrapIndexes.indexOf(i) !== -1 ||
        i === placeholderLength
      ) {
        return lastPlaceholderChar;
      }
    }
  } else {
    if (trackRightCharacter) {
      for (let i = startingSearchIndex - 1; i >= 0; i--) {
        if (
          conformedValue[i] === targetChar ||
          caretTrapIndexes.indexOf(i) !== -1 ||
          i === 0
        ) {
          return i;
        }
      }
    } else {
      for (let i = startingSearchIndex; i >= 0; i--) {
        if (
          placeholder[i - 1] === placeholderChar ||
          caretTrapIndexes.indexOf(i) !== -1 ||
          i === 0
        ) {
          return i;
        }
      }
    }
  }

  return currentCaretPosition;
}
