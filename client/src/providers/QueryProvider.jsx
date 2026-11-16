import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./queryClient";
import { lazy, Suspense } from "react";

// Lazy load DevTools only in development to reduce bundle size
const ReactQueryDevtools =
  import.meta.env.DEV
    ? lazy(() =>
        import("@tanstack/react-query-devtools").then((module) => ({
          default: module.ReactQueryDevtools,
        }))
      )
    : null;

export const QueryProvider = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Lazy load DevTools only in development */}
      {import.meta.env.DEV && ReactQueryDevtools && (
        <Suspense fallback={null}>
          <ReactQueryDevtools initialIsOpen={false} />
        </Suspense>
      )}
    </QueryClientProvider>
  );
};
