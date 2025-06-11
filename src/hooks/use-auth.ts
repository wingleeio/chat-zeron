import { getAccessToken } from "@/lib/auth";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { useCallback, useEffect } from "react";
import { useMemo } from "react";

export function useAuth() {
  const context = useRouteContext({
    from: "__root__",
  });
  const data = useSuspenseQuery({
    queryKey: ["accessToken"],
    queryFn: getAccessToken,
    refetchInterval: 1000 * 60 * 3,
  });

  const fetchAccessToken = useCallback(async () => {
    return data.data;
  }, [data.data]);

  useEffect(() => {
    if (data.data) {
      context.convexClient.setAuth(fetchAccessToken);
      context.convexQueryClient.serverHttpClient?.setAuth(data.data);
    }
  }, [data.data, fetchAccessToken, context]);

  return useMemo(() => {
    return {
      accessToken: data.data,
      isLoading: false,
      isAuthenticated: !!data.data,
      fetchAccessToken,
    };
  }, [data.data, fetchAccessToken]);
}
