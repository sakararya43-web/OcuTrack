import { TranslationDictionary } from '../types';
import { esCommon } from './es/common';
import { esLanding } from './es/landing';
import { esPages } from './es/pages';

export const es: TranslationDictionary = {
  ...esCommon,
  ...esLanding,
  ...esPages,
};
