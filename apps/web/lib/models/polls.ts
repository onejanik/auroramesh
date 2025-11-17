import { readOnlyDatabase, updateDatabase, type StoredPoll, type StoredPollVote } from '../db';
import type { Poll } from '../../types/poll';

type CreatePayload = {
  userId: number;
  question: string;
  options: string[];
};

const toPoll = (
  poll: StoredPoll,
  author: { id: number; name: string | null; avatar_url: string | null },
  viewerVotes?: StoredPollVote[]
): Poll => {
  const selection = viewerVotes?.find((vote) => vote.poll_id === poll.id)?.option_id ?? null;
  return {
    id: poll.id,
    question: poll.question,
    options: poll.options.map((option) => ({
      id: option.id,
      label: option.label,
      votes: option.votes
    })),
    createdAt: poll.created_at,
    author: {
      id: author.id,
      name: author.name,
      avatarUrl: author.avatar_url
    },
    viewerSelection: selection
  };
};

export const createPoll = ({ userId, question, options }: CreatePayload): Poll =>
  updateDatabase((db) => {
    const author = db.users.find((user) => user.id === userId);
    if (!author) throw new Error('User not found');
    const filtered = options.map((opt) => opt.trim()).filter((opt) => opt.length);
    if (filtered.length < 2) {
      throw new Error('Mindestens zwei Optionen werden benötigt');
    }
    const poll: StoredPoll = {
      id: ++db.counters.polls,
      user_id: userId,
      question: question.trim(),
      options: filtered.slice(0, 6).map((label, idx) => ({
        id: `${Date.now()}-${idx}-${Math.random().toString(16).slice(2, 6)}`,
        label,
        votes: 0
      })),
      created_at: new Date().toISOString()
    };
    db.polls.push(poll);
    return toPoll(poll, author, []);
  });

export const listPolls = (viewerId?: number, excludeUserId?: number, userId?: number): Poll[] => {
  const db = readOnlyDatabase();
  const viewerVotes = viewerId !== undefined ? db.poll_votes.filter((vote) => vote.user_id === viewerId) : undefined;
  return db.polls
    .filter((poll) => {
      // Filter by userId
      if (userId !== undefined && poll.user_id !== userId) return false;
      
      // Filter by excludeUserId
      if (excludeUserId && poll.user_id === excludeUserId) return false;
      
      // Privacy filter: check if viewer can see content from private accounts
      if (viewerId) {
        // Always show own polls
        if (poll.user_id === viewerId) return true;
        
        const author = db.users.find((u) => u.id === poll.user_id);
        if (!author) return false;
        
        // Check if author's account is private
        if (author.is_private) {
          // Check if viewer is following the author (approved follows only)
          const isFollowing = db.followers.some(
            (f) => f.follower_id === viewerId && f.following_id === poll.user_id && f.status === 'approved'
          );
          return isFollowing;
        }
      }
      
      return true;
    })
    .map((poll) => {
      const author = db.users.find((user) => user.id === poll.user_id);
      return author ? toPoll(poll, author, viewerVotes) : null;
    })
    .filter(Boolean) as Poll[];
};

export const votePoll = (pollId: number, optionId: string, userId: number) =>
  updateDatabase((db) => {
    const poll = db.polls.find((entry) => entry.id === pollId);
    if (!poll) {
      throw new Error('Poll not found');
    }
    const option = poll.options.find((opt) => opt.id === optionId);
    if (!option) {
      throw new Error('Option not found');
    }
    // Remove previous vote
    const existing = db.poll_votes.findIndex((vote) => vote.poll_id === pollId && vote.user_id === userId);
    if (existing !== -1) {
      const previousVote = db.poll_votes[existing];
      const previousOption = poll.options.find((opt) => opt.id === previousVote.option_id);
      if (previousOption && previousOption.votes > 0) {
        previousOption.votes -= 1;
      }
      db.poll_votes.splice(existing, 1);
    }

    option.votes += 1;
    const vote: StoredPollVote = {
      poll_id: pollId,
      user_id: userId,
      option_id: optionId,
      created_at: new Date().toISOString()
    };
    db.poll_votes.push(vote);

    const author = db.users.find((user) => user.id === poll.user_id);
    if (!author) {
      throw new Error('Author missing');
    }

    return toPoll(poll, author, db.poll_votes.filter((entry) => entry.user_id === userId));
  });

