// Get version from environment or use default
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';
export const APP_NAME = 'Genfity Dashboard';

export function getFullVersionString(): string {
  return `${APP_NAME} v${APP_VERSION}`;
}
