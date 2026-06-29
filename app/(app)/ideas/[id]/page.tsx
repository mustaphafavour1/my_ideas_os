export const dynamic = 'force-dynamic';

import { notFound, redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import { IdeaDetail } from '@/components/ideas/IdeaDetail';
import { createServiceClient } from '@/lib/supabase';
import { getUser } from '@/lib/auth';
import { Idea } from '@/lib/types';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function IdeaDetailPage({ params }: Props) {
  const user = await getUser();
  if (!user) redirect('/login');

  const { id } = await params;
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('ideas')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !data) notFound();

  const idea = data as Idea;

  // Fetch parent and children in parallel (best-effort, don't fail if columns missing)
  const [parentRes, childrenRes] = await Promise.all([
    idea.parent_idea_id
      ? supabase.from('ideas').select('id, title').eq('id', idea.parent_idea_id).eq('user_id', user.id).single()
      : Promise.resolve({ data: null }),
    supabase.from('ideas').select('id, title, status').eq('parent_idea_id', id).eq('user_id', user.id),
  ]);

  const parentIdea = (parentRes.data as Pick<Idea, 'id' | 'title'> | null) ?? null;
  const childIdeas = (childrenRes.data as Pick<Idea, 'id' | 'title' | 'status'>[] | null) ?? [];

  return (
    <div className="flex flex-col flex-1">
      <TopBar
        title={idea.title}
        subtitle={`${idea.status.replace(/_/g, ' ')} · ${idea.sector || 'no sector'}`}
      />
      <IdeaDetail initialIdea={idea} parentIdea={parentIdea} childIdeas={childIdeas} />
    </div>
  );
}
