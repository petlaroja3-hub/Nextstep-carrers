/**
 * Firebase Cloud Functions v2 & Cloud Scheduler Reference Module
 * ----------------------------------------------------------------------------
 * NOTE ON DEPLOYMENT REQUIREMENTS:
 * Firebase Cloud Functions (`onSchedule`) and Google Cloud Scheduler require
 * the Firebase project (`liquid-lodge-csmzh`) to be upgraded from the Spark
 * (Free) plan to the Blaze (Pay-as-you-go) billing plan, and deployed via:
 *   `firebase deploy --only functions`
 *
 * Inside the Google AI Studio runtime, live server-side official source
 * checking is ALREADY active via Express (`POST /api/verify-source` and
 * `POST /api/verify-batch` in `server.ts`), allowing administrators to trigger
 * real-time HTTP verification and persist logs to `verificationHistory` in
 * Cloud Firestore without requiring Cloud Scheduler billing activation.
 */

export interface ScheduledSourceCheckConfig {
  scheduleCron: string;
  region: string;
  timeoutSeconds: number;
}

export const DEFAULT_SCHEDULER_CONFIG: ScheduledSourceCheckConfig = {
  scheduleCron: 'every 12 hours',
  region: 'asia-south1',
  timeoutSeconds: 60
};
