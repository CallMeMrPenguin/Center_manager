import { ComponentSourceItem } from '../types';
import { buttonSources } from './buttonSources';
import { tableSources } from './tableSources';
import { selectSources } from './selectSources';
import { dateTimeSources } from './dateTimeSources';
import { tabSources } from './tabSources';
import { inputModalSources } from './inputModalSources';
import { toastChartSources } from './toastChartSources';
import { fxThemeSources } from './fxThemeSources';

export const ALL_COMPONENT_SOURCES: ComponentSourceItem[] = [
  ...buttonSources,
  ...tableSources,
  ...selectSources,
  ...dateTimeSources,
  ...tabSources,
  ...inputModalSources,
  ...toastChartSources,
  ...fxThemeSources,
];

export {
  buttonSources,
  tableSources,
  selectSources,
  dateTimeSources,
  tabSources,
  inputModalSources,
  toastChartSources,
  fxThemeSources,
};
