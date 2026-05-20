import type { Poll, PollOption, WallPost } from '../types/wall.types';

const toStr = (v: unknown): string => (typeof v === 'string' ? v : '');

// normalizePollOption accepts the poll-level userVotedOptionId so it can set
// votedByMe correctly — the backend does not send a per-option flag.
const normalizePollOption = (raw: unknown, votedOptionId?: string): PollOption => {
  const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const id = toStr(r.id);
  return {
    id,
    text: toStr(
      r.text ??
      r.optionText ??
      r.option_text ??
      r.label ??
      r.name,
    ),
    // Backend sends votesCount (not voteCount / vote_count)
    voteCount:
      typeof r.voteCount === 'number'
        ? r.voteCount
        : typeof r.votesCount === 'number'
          ? r.votesCount
          : typeof r.vote_count === 'number'
            ? r.vote_count
            : 0,
    percentage: typeof r.percentage === 'number' ? r.percentage : 0,
    // votedByMe is derived from the poll-level userVotedOptionId field
    votedByMe:
      r.votedByMe === true ||
      r.voted_by_me === true ||
      r.hasVoted === true ||
      r.has_voted === true ||
      (votedOptionId != null && id !== '' && id === votedOptionId),
  };
};

export const normalizePoll = (raw: unknown): Poll | undefined => {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  // userVotedOptionId is the poll-level field the backend uses instead of
  // a per-option votedByMe flag.
  const votedOptionId =
    typeof r.userVotedOptionId === 'string' ? r.userVotedOptionId :
    typeof r.user_voted_option_id === 'string' ? r.user_voted_option_id :
    undefined;
  const optionsRaw =
    Array.isArray(r.options)
      ? r.options
      : Array.isArray(r.poll_options)
        ? r.poll_options
        : Array.isArray(r.pollOptions)
          ? r.pollOptions
          : [];
  const rawOptions = optionsRaw.map((o) => normalizePollOption(o, votedOptionId));
  // Backend does not send totalVotes at root; compute from option vote counts.
  const totalVotes =
    typeof r.totalVotes === 'number'
      ? r.totalVotes
      : typeof r.total_votes === 'number'
        ? r.total_votes
        : rawOptions.reduce((sum, o) => sum + o.voteCount, 0);
  // Recompute percentage from voteCount so it always stays in sync with the
  // counter (both derived from the backend's votesCount field).
  const options = rawOptions.map((opt) => ({
    ...opt,
    percentage: totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0,
  }));
  return {
    id: toStr(r.id),
    question: toStr(r.question ?? r.title),
    options,
    totalVotes,
    closed:
      r.closed === true ||
      r.isClosed === true ||
      r.is_closed === true,
    expiresAt:
      typeof r.expiresAt === 'string'
        ? r.expiresAt
        : typeof r.expires_at === 'string'
          ? r.expires_at
          : undefined,
    closedAt:
      typeof r.closedAt === 'string'
        ? r.closedAt
        : typeof r.closed_at === 'string'
          ? r.closed_at
          : undefined,
  };
};

export const normalizePostPoll = (post: WallPost): WallPost => {
  if (!post.poll) return post;
  const poll = normalizePoll(post.poll);
  return poll ? { ...post, poll } : post;
};
