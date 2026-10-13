import React from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
}

export interface CustomSelectProps {
  value: string | number;
  onChange: (val: any) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  placement?: 'auto' | 'top' | 'bottom';
  triggerClassName?: string;
}

export interface MultiSelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

export interface CustomMultiSelectProps {
  values?: string[];
  onChange: (values: string[]) => void;
  options: MultiSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  placement?: 'auto' | 'top' | 'bottom';
}
