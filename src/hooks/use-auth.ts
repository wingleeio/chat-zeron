import { getAccessToken } from "@/lib/auth";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { useCallback, useEffect, useRef } from "react";
import { useMemo } from "react";

export function useAuth() {
  const context = useRouteContext({
    from: "__root__",
  });
  const data = useSuspenseQuery({
    queryKey: ["accessToken"],
    queryFn: getAccessToken,
    refetchInterval: 1000 * 60 * 3,
    refetchIntervalInBackground: true,
  });

  const lastToken = useRef<string | null>(null);

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      if (!forceRefreshToken && lastToken.current) {
        return lastToken.current;
      }
      const token = await getAccessToken();
      lastToken.current = token;
      return token;
    },
    [data.data]
  );

  useEffect(() => {
    if (data.data) {
      context.convexClient.setAuth(fetchAccessToken);
      context.convexQueryClient.serverHttpClient?.setAuth(data.data);
    }
  }, [data.data, fetchAccessToken, context]);

  return useMemo(() => {
    return {
      accessToken: data.data,
      isLoading: data.isLoading,
      isAuthenticated: Boolean(data.data),
      fetchAccessToken,
    };
  }, [data.data, data.isLoading, fetchAccessToken]);
}
