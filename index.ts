// Main component and types
export { MaskedInput, MaskedInputProps } from "./src/MaskedInput";

// Utility functions for advanced use cases
export { default as conformToMask } from "./src/conformToMask";
export type {
  Mask,
  ConformToMaskConfig,
  ConformToMaskResult,
} from "./src/conformToMask";

export { default as adjustCaretPosition } from "./src/adjustCaretPosition";
export type { AdjustCaretPositionArgs } from "./src/adjustCaretPosition";

export { default as createTextMaskInputElement } from "./src/createTextMaskInputElement";
export type {
  CreateTextMaskInputElementConfig,
  TextMaskInputElement,
} from "./src/createTextMaskInputElement";

/**
 * Usage Example:
 *
 * import { MaskedInput, MaskedInputProps } from 'react-text-mask-modern';
 *
 * <MaskedInput
 *   mask={[/\d/, /\d/, '/', /\d/, /\d/, '/', /\d/, /\d/, /\d/, /\d/]}
 *   placeholder="dd/mm/yyyy"
 *   value={value}
 *   onChange={(e) => setValue(e.target.value)}
 * />
 */
