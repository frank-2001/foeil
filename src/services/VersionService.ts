import * as Application from 'expo-application';
import * as Updates from 'expo-updates';
import Constants from 'expo-constants';
import { Alert } from 'react-native';

interface VersionInfo {
  latest_version: string;
  force_full_update: boolean;
  download_url: string;
  release_notes: string;
  is_ota?: boolean;
}
// const DEV_API = 'http://10.39.169.186:8000/api';


export class VersionService {
  
  private static readonly API_URL = 'https://foeil.lacrea.dev/api';

  /**
   * Compare two semantic versions (e.g. "1.0.0" and "1.0.1")
   * Returns true if v1 < v2
   */
  private static isVersionOlder(currentVersion: string, latestVersion: string): boolean {
    const v1Parts = currentVersion.split('.').map(Number);
    const v2Parts = latestVersion.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
        const v1 = v1Parts[i] || 0;
        const v2 = v2Parts[i] || 0;
        if (v1 < v2) return true;
        if (v1 > v2) return false;
    }
    return false;
  }

  /**
   * Check for both OTA (Expo) updates and mandatory Hard (Server) updates.
   * Runs silently in the background.
   */
  public static async checkForUpdates(): Promise<VersionInfo | null> {
    try {
      // 1. Check for Hard Update from Server
      const currentVersion = Constants.expoConfig?.version || '1.0.0';
      
      const response = await fetch(`${this.API_URL}/version`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        const data: VersionInfo = await response.json();
        const needsUpdate = this.isVersionOlder(currentVersion, data.latest_version);
        console.log('Version response:', data.latest_version, 'current version :', currentVersion, 'needsUpdate :', needsUpdate);
        if (needsUpdate && data.force_full_update) {
          // Hard update required, return info to show the modal
          return data;
        }
        if (needsUpdate && !data.force_full_update) {
          // OTA update required. Trigger fetch dynamically without blocking.
          // OtaIndicator component will catch the state and show progress over the app.
          Updates.fetchUpdateAsync().catch((err) => console.log('Silently failed to fetch OTA:', err));
          return null;
        }
      }
    } catch (error) {
      console.log('Error checking server version:', error);
    }

    // 2. No Hard Update required -> Check for OTA Expo Update
    try {
      if (!__DEV__) {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      }
    } catch (error) {
      console.log('Error checking OTA update:', error);
    }
    return null;
  }
}
