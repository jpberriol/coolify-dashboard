import { QueryClient } from "@tanstack/react-query";

// Configure QueryClient with default options
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Disable refetch on window focus
      retry: 1, // Retry failed requests once
      staleTime: 5 * 60 * 1000, // Data stays fresh for 5 minutes
    },
  },
});
