import { forwardRef, type InputHTMLAttributes, type ForwardRefExoticComponent, type RefAttributes } from 'react'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

const TextFieldComponent = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id || label.toLowerCase().replace(/\s+/g, '-')
    const errorId = error ? `${inputId}-error` : undefined

    return (
      <div className={className}>
        <label
          htmlFor={inputId}
          className="block text-xs font-mono font-semibold uppercase tracking-wide text-graphite mb-1"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={errorId}
          className={`
            w-full px-3 py-2.5 text-sm font-sans bg-white
            border-2 border-steel-300
            focus:border-blue focus:outline-none focus:ring-0
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red' : ''}
          `.trim()}
          {...props}
        />
        {error && (
          <p
            id={errorId}
            role="alert"
            className="mt-1 text-xs font-mono text-red"
          >
            {error}
          </p>
        )}
      </div>
    )
  }
)

TextFieldComponent.displayName = 'TextField'

export const TextField = TextFieldComponent as ForwardRefExoticComponent<TextFieldProps & RefAttributes<HTMLInputElement>>