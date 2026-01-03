import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface TeamMember {
  id: string;
  site_id: string;
  user_id: string;
  role: 'viewer' | 'editor' | 'admin';
  invited_by: string | null;
  created_at: string;
  updated_at: string;
  full_name?: string;
  avatar_url?: string;
}

interface TeamInvitation {
  id: string;
  site_id: string;
  email: string;
  role: 'viewer' | 'editor' | 'admin';
  invited_by: string;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export function useTeam(siteId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const teamMembersQuery = useQuery({
    queryKey: ['team-members', siteId],
    queryFn: async () => {
      if (!siteId) return [];

      // First, get team members for this site
      const { data: members, error: membersError } = await supabase
        .from('team_members')
        .select('*')
        .eq('site_id', siteId)
        .order('created_at', { ascending: true });

      if (membersError) throw membersError;
      if (!members || members.length === 0) return [];

      // Use SECURITY DEFINER function to get only safe profile fields for teammates
      // This prevents email exposure through direct database queries
      const membersWithProfiles = await Promise.all(
        members.map(async (member) => {
          // If this is the current user, they can see their own profile directly
          if (member.user_id === user?.id) {
            const { data: ownProfile } = await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('id', member.user_id)
              .single();
            
            return {
              ...member,
              full_name: ownProfile?.full_name,
              avatar_url: ownProfile?.avatar_url,
            };
          }
          
          // For teammates, use the secure function that only returns safe fields
          const { data: profile } = await supabase
            .rpc('get_team_member_profile', { _user_id: member.user_id })
            .single();
          
          return {
            ...member,
            full_name: profile?.full_name,
            avatar_url: profile?.avatar_url,
          };
        })
      );

      return membersWithProfiles as TeamMember[];
    },
    enabled: !!siteId && !!user,
  });

  const invitationsQuery = useQuery({
    queryKey: ['team-invitations', siteId],
    queryFn: async () => {
      if (!siteId) return [];

      const { data, error } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('site_id', siteId)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TeamInvitation[];
    },
    enabled: !!siteId && !!user,
  });

  const inviteMember = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: 'viewer' | 'editor' | 'admin' }) => {
      if (!user || !siteId) throw new Error('Not authenticated or no site selected');

      // Generate invitation token
      const tokenBytes = new Uint8Array(32);
      crypto.getRandomValues(tokenBytes);
      const token = Array.from(tokenBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

      const { error } = await supabase
        .from('team_invitations')
        .insert({
          site_id: siteId,
          email,
          role,
          invited_by: user.id,
          token,
          expires_at: expiresAt,
        });

      if (error) throw error;
      return { token };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-invitations', siteId] });
    },
  });

  const updateMemberRole = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: 'viewer' | 'editor' | 'admin' }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('team_members')
        .update({ role })
        .eq('id', memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', siteId] });
    },
  });

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', siteId] });
    },
  });

  const cancelInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('team_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-invitations', siteId] });
    },
  });

  return {
    members: teamMembersQuery.data || [],
    invitations: invitationsQuery.data || [],
    isLoading: teamMembersQuery.isLoading || invitationsQuery.isLoading,
    error: teamMembersQuery.error || invitationsQuery.error,
    inviteMember,
    updateMemberRole,
    removeMember,
    cancelInvitation,
  };
}
