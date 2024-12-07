import React, { useState } from 'react';
import { Input } from 'antd';

// Standard number formatting function
export const formatNumber = (value: string | number) => {
    // Convert to string and remove existing commas
    const numString = String(value).replace(/,/g, '');

    // Handle empty or non-numeric strings
    if (!numString || isNaN(Number(numString))) return '';

    // Split integer and decimal parts
    const [integerPart, decimalPart] = numString.split('.');

    // Format integer part with commas
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    // Combine formatted integer with decimal part if exists
    return decimalPart
        ? `${formattedInteger}.${decimalPart}`
        : formattedInteger;
};

// Custom input component for formatted numbers
export const NumberInput = ({
    value,
    onChange,
    ...props
}: any) => {
    const [displayValue, setDisplayValue] = useState(
        value ? formatNumber(value) : ''
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value.replace(/,/g, '');

        // Only allow numbers and optional decimal
        if (/^\d*\.?\d*$/.test(inputValue)) {
            // Update display with formatted value
            setDisplayValue(formatNumber(inputValue));

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