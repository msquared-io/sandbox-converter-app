"use client"

import * as React from "react"
import { ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  placeholder?: string
  onValueChange?: (value: string) => void
  className?: string
}

const Combobox = React.forwardRef<HTMLInputElement, ComboboxProps>(
  ({ options, value = "", placeholder, onValueChange, className, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const [searchTerm, setSearchTerm] = React.useState("")
    const [displayValue, setDisplayValue] = React.useState("")
    const dropdownRef = React.useRef<HTMLDivElement>(null)
    const inputRef = React.useRef<HTMLInputElement>(null)

    // Filter options based on search term
    const filteredOptions = React.useMemo(() => {
      if (!searchTerm) return options
      return options.filter(option => 
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        option.value.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }, [options, searchTerm])

    // Update display value when value prop changes
    React.useEffect(() => {
      if (value) {
        const option = options.find(opt => opt.value === value)
        if (option) {
          setDisplayValue(option.label)
          setSearchTerm("")
        } else {
          setDisplayValue(value)
          setSearchTerm(value)
        }
      } else {
        setDisplayValue("")
        setSearchTerm("")
      }
    }, [value, options])

    // Handle clicking outside to close dropdown
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false)
          // If there's a search term but no exact match, keep the search term as value
          if (searchTerm && !options.find(opt => opt.label === searchTerm)) {
            setDisplayValue(searchTerm)
            onValueChange?.(searchTerm)
          }
        }
      }

      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [searchTerm, options, onValueChange])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setSearchTerm(newValue)
      setDisplayValue(newValue)
      setIsOpen(true)
      onValueChange?.(newValue)
    }

    const handleOptionSelect = (option: ComboboxOption) => {
      setDisplayValue(option.label)
      setSearchTerm("")
      setIsOpen(false)
      onValueChange?.(option.value)
      inputRef.current?.blur()
    }

    const handleInputFocus = () => {
      setIsOpen(true)
      // When focusing, if there's a selected option, start with empty search to show all options
      if (displayValue && options.find(opt => opt.label === displayValue)) {
        setSearchTerm("")
      }
    }

    const handleClear = () => {
      setDisplayValue("")
      setSearchTerm("")
      setIsOpen(false)
      onValueChange?.("")
      inputRef.current?.focus()
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
        inputRef.current?.blur()
      } else if (e.key === 'Enter' && filteredOptions.length === 1) {
        handleOptionSelect(filteredOptions[0])
      }
    }

    return (
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={isOpen ? searchTerm : displayValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-20",
              className
            )}
            {...props}
          />
          <div className="absolute right-1 top-1 flex items-center gap-1">
            {displayValue && (
              <button
                type="button"
                onClick={handleClear}
                className="h-8 w-8 rounded-md hover:bg-accent hover:text-accent-foreground flex items-center justify-center"
                tabIndex={-1}
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="h-8 w-8 rounded-md hover:bg-accent hover:text-accent-foreground flex items-center justify-center"
              tabIndex={-1}
            >
              <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                No options found
              </div>
            ) : (
              <div className="p-1">
                {filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleOptionSelect(option)}
                    className="w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground outline-none"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }
)
Combobox.displayName = "Combobox"

export { Combobox }
export type { ComboboxOption } 