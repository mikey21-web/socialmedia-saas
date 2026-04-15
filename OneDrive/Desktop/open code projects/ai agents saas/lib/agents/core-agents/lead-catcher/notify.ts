import { QualifiedLead } from './qualify';

export interface NotificationResult {
  notificationsSent: number;
  channels: string[];
  timestamp: string;
}

export const notifyTeam = async (qualified: QualifiedLead): Promise<NotificationResult> => {
  return {
    notificationsSent: 2,
    channels: ['Email', 'Slack'],
    timestamp: new Date().toISOString(),
  };
};
