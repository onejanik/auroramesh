import { useState } from 'react';
import type { Poll } from '../types/poll';
import { ReportButton } from './ReportButton';

type Props = {
  poll: Poll;
};

export const PollCard = ({ poll }: Props) => {
  const [state, setState] = useState(poll);
  const [isVoting, setVoting] = useState(false);

  const totalVotes = state.options.reduce((sum, option) => sum + option.votes, 0);

  const vote = async (optionId: string) => {
    setVoting(true);
    try {
      const response = await fetch(`/api/polls/${state.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId })
      });
      if (!response.ok) {
        throw new Error('Abstimmung fehlgeschlagen');
      }
      const updated = (await response.json()) as Poll;
      setState(updated);
    } catch (error) {
      console.error(error);
    } finally {
      setVoting(false);
    }
  };

  return (
    <article className="card">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <strong>{state.author.name ?? 'Unbekannt'}</strong>
          <p style={{ margin: 0, color: 'var(--muted)' }}>{new Date(state.createdAt).toLocaleString()}</p>
        </div>
        <ReportButton targetType="poll" targetId={state.id} />
      </header>
      <h3>{state.question}</h3>
      <div className="poll-options">
        {state.options.map((option) => {
          const percentage = totalVotes ? Math.round((option.votes / totalVotes) * 100) : 0;
          const isSelected = state.viewerSelection === option.id;
          return (
            <button
              key={option.id}
              type="button"
              className={`poll-option ${isSelected ? 'is-selected' : ''}`}
              onClick={() => vote(option.id)}
              disabled={isVoting}
            >
              <span>{option.label}</span>
              <span>{percentage}%</span>
            </button>
          );
        })}
      </div>
      <small style={{ color: 'var(--muted)' }}>{totalVotes} Stimmen</small>
    </article>
  );
};

