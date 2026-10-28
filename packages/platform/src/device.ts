export type PlatformType = 'web' | 'android' | 'ios' | 'windows' | 'macos';

export interface IDeviceInfo {
  platform: PlatformType;
  appVersion: string;
  isTablet: boolean;
  userAgent?: string;
}

