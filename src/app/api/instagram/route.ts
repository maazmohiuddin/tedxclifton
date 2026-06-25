import { NextResponse } from "next/server";

export const revalidate = 3600; // cache 1 hour

export interface InstagramProfile {
  username: string;
  biography: string;
  followers_count: number;
  media_count: number;
  profile_picture_url: string;
  media: {
    id: string;
    media_url: string;
    thumbnail_url?: string;
    permalink: string;
    media_type: string;
    timestamp: string;
  }[];
}

const FALLBACK: InstagramProfile = {
  username: "tedxclifton",
  biography: "Independent TEDx event in Clifton, Karachi 🇵🇰\nIdeas Worth Spreading.",
  followers_count: 3314,
  media_count: 174,
  profile_picture_url: "",
  media: [],
};

export async function GET() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!token) {
    return NextResponse.json(FALLBACK);
  }

  try {
    // Fetch profile fields
    const profileRes = await fetch(
      `https://graph.instagram.com/me?fields=username,biography,followers_count,media_count,profile_picture_url&access_token=${token}`,
      { next: { revalidate: 3600 } }
    );

    if (!profileRes.ok) {
      return NextResponse.json(FALLBACK);
    }

    const profile = await profileRes.json();

    // Fetch recent media (up to 9 posts for grid)
    const mediaRes = await fetch(
      `https://graph.instagram.com/me/media?fields=id,media_url,thumbnail_url,permalink,media_type,timestamp&limit=9&access_token=${token}`,
      { next: { revalidate: 3600 } }
    );

    const mediaData = mediaRes.ok ? await mediaRes.json() : { data: [] };

    const result: InstagramProfile = {
      username: profile.username ?? "tedxclifton",
      biography: profile.biography ?? FALLBACK.biography,
      followers_count: profile.followers_count ?? FALLBACK.followers_count,
      media_count: profile.media_count ?? FALLBACK.media_count,
      profile_picture_url: profile.profile_picture_url ?? "",
      media: mediaData.data ?? [],
    };

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(FALLBACK);
  }
}
