import { getAccessToken } from "@/lib/auth";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { useMemo } from "react";

export function useAuth() {
  const data = useSuspenseQuery({
    queryKey: ["accessToken"],
    queryFn: () => getAccessToken(),
    refetchInterval: 1000 * 60 * 2.5,
  });

  const fetchAccessToken = useCallback(async () => {
    return await getAccessToken();
  }, []);

  return useMemo(() => {
    return {
      accessToken: data.data,
      isLoading: false,
      isAuthenticated: !!data.data,
      fetchAccessToken,
    };
  }, [data.data, fetchAccessToken]);
}
