import { forwardRef, type InputHTMLAttributes, type ForwardRefExoticComponent, type RefAttributes, type ReactNode, type ChangeEvent } from 'react'

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  label: string
  error?: string
  helperText?: string
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
  variant?: 'filled' | 'outlined'
  floatingLabel?: boolean
  maxLength?: number
  counter?: boolean
  value?: string | number
  onChange?: (value: string) => void
}

const TextFieldComponent = forwardRef<HTMLInputElement, TextFieldProps>(
  ({
    label,
    error,
    helperText,
    leadingIcon,
    trailingIcon,
    variant = 'outlined',
    floatingLabel = true,
    maxLength,
    counter = false,
    className = '',
    id,
    required,
    disabled,
    onChange,
    value,
    ...props
  }, ref) => {
    const inputId = id || label.toLowerCase().replace(/\s+/g, '-')
    const errorId = error ? `${inputId}-error` : undefined
    const helperId = helperText && !error ? `${inputId}-helper` : undefined
    const counterId = counter && maxLength ? `${inputId}-counter` : undefined

    const describedBy = [errorId, helperId, counterId].filter(Boolean).join(' ') || undefined

    const valueStr = value != null ? String(value) : ''
    const hasValue = valueStr.length > 0

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.value)
    }

    return (
      <div className={`relative ${className}`}>
        <div className="relative">
          {leadingIcon && (
            <div
              className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"
              aria-hidden="true"
            >
              {leadingIcon}
            </div>
          )}

          <label
            htmlFor={inputId}
            className={`
              absolute left-3 top-1/2 -translate-y-1/2
              text-body-large text-on-surface-variant
              pointer-events-none transition-all duration-fast easing-standard
              origin-left
              ${floatingLabel && (hasValue || error) ? 'scale-75 -translate-y-7 text-label-large text-primary' : ''}
              ${floatingLabel && !hasValue && !error ? 'text-body-large' : ''}
              ${!floatingLabel ? 'text-label-medium uppercase tracking-wide' : ''}
            `}
          >
            {label}
            {required && <span className="text-error ml-0.5" aria-hidden="true">*</span>}
          </label>

          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={describedBy}
            aria-required={required}
            disabled={disabled}
            required={required}
            onChange={handleChange}
            value={valueStr}
            className={`
              w-full
              py-3.5 px-4
              text-body-large text-on-surface
              placeholder:text-on-surface-variant/60
              bg-transparent
              border-0 outline-none
              ${leadingIcon ? 'pl-10' : ''}
              ${trailingIcon ? 'pr-10' : ''}
              ${floatingLabel ? 'pt-5 pb-2' : ''}
            `.trim()}
            maxLength={maxLength}
            {...props}
          />

          {trailingIcon && (
            <div
              className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"
              aria-hidden="true"
            >
              {trailingIcon}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-1.5 gap-2">
          {(error || helperText) && (
            <p
              id={errorId || helperId}
              role={error ? 'alert' : undefined}
              className={`
                text-body-small transition-colors duration-fast
                ${error ? 'text-error' : 'text-on-surface-variant'}
              `}
            >
              {error || helperText}
            </p>
          )}

          {counter && maxLength && (
            <p
              id={counterId}
              className="text-label-small text-on-surface-variant font-mono"
              aria-live="polite"
            >
              {valueStr.length} / {maxLength}
            </p>
          )}
        </div>
      </div>
    )
  }
)

TextFieldComponent.displayName = 'TextField'

export const TextField = TextFieldComponent as ForwardRefExoticComponent<TextFieldProps & RefAttributes<HTMLInputElement>>