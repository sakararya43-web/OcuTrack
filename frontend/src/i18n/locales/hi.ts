import { TranslationDictionary } from '../types';
import { hiCommon } from './hi/common';
import { hiLanding } from './hi/landing';
import { hiPages } from './hi/pages';

export const hi: TranslationDictionary = {
  ...hiCommon,
  ...hiLanding,
  ...hiPages,
};
