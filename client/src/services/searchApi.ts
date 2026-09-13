import apiClient from './apiClient';

export interface LabSearchHit {
  id: string;
  title: string;
  status: string;
  labGroupId: string;
  moduleId: string | null;
  milestoneId: string | null;
  courseId: string | null;
}

export interface MilestoneSearchHit {
  id: string;
  title: string;
  courseId: string | null;
}

export interface ModuleSearchHit {
  id: string;
  title: string;
  milestoneId: string | null;
  courseId: string | null;
}

export interface SearchResults {
  labs: LabSearchHit[];
  milestones: MilestoneSearchHit[];
  modules: ModuleSearchHit[];
}

export const searchApi = {
  global: async (q: string, limit = 8): Promise<SearchResults> =>
    (
      await apiClient.get<{ data: SearchResults }>(
        `/search?q=${encodeURIComponent(q)}&limit=${limit}`,
      )
    ).data.data,
};

export default searchApi;
