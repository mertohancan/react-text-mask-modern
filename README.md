# react-text-mask-modern

A modern, React 19-compatible masked input component with full TypeScript and hooks support.

> Forked and re-implemented from [text-mask](https://github.com/text-mask/text-mask) — which is no longer maintained.

---

## Features

- ✅ **React 19 compatible**  
  Built and tested with the latest React 19 architecture and JSX runtime.

- ✅ **Full TypeScript support**  
  All components and utilities come with full type definitions out of the box.

- ✅ **Hooks & Functional Components**  
  No class-based code. Built for modern React.

- ✅ **Drop-in replacement for `react-text-mask`**  
  Same API, but modernized, maintained, and compatible with the current ecosystem.

- ✅ **Zero dependencies**  
  Lightweight and fast. Ideal for both simple and complex masking needs.

- ✅ **Mask flexibility**  
  Supports static masks, dynamic functions, and pipes for advanced formatting use cases.

---

## Installation

```bash
npm install react-text-mask-modern
```

---

## Usage

```tsx
import React, { useState } from 'react'
import { MaskedInput } from 'react-text-mask-modern'

export default function Example() {
  const [value, setValue] = useState('')

  return (
    <MaskedInput
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="dd/mm/yyyy"
      mask={[/\d/, /\d/, '/', /\d/, /\d/, '/', /\d/, /\d/, /\d/, /\d/]}
    />
  )
}
```


