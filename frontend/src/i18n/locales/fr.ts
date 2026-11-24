import { TranslationDictionary } from '../types';
import { frCommon } from './fr/common';
import { frLanding } from './fr/landing';
import { frPages } from './fr/pages';

export const fr: TranslationDictionary = {
  ...frCommon,
  ...frLanding,
  ...frPages,
};
