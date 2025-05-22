import adjustCaretPosition from './adjustCaretPosition';
import conformToMask from './conformToMask';
import {
  convertMaskToPlaceholder,
  isString,
  isNumber,
  processCaretTraps,
} from '../utils';
import { placeholderChar as defaultPlaceholderChar } from '../constants';

const emptyString = '';
const strNone = 'none';
const strObject = 'object';
const isAndroid =
  typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
  const defer = (cb: () => void) => {
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(cb);
    } else {
      setTimeout(cb, 0);
    }
  };
  

export interface CreateTextMaskInputElementConfig {
  inputElement: HTMLInputElement;
  mask:
    | Array<string | RegExp>
    | ((value: string, config?: any) => Array<string | RegExp> | false)
    | boolean
    | {
        mask:
          | Array<string | RegExp>
          | ((value: string, config?: any) => Array<string | RegExp> | false);
        pipe?: (
          conformedValue: string,
          config: any
        ) => false | string | { value: string; [key: string]: any };
      };
  guide?: boolean;
  pipe?: (
    conformedValue: string,
    config: any
  ) => false | string | { value: string; [key: string]: any };
  placeholderChar?: string;
  keepCharPositions?: boolean;
  showMask?: boolean;
}

export interface TextMaskInputElement {
  state: {
    previousConformedValue?: string;
    previousPlaceholder?: string;
  };
  update: (
    rawValue?: string | number,
    configOverride?: Partial<CreateTextMaskInputElementConfig>
  ) => void;
}

export default function createTextMaskInputElement(
  config: CreateTextMaskInputElementConfig
): TextMaskInputElement {
  const state: TextMaskInputElement['state'] = {
    previousConformedValue: undefined,
    previousPlaceholder: undefined,
  };

  return {
    state,

    update(
      rawValue?: string | number,
      {
        inputElement,
        mask: providedMask,
        guide,
        pipe,
        placeholderChar = defaultPlaceholderChar,
        keepCharPositions = false,
        showMask = false,
      }: Partial<CreateTextMaskInputElementConfig> = config
    ) {
      if (typeof rawValue === 'undefined') {
        rawValue = inputElement?.value;
      }

      if (rawValue === state.previousConformedValue) return;

      if (
        typeof providedMask === strObject &&
        (providedMask as any).pipe !== undefined &&
        (providedMask as any).mask !== undefined
      ) {
        pipe = (providedMask as any).pipe;
        providedMask = (providedMask as any).mask;
      }

      let mask: any = providedMask;
      let placeholder: string | undefined;
      let caretTrapIndexes: number[] | undefined;

      if (Array.isArray(mask)) {
        placeholder = convertMaskToPlaceholder(mask, placeholderChar);
      } else if (typeof mask === 'function') {
        const evaluatedMask = mask(getSafeRawValue(rawValue), {
          currentCaretPosition: inputElement?.selectionEnd,
          previousConformedValue: state.previousConformedValue,
          placeholderChar,
        });

        if (evaluatedMask === false) return;

        const { maskWithoutCaretTraps, indexes } =
          processCaretTraps(evaluatedMask);

        mask = maskWithoutCaretTraps;
        caretTrapIndexes = indexes;
        placeholder = convertMaskToPlaceholder(mask, placeholderChar);
      }

      if (mask === false) return;

      const safeRawValue = getSafeRawValue(rawValue);
      const currentCaretPosition = inputElement?.selectionEnd ?? 0;
      const { previousConformedValue, previousPlaceholder } = state;

      const conformToMaskConfig = {
        previousConformedValue,
        guide,
        placeholderChar,
        pipe,
        placeholder,
        currentCaretPosition,
        keepCharPositions,
      };

      const { conformedValue } = conformToMask(
        safeRawValue,
        mask,
        conformToMaskConfig
      );

      let finalConformedValue = conformedValue;
      let indexesOfPipedChars: number[] = [];

      if (typeof pipe === 'function') {
        let pipeResult = pipe(conformedValue, {
          rawValue: safeRawValue,
          ...conformToMaskConfig,
        });

        if (pipeResult === false) {
          pipeResult = {
            value: previousConformedValue || '',
            rejected: true,
          };
        } else if (isString(pipeResult)) {
          pipeResult = { value: pipeResult };
        }

        finalConformedValue = (pipeResult as any).value;
        indexesOfPipedChars = (pipeResult as any).indexesOfPipedChars || [];
      }

      const adjustedCaretPosition = adjustCaretPosition({
        previousConformedValue,
        previousPlaceholder,
        conformedValue: finalConformedValue,
        placeholder: placeholder ?? '',
        rawValue: safeRawValue,
        currentCaretPosition,
        placeholderChar,
        indexesOfPipedChars,
        caretTrapIndexes: caretTrapIndexes || [],
      });

      const inputValueShouldBeEmpty =
        finalConformedValue === placeholder && adjustedCaretPosition === 0;
      const emptyValue = showMask ? placeholder ?? '' : emptyString;
      const inputElementValue = inputValueShouldBeEmpty
        ? emptyValue
        : finalConformedValue;

      state.previousConformedValue = inputElementValue;
      state.previousPlaceholder = placeholder;

      if (!inputElement || inputElement.value === inputElementValue) return;

      inputElement.value = inputElementValue;
      safeSetSelection(inputElement, adjustedCaretPosition || 0);
    },
  };
}

function safeSetSelection(element: HTMLInputElement, position: number) {
  if (document.activeElement === element) {
    const cb = () => element.setSelectionRange(position, position, strNone);

    if (isAndroid) {
      defer(cb);
    } else {
      element.setSelectionRange(position, position, strNone);
    }
  }
}
function getSafeRawValue(value: unknown): string {
  if (isString(value)) return value;
  if (isNumber(value)) return String(value);
  if (value === undefined || value === null) return emptyString;

  throw new Error(
    `The 'value' provided to Text Mask needs to be a string or a number. Received: ${JSON.stringify(
      value
    )}`
  );
}
