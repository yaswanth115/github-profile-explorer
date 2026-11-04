import { AtSign, Building2, CalendarDays, ExternalLink, Link as LinkIcon, MapPin, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatNumber, safeUrl } from "@/lib/format";
import type { GitHubUser } from "@/types/github";

export function ProfileHeaderSkeleton() {
  return (
    <Card className="flex flex-col gap-4 p-6 sm:flex-row" aria-busy="true" aria-label="Loading profile">
      <Skeleton className="h-24 w-24 shrink-0 rounded-full" />
      <div className="flex-1 space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-full max-w-md" />
        <div className="flex gap-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </Card>
  );
}

function Meta({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="inline-flex items-center gap-1.5">
      <span className="text-muted-foreground" aria-hidden="true">
        {icon}
      </span>
      {children}
    </li>
  );
}

export function ProfileHeader({ user }: { user: GitHubUser }) {
  const blog = safeUrl(user.blog);
  const link = "text-primary hover:underline";
  return (
    <Card className="p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <img
          src={user.avatar_url}
          alt={`${user.login} avatar`}
          width={96}
          height={96}
          className="h-24 w-24 shrink-0 rounded-full border-2 border-border"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="text-2xl font-semibold">{user.name || user.login}</h2>
            <a href={user.html_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
              @{user.login}
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
              <span className="sr-only">(opens GitHub profile)</span>
            </a>
          </div>
          {user.bio && <p className="mt-2 max-w-2xl text-sm">{user.bio}</p>}
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
            {user.company && <Meta icon={<Building2 className="h-4 w-4" />}>{user.company}</Meta>}
            {user.location && <Meta icon={<MapPin className="h-4 w-4" />}>{user.location}</Meta>}
            {blog && (
              <Meta icon={<LinkIcon className="h-4 w-4" />}>
                <a href={blog} target="_blank" rel="noopener noreferrer" className={link}>
                  {user.blog}
                </a>
              </Meta>
            )}
            {user.twitter_username && (
              <Meta icon={<AtSign className="h-4 w-4" />}>
                <a href={`https://x.com/${encodeURIComponent(user.twitter_username)}`} target="_blank" rel="noopener noreferrer" className={link}>
                  @{user.twitter_username}
                </a>
              </Meta>
            )}
            <Meta icon={<CalendarDays className="h-4 w-4" />}>Joined {formatDate(user.created_at)}</Meta>
          </ul>
          <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <dt className="sr-only">Followers</dt>
              <dd>
                <strong className="tabular-nums">{formatNumber(user.followers)}</strong> <span className="text-muted-foreground">followers</span>
              </dd>
            </div>
            <div>
              <dt className="sr-only">Following</dt>
              <dd>
                <strong className="tabular-nums">{formatNumber(user.following)}</strong> <span className="text-muted-foreground">following</span>
              </dd>
            </div>
            <div>
              <dt className="sr-only">Public repositories</dt>
              <dd>
                <strong className="tabular-nums">{formatNumber(user.public_repos)}</strong> <span className="text-muted-foreground">public repos</span>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </Card>
  );
}
