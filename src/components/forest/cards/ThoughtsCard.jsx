import { setAnswer, updateCardData } from '../store';
import { PROJECT_QUESTIONS } from '../catalog';
import { uid, whenShort } from '../util';
import { AddLine, EditableText } from './fields';

// The island's own questions; the same ones appear from the chat icon anywhere on the island.
export function ProjectQuestions({ island }) {
  return (
    <div className="fo-qa">
      {PROJECT_QUESTIONS.map((question) => (
        <div key={question} className="fo-qa__item">
          <span className="fo-qa__q">{question}</span>
          <EditableText value={island.answers[question] || ''} onCommit={(text) => setAnswer(island.id, question, text)} />
        </div>
      ))}
    </div>
  );
}

export default function ThoughtsCard({ island, card }) {
  const prompts = card.data.prompts || [];
  const answers = card.data.answers || {};
  const notes = card.data.notes || [];

  return (
    <div className="fo-thoughts">
      {prompts.length ? (
        <div className="fo-qa">
          {prompts.map((prompt) => (
            <div key={prompt} className="fo-qa__item">
              <span className="fo-qa__q">{prompt}</span>
              <EditableText
                value={answers[prompt] || ''}
                onCommit={(text) => updateCardData(island.id, card.id, (data) => ({ answers: { ...(data.answers || {}), [prompt]: text } }))}
              />
            </div>
          ))}
        </div>
      ) : (
        <ProjectQuestions island={island} />
      )}
      <div className="fo-notes">
        {notes.map((note) => (
          <div key={note.id} className="fo-notes__item">
            <EditableText
              value={note.text}
              onCommit={(text) => updateCardData(island.id, card.id, (data) => ({
                notes: text.trim() ? (data.notes || []).map((n) => (n.id === note.id ? { ...n, text } : n)) : (data.notes || []).filter((n) => n.id !== note.id),
              }))}
            />
            <span className="fo-whisper">{whenShort(note.at)}</span>
          </div>
        ))}
        <AddLine
          placeholder="Add a thought"
          onAdd={(text) => updateCardData(island.id, card.id, (data) => ({ notes: [...(data.notes || []), { id: uid('note'), at: new Date().toISOString(), text }] }))}
        />
      </div>
    </div>
  );
}
