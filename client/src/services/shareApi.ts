import apiClient from './apiClient';

export type ShareKind = 'LAB_README' | 'COURSE_ROADMAP';

export interface Share {
  id: string;
  token: string;
  kind: ShareKind;
  refId: string;
  createdAt: string;
}

export interface CreatedShare extends Share {}

export interface PublicReadme {
  labId: string;
  title: string;
  source: 'inline' | 'link';
  html: string;
  requestedUrl: string;
  fetchedUrl: string;
  contentType: string;
  sourceLink: string;
}

export interface PublicRoadmapCourse {
  id: string;
  title: string;
  description: string;
  status: string;
}

export interface PublicRoadmapLab {
  id: string;
  title: string;
  description: string;
  order: number;
  status: string;
  estimatedTime: number;
}

export interface PublicRoadmapLabGroup {
  id: string;
  title: string;
  description: string;
  order: number;
  status: string;
  labs: PublicRoadmapLab[];
}

export interface PublicRoadmapModule {
  id: string;
  title: string;
  description: string;
  order: number;
  status: string;
  labGroups: PublicRoadmapLabGroup[];
}

export interface PublicRoadmapMilestone {
  id: string;
  title: string;
  description: string;
  order: number;
  status: string;
  modules: PublicRoadmapModule[];
}

export interface PublicRoadmap {
  course: PublicRoadmapCourse;
  milestones: PublicRoadmapMilestone[];
}

export const shareApi = {
  create: async (kind: ShareKind, refId: string): Promise<CreatedShare> =>
    (await apiClient.post<{ data: CreatedShare }>('/shares', { kind, refId })).data.data,

  list: async (params?: { kind?: ShareKind; refId?: string }): Promise<Share[]> =>
    (
      await apiClient.get<{ data: Share[] }>('/shares', {
        params: params as Record<string, string> | undefined,
      })
    ).data.data,

  revoke: async (id: string): Promise<{ id: string; revoked: true }> =>
    (await apiClient.delete<{ data: { id: string; revoked: true } }>(`/shares/${id}`)).data
      .data,

  // Public, unauthenticated endpoints.
  publicReadme: async (token: string): Promise<PublicReadme> =>
    (await apiClient.get<{ data: PublicReadme }>(`/public/readme/${token}`)).data.data,

  publicRoadmap: async (token: string): Promise<PublicRoadmap> =>
    (await apiClient.get<{ data: PublicRoadmap }>(`/public/roadmap/${token}`)).data.data,
};

export default shareApi;
