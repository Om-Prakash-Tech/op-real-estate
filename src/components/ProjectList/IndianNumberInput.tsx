import React, { useState } from 'react';
import { Input } from 'antd';

// Standard Indian number formatting function
export const formatIndianNumber = (value: string | number) => {
    // Convert to string and remove existing commas
    const numString = String(value).replace(/,/g, '');

    // Handle empty or non-numeric strings
    if (!numString || isNaN(Number(numString))) return '';

    // Split integer and decimal parts
    const [integerPart, decimalPart] = numString.split('.');

    // Indian number formatting logic
    const formatIndianStyle = (intPart: string) => {
        const len = intPart.length;

        // Less than 4 digits, no formatting needed
        if (len <= 3) return intPart;

        // Handle the last three digits
        let result = intPart.slice(-3);

        // Process remaining digits in groups of 2
        for (let i = len - 3; i > 0; i -= 2) {
            // Take 2 digits at a time (or remaining digits if less than 2)
            const group = intPart.slice(Math.max(0, i - 2), i);
            result = group + ',' + result;
        }

        return result;
    };

    // Format integer part with Indian-style commas
    const formattedInteger = formatIndianStyle(integerPart);

    // Combine formatted integer with decimal part if exists
    return decimalPart
        ? `${formattedInteger}.${decimalPart}`
        : formattedInteger;
};

// Custom input component for Indian-formatted numbers
export const IndianNumberInput = ({
    value,
    onChange,
    ...props
}: any) => {
    const [displayValue, setDisplayValue] = useState(
        value ? formatIndianNumber(value) : ''
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value.replace(/,/g, '');

        // Only allow numbers and optional decimal
        if (/^\d*\.?\d*$/.test(inputValue)) {
            // Update display with formatted value
            setDisplayValue(formatIndianNumber(inputValue));

            // Call onChange with raw number
            if (onChange) {
                onChange(Number(inputValue) || null);
            }
        }
    };

    return (
        <Input
            {...props}
            value={displayValue}
            onChange={handleChange}
        />
    );
};