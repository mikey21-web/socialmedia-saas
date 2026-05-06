export type PublishActivityInput = {
  content: string;
  mediaUrls?: string[];
  postId: string;
  teamId: string;
  userId: string;
  platformCredentialId?: string;
};

export type PublishActivityResult = {
  success: boolean;
  externalId?: string;
  platformPostId?: string;
  url?: string;
  error?: string;
};

export type PlatformPublishJob = {
  postPlatformId: string;
  postId: string;
  teamId: string;
  userId: string;
  platform: string;
  content: string;
  mediaUrls: string[];
  platformCredentialId?: string;
};

export type PublishWorkflowInput = {
  postId: string;
  teamId: string;
  taskQueue?: string;
};
