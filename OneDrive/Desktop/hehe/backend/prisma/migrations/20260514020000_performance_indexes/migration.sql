-- Performance indexes for hot query paths

-- Posts queries: dashboard, calendar, analytics
CREATE INDEX IF NOT EXISTS "Post_teamId_createdAt_idx" ON "Post"("teamId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Post_teamId_status_scheduledAt_idx" ON "Post"("teamId", "status", "scheduledAt");
CREATE INDEX IF NOT EXISTS "Post_teamId_publishedAt_idx" ON "Post"("teamId", "scheduledAt" DESC) WHERE "status" = 'published';

-- AnalyticsEvent queries: dashboards, ROI
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_postId_collectedAt_idx" ON "AnalyticsEvent"("postId", "collectedAt" DESC);
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_eventType_collectedAt_idx" ON "AnalyticsEvent"("eventType", "collectedAt" DESC);

-- Notifications queries: unread count, list
CREATE INDEX IF NOT EXISTS "Notification_teamId_read_createdAt_idx" ON "Notification"("teamId", "read", "createdAt" DESC);

-- AgentRunLog: per-team agent metrics
CREATE INDEX IF NOT EXISTS "AgentRunLog_teamId_createdAt_idx" ON "AgentRunLog"("teamId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "AgentRunLog_teamId_status_idx" ON "AgentRunLog"("teamId", "status");

-- ApiUsageLog: admin observability dashboards
CREATE INDEX IF NOT EXISTS "api_usage_logs_team_id_created_at_idx" ON "api_usage_logs"("team_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "api_usage_logs_status_code_created_at_idx" ON "api_usage_logs"("status_code", "created_at" DESC);

-- AuditLog: lookup by team and time
CREATE INDEX IF NOT EXISTS "AuditLog_teamId_createdAt_idx" ON "AuditLog"("teamId", "createdAt" DESC);

-- ConversionEvent: ROI dashboard hot path
CREATE INDEX IF NOT EXISTS "conversion_event_teamId_createdAt_idx" ON "conversion_event"("teamId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "conversion_event_eventType_createdAt_idx" ON "conversion_event"("eventType", "createdAt" DESC);

-- UtmLink: short URL lookup
CREATE INDEX IF NOT EXISTS "utm_link_teamId_createdAt_idx" ON "utm_link"("teamId", "createdAt" DESC);

-- PerformanceInsight: most relevant insights
CREATE INDEX IF NOT EXISTS "performance_insight_teamId_isActive_confidence_idx" ON "performance_insight"("teamId", "isActive", "confidence" DESC);

-- ClientPortal: agency lookup
CREATE INDEX IF NOT EXISTS "client_portal_agencyTeamId_isActive_idx" ON "client_portal"("agencyTeamId", "isActive");

-- Posts with mediaUrls for video clip detection (if needed)
CREATE INDEX IF NOT EXISTS "Post_teamId_status_idx" ON "Post"("teamId", "status") WHERE "deletedAt" IS NULL;
