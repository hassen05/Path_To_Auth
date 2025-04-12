import { useAuth } from '../contexts/auth';

/**
 * A hook that provides access to the current session with loading state
 */
export function useSession() {
  const { session, initialized } = useAuth();

  return {
    session,
    isLoading: !initialized,
  };
}
