import { apiClient } from './client.js';
import type { ArchiveCampaignSummary, ArchiveEvent, ArchivePlanetSummary, ArchiveSummaryResponse, MajorOrderArchiveItem, PlanetHistoryResponse } from './archiveTypes.js';

export const archiveApi = {
  summary: () => apiClient.fetch<ArchiveSummaryResponse>('/api/archive/summary'),
  events: () => apiClient.fetch<{ events: ArchiveEvent[] }>('/api/archive/events?limit=100'),
  minorOrderEvents: () => apiClient.fetch<{ events: ArchiveEvent[] }>('/api/archive/events?eventType=minor_order_active&limit=100'),
  planets: () => apiClient.fetch<{ planets: ArchivePlanetSummary[] }>('/api/archive/planets?limit=200'),
  planetHistory: (planetId: number) => apiClient.fetch<PlanetHistoryResponse>(`/api/archive/planets/${planetId}?limit=500`),
  campaigns: () => apiClient.fetch<{ campaigns: ArchiveCampaignSummary[] }>('/api/archive/campaigns?limit=200'),
  majorOrders: () => apiClient.fetch<{ majorOrders: MajorOrderArchiveItem[] }>('/api/archive/major-orders?limit=100'),
};
