import React from 'react';
import { SegmentedControl, SegmentedControlProps, SegmentOption } from '../SegmentedControl';

export type SegmentedButtonItem = SegmentOption;
export type SegmentedButtonProps = SegmentedControlProps;

export const SegmentedButton: React.FC<SegmentedButtonProps> = (props) => {
  return <SegmentedControl {...props} />;
};

export default SegmentedButton;
export { SegmentedControl };
