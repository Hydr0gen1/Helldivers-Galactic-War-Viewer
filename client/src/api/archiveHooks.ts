import { useQuery } from '@tanstack/react-query';
import { archiveApi } from './archive.js';

export const useArchiveSummary = () => useQuery({ queryKey: ['archive-summary'], queryFn: archiveApi.summary, staleTime: 30000 });
export const useArchiveEvents = () => useQuery({ queryKey: ['archive-events'], queryFn: archiveApi.events, staleTime: 30000 });
export const useArchivePlanets = () => useQuery({ queryKey: ['archive-planets'], queryFn: archiveApi.planets, staleTime: 30000 });
export const useArchiveCampaigns = () => useQuery({ queryKey: ['archive-campaigns'], queryFn: archiveApi.campaigns, staleTime: 30000 });
export const useArchiveMajorOrders = () => useQuery({ queryKey: ['archive-major-orders'], queryFn: archiveApi.majorOrders, staleTime: 30000 });
export const useArchivePlanetHistory = (planetId: number | null) => useQuery({ queryKey: ['archive-planet-history', planetId], queryFn: () => archiveApi.planetHistory(planetId as number), enabled: planetId != null, staleTime: 30000 });
