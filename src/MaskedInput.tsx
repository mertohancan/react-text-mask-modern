import React, {
  useEffect,
  useRef,
  useCallback,
  InputHTMLAttributes,
  ChangeEvent,
  FocusEvent,
  forwardRef,
} from 'react';

import createTextMaskInputElement from './createTextMaskInputElement';

export interface MaskedInputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'value' | 'onChange' | 'onBlur'
  > {
  mask: any;
  guide?: boolean;
  value?: string | number;
  pipe?: any;
  placeholderChar?: string;
  keepCharPositions?: boolean;
  showMask?: boolean;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
}

export const MaskedInput = forwardRef<HTMLInputElement, MaskedInputProps>(
  (
    {
      mask,
      guide,
      value,
      pipe,
      placeholderChar,
      keepCharPositions,
      showMask,
      onBlur,
      onChange,
      ...rest
    },
    ref
  ) => {
    const localRef = useRef<HTMLInputElement | null>(null);
    const inputRef =
      (ref as React.RefObject<HTMLInputElement | null>) ?? localRef;

    const textMaskRef = useRef<any>(null);

    const initTextMask = useCallback(() => {
      if (!inputRef.current) return;

      textMaskRef.current = createTextMaskInputElement({
        inputElement: inputRef.current,
        mask,
        guide,
        pipe,
        placeholderChar,
        keepCharPositions,
        showMask,
      });

      textMaskRef.current.update(value);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      mask,
      guide,
      pipe,
      placeholderChar,
      keepCharPositions,
      showMask,
      value,
    ]);

    useEffect(() => {
      initTextMask();
    }, [initTextMask]);

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      textMaskRef.current?.update();
      onChange?.(event);
    };

    const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
      onBlur?.(event);
    };

    return (
      <input
        ref={(el) => {
          localRef.current = el;
          if (typeof ref === 'function') {
            ref(el);
          } else if (ref) {
            (ref as React.RefObject<HTMLInputElement | null>).current = el;
          }
        }}
        onBlur={handleBlur}
        onChange={handleChange}
        value={value}
        {...rest}
      />
    );
  }
);
