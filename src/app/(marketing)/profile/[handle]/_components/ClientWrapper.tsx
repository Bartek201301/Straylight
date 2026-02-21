'use client';

import React from 'react';
import ProfilePageContent from './ProfilePageContent';
import type { PublicProfile, Article } from '@/lib/supabase';

interface ClientWrapperProps {
  profile: PublicProfile;
  articles: Article[];
}

export default function ClientWrapper({
  profile,
  articles,
}: ClientWrapperProps) {
  return <ProfilePageContent profile={profile} articles={articles} />;
}
