export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase';
import { CommunityContent } from '@/components/community/CommunityContent';

export default async function CommunityPage() {
  const user = await getUser();
  if (!user) redirect('/login');

  const supabase = createServiceClient();
  const { data: profile } = await supabase
    .from('users')
    .select('display_username, show_on_leaderboard, avatar_url, full_name')
    .eq('id', user.id)
    .single();

  return (
    <CommunityContent
      me={{
        id: user.id,
        display_username: profile?.display_username ?? null,
        show_on_leaderboard: profile?.show_on_leaderboard ?? false,
        avatar_url: profile?.avatar_url ?? null,
        full_name: profile?.full_name ?? null,
      }}
    />
  );
}
