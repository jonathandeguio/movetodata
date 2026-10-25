export interface PlatformConfig {
  id: string;
  platformName: string;
  name: string;
  download: true;
  rowLimit: number | null;
  sizeLimit: number | null;
  cache: boolean;
  cacheExpiration: number;
  upload: boolean;
  logo: string | null;
  createdBy: User;
  createdAt: number;
  updatedBy: User;
  updatedAt: number;
  customTheme:string;
  mfaEnabled?: boolean;
  mfaEnforced?: boolean;
}
