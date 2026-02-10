import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { listAgents, getAccountId } from "@/services/agentsService";
import type { Agent } from "@/types/agent";
import { ApiError } from "@/services/apiClient";

interface UseAgentsState {
  data: Agent[] | null;
  isLoading: boolean;
  error: ApiError | null;
}

export function useAgents() {
  const { user } = useAuth();
  const [state, setState] = useState<UseAgentsState>({
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let isSubscribed = true;

    const loadAgents = async () => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const accountId = getAccountId(user);
      if (!accountId) {
        if (!isSubscribed) return;
        setState({
          data: null,
          isLoading: false,
          error: new ApiError({ message: "No account ID found. Please ensure you are part of an account." }),
        });
        return;
      }

      try {
        const response = await listAgents(accountId);
        if (!isSubscribed) return;
        setState({ data: response.agents, isLoading: false, error: null });
      } catch (error) {
        if (!isSubscribed) return;
        setState({
          data: null,
          isLoading: false,
          error: error instanceof ApiError ? error : new ApiError({ message: "Failed to load agents" }),
        });
      }
    };

    void loadAgents();

    return () => {
      isSubscribed = false;
    };
  }, [user]);

  const refetch = () => {
    const accountId = getAccountId(user);
    if (!accountId) {
      setState({
        data: null,
        isLoading: false,
        error: new ApiError({ message: "No account ID found. Please ensure you are part of an account." }),
      });
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true }));
    listAgents(accountId)
      .then((response) => {
        setState({ data: response.agents, isLoading: false, error: null });
      })
      .catch((error) => {
        setState({
          data: null,
          isLoading: false,
          error: error instanceof ApiError ? error : new ApiError({ message: "Failed to load agents" }),
        });
      });
  };

  return {
    ...state,
    refetch,
  };
}


