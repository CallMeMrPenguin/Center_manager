import React from 'react';

export type UICategoryId =
  | 'all'
  | 'buttons'
  | 'tables'
  | 'selects'
  | 'datetime'
  | 'navigation'
  | 'inputs'
  | 'modals'
  | 'toasts'
  | 'charts'
  | 'fx'
  | 'tokens';

export interface UICategoryDef {
  id: UICategoryId;
  label: string;
  iconName?: string;
  count?: number;
}

export interface ComponentSourceItem {
  id: string;
  title: string;
  description: string;
  category: UICategoryId;
  dependencies: string[];
  filename: string;
  usageCode: string;
  sourceCode: string;
  typesCode?: string;
}

export interface ComponentCardProps {
  item: ComponentSourceItem;
  children: React.ReactNode;
  onViewCode: (item: ComponentSourceItem) => void;
  className?: string;
}
