import {defineRouting} from 'next-intl/routing';
 
export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['en', 'id'],
 
  // Used when no locale matches
  defaultLocale: 'id',
  
  // Disable automatic locale detection since we handle it manually in middleware
  localeDetection: false
});