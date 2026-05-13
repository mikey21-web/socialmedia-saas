import { create } from 'zustand';
import { DashboardPost, AnalyticsMetrics, Trend, Recommendation } from '@/types/dashboard';

interface DashboardState {
  posts: DashboardPost[];
  metrics: AnalyticsMetrics | null;
  trends: Trend[];
  recommendations: Recommendation[];
  isLoading: boolean;

  setPosts: (posts: DashboardPost[]) => void;
  setMetrics: (metrics: AnalyticsMetrics) => void;
  setTrends: (trends: Trend[]) => void;
  setRecommendations: (recs: Recommendation[]) => void;
  setIsLoading: (loading: boolean) => void;
  fetchPosts: () => Promise<void>;
  fetchMetrics: (dateRange: string) => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  posts: [],
  metrics: null,
  trends: [],
  recommendations: [],
  isLoading: false,

  setPosts: (posts) => set({ posts }),
  setMetrics: (metrics) => set({ metrics }),
  setTrends: (trends) => set({ trends }),
  setRecommendations: (recs) => set({ recommendations: recs }),
  setIsLoading: (loading) => set({ isLoading: loading }),

  fetchPosts: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/posts`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('jwt_token')}` },
        },
      );
      const posts = await res.json();
      set({ posts });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMetrics: async (dateRange) => {
    set({ isLoading: true });
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analytics?range=${dateRange}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('jwt_token')}` },
        },
      );
      const metrics = await res.json();
      set({ metrics });
    } finally {
      set({ isLoading: false });
    }
  },
}));
