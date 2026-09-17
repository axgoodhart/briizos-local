// ConversationBrowser.jsx
import { useState, useRef, useEffect, useMemo, useId, Fragment } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Facet rows in the order Mockup B shows them. Glyphs are SF Symbols
// characters; the app never renders an SVG icon.
const FACETS = [
  { id: 'all', glyph: '􀋲', label: 'All' },
  { id: 'tags', glyph: '􀋡', label: 'Tags' },
  { id: 'date', glyph: '􀐫', label: 'Date' },
];

// Date buckets for the Date facet. They partition the whole timeline, so every
// conversation lands in exactly one of them.
export const CONVERSATION_DATE_BUCKETS = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
  { id: 'earlier', label: 'Earlier' },
];

// The quick editor is deliberately more generous than the auto-tagger: the
// model stops at MAX_TAGS_PER_THREAD (5), a person may keep 12.
const MAX_TAGS_FROM_EDITOR = 12;
const MAX_TAG_LENGTH = 48;

function dayStartOf(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

// Local-midnight boundaries, rebuilt from calendar arithmetic rather than
// millisecond offsets so a daylight-saving change cannot shift a row into the
// wrong bucket. Weeks start on Sunday, matching the calendar month grid.
function bucketBoundaries(now) {
  const today = dayStartOf(now);
  const week = dayStartOf(now);
  week.setDate(week.getDate() - week.getDay());
  const month = new Date(today.getFullYear(), today.getMonth(), 1);
  return {
    today: today.getTime(),
    week: week.getTime(),
    // When the 1st falls mid-week the month boundary would sit after the week
    // boundary and swallow the week bucket; clamping keeps them ordered.
    month: Math.min(month.getTime(), week.getTime()),
  };
}

// A conversation's date is the date of its last message, not the date its row
// last changed — editing a tag changes the row, and must not move the
// conversation between date buckets. This mirrors THREAD_ACTIVITY_AT in
// electron/local-data-service.js, which the date filter and list order use, so
// the bucket a row is counted in is always the bucket it is listed in.
function activityAtOf(conversation) {
  return Number(
    conversation?.lastMessageAt
    ?? conversation?.last_message_at
    ?? conversation?.createdAt
    ?? conversation?.created_at
    ?? 0,
  ) || 0;
}

export function conversationDateBucket(conversation, now = Date.now()) {
  const bounds = bucketBoundaries(now);
  const at = activityAtOf(conversation);
  if (at >= bounds.today) return 'today';
  if (at >= bounds.week) return 'week';
  if (at >= bounds.month) return 'month';
  return 'earlier';
}

// since/until for listThreads. The buckets are half-open ranges
// (since <= updated_at < until) so the four of them never double-count a row.
export function conversationDateRange(bucketId, now = Date.now()) {
  const bounds = bucketBoundaries(now);
  if (bucketId === 'today') return { since: bounds.today, until: undefined };
  if (bucketId === 'week') return { since: bounds.week, until: bounds.today };
  if (bucketId === 'month') return { since: bounds.month, until: bounds.week };
  if (bucketId === 'earlier') return { since: undefined, until: bounds.month };
  return { since: undefined, until: undefined };
}

// Facet counts are taken from the unfiltered list so the numbers keep telling
// the person what else is there, instead of collapsing to whatever the current
// filter already shows.
export function conversationDateCounts(conversations, now = Date.now()) {
  const counts = { all: 0, today: 0, week: 0, month: 0, earlier: 0 };
  for (const conversation of conversations || []) {
    counts.all += 1;
    counts[conversationDateBucket(conversation, now)] += 1;
  }
  return counts;
}

// Same normalisation the auto-tagger applies to model output, so a hand-typed
// tag and a model-proposed one can never differ by case or stray whitespace.
function normaliseTag(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, MAX_TAG_LENGTH);
}

function conversationTitleOf(conversation) {
  return conversation?.title?.trim() || 'Untitled conversation';
}

// Roving focus, same contract as ModelPicker's helper: arrows wrap, Home/End
// jump to the ends, and the caller decides whether focus also selects.
// ModelPicker walks event.currentTarget.parentElement; the browser's columns
// nest their rows (tag and date rows sit inside .conversation-facet-group, and
// every conversation row carries its own 􀋡 button), so the walk is scoped to a
// named column and a named row selector instead.
function moveRovingFocus(event, columnSelector, rowSelector, selectOnFocus = false) {
  const direction = {
    ArrowDown: 1,
    ArrowRight: 1,
    ArrowUp: -1,
    ArrowLeft: -1,
  }[event.key];
  const isBoundaryKey = event.key === 'Home' || event.key === 'End';
  if (!direction && !isBoundaryKey) return;

  const column = event.currentTarget.closest(columnSelector);
  if (!column) return;
  const items = [...column.querySelectorAll(rowSelector)].filter(item => !item.disabled);
  if (items.length === 0) return;
  event.preventDefault();

  const currentIndex = items.indexOf(event.currentTarget);
  const nextIndex = event.key === 'Home'
    ? 0
    : event.key === 'End'
      ? items.length - 1
      : (currentIndex + direction + items.length) % items.length;
  const nextItem = items[nextIndex];
  nextItem?.focus();
  if (selectOnFocus) nextItem?.click();
}

export default function ConversationBrowser({
  conversations = [],
  tagVocabulary = [],
  totals = null,
  activeThreadId = null,
  selectedThreadId = null,
  onSelect,
  onOpen,
  onNewConversation,
  onSetTags,
  onClose,
  search = '',
  onSearchChange,
  facet = 'all',
  onFacetChange,
  selectedTags = [],
  onToggleTag,
  dateBucket = null,
  onDateBucketChange,
  onClearFilters,
  loading = false,
  previewMessages = [],
  assistantName = 'briizOS',
}) {
  const [tagDraft, setTagDraft] = useState('');
  const [tagEditing, setTagEditing] = useState(false);
  const [tagHighlight, setTagHighlight] = useState(0);
  const browserId = useId();
  const listId = `${browserId}-list`;
  const tagAddRef = useRef(null);
  const tagInputRef = useRef(null);
  const previewScrollRef = useRef(null);

  const selected = conversations.find(conversation => conversation.id === selectedThreadId) || null;
  const selectedTitle = selected ? conversationTitleOf(selected) : '';
  const appliedTags = useMemo(() => (Array.isArray(selected?.tags) ? selected.tags : []), [selected]);
  const autoTags = useMemo(() => {
    const auto = selected?.tagState?.auto;
    return Array.isArray(auto) ? auto : [];
  }, [selected]);

  const counts = totals || { all: conversations.length, today: 0, week: 0, month: 0, earlier: 0 };
  const facetCounts = {
    all: counts.all,
    tags: tagVocabulary.length,
    date: null,
  };
  const filtersActive = !!search || selectedTags.length > 0 || !!dateBucket;

  // Group titles only appear while the person is thinking in date terms. Under
  // All or Tags the list stays flat, exactly as Mockup B shows it.
  const groupedConversations = useMemo(() => {
    if (facet !== 'date') return [{ id: null, label: null, rows: conversations }];
    const now = Date.now();
    return CONVERSATION_DATE_BUCKETS
      .map(bucket => ({
        id: bucket.id,
        label: bucket.label,
        rows: conversations.filter(conversation => conversationDateBucket(conversation, now) === bucket.id),
      }))
      .filter(group => group.rows.length > 0);
  }, [conversations, facet]);

  const tagSuggestions = useMemo(() => {
    const draft = normaliseTag(tagDraft);
    return tagVocabulary
      .filter(entry => !appliedTags.some(tag => normaliseTag(tag) === normaliseTag(entry.tag)))
      .filter(entry => !draft || normaliseTag(entry.tag).includes(draft));
  }, [tagVocabulary, appliedTags, tagDraft]);

  // A new preview starts at the top of the transcript rather than wherever the
  // previous one happened to be scrolled to.
  useEffect(() => {
    if (previewScrollRef.current) previewScrollRef.current.scrollTop = 0;
  }, [selectedThreadId]);

  // Switching conversations abandons a half-typed tag instead of carrying it
  // over to a conversation the person was not editing.
  useEffect(() => {
    setTagEditing(false);
    setTagDraft('');
    setTagHighlight(0);
  }, [selectedThreadId]);

  useEffect(() => {
    setTagHighlight(current => Math.min(current, Math.max(tagSuggestions.length - 1, 0)));
  }, [tagSuggestions.length]);

  useEffect(() => {
    if (tagEditing) tagInputRef.current?.focus();
  }, [tagEditing]);

  const cancelTagEditor = () => {
    setTagEditing(false);
    setTagDraft('');
    setTagHighlight(0);
  };

  const commitTag = (value) => {
    const tag = normaliseTag(value);
    cancelTagEditor();
    if (!tag || !selected) return;
    if (appliedTags.some(existing => normaliseTag(existing) === tag)) return;
    if (appliedTags.length >= MAX_TAGS_FROM_EDITOR) return;
    onSetTags(selected.id, [...appliedTags, tag]);
  };

  const removeTag = (tag) => {
    if (!selected) return;
    onSetTags(selected.id, appliedTags.filter(existing => existing !== tag));
  };

  const handleTagInputKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (tagSuggestions.length === 0) return;
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      setTagHighlight(current => (current + direction + tagSuggestions.length) % tagSuggestions.length);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      commitTag(tagSuggestions[tagHighlight]?.tag || tagDraft);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      cancelTagEditor();
      // The 􀅼 chip replaces the input on the next paint, so focus can only
      // return to it once that paint has happened.
      requestAnimationFrame(() => tagAddRef.current?.focus());
    }
  };

  // Escape closes the browser, the same way Escape closes the model dropdown.
  // The tag combobox swallows its own Escape first so cancelling an entry never
  // also collapses the panel.
  const handleBrowserKeyDown = (event) => {
    if (event.key !== 'Escape' || tagEditing) return;
    event.stopPropagation();
    onClose?.();
  };

  const handleRowKeyDown = (event, conversation) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      onOpen(conversation.id);
      return;
    }
    moveRovingFocus(event, '.conversation-list', '[role="option"]', true);
  };

  // The 􀋡 affordance on a row is a shortcut into the tag strip: it previews the
  // row it sits on and then parks focus on the add chip.
  const handleRowTagButton = (event, conversation) => {
    event.stopPropagation();
    onSelect(conversation.id);
    requestAnimationFrame(() => tagAddRef.current?.focus());
  };

  const renderFacetRow = (entry) => {
    const isActive = facet === entry.id;
    const hasGroup = entry.id !== 'all';
    const groupId = `${browserId}-${entry.id}-group`;
    const count = facetCounts[entry.id];
    return (
      <button
        type="button"
        key={entry.id}
        className={`conversation-facet ${isActive ? 'active' : ''}`}
        onClick={() => onFacetChange(entry.id)}
        onKeyDown={(event) => moveRovingFocus(event, '.conversation-facets', 'button')}
        tabIndex={isActive ? 0 : -1}
        aria-pressed={isActive}
        aria-expanded={hasGroup ? isActive : undefined}
        aria-controls={hasGroup && isActive ? `${listId} ${groupId}` : listId}
        title={entry.id === 'all'
          ? 'Show every saved conversation'
          : entry.id === 'tags'
            ? 'Filter by one or more tags'
            : 'Filter by when the conversation was last used'}
      >
        <span aria-hidden="true">{entry.glyph}</span>
        <span>{entry.label}</span>
        {count !== null && <span className="conversation-facet-count">{count}</span>}
      </button>
    );
  };

  return (
    <div className="conversation-browser" onKeyDown={handleBrowserKeyDown}>
      <div className="conversation-facets" role="group" aria-label="Filter conversations">
        <div className="conversation-search-cell" aria-hidden="true" />

        {renderFacetRow(FACETS[0])}

        {renderFacetRow(FACETS[1])}
        {facet === 'tags' && (
          <div id={`${browserId}-tags-group`} className="conversation-facet-group" role="group" aria-label="Tags">
            {tagVocabulary.map(entry => {
              const isOn = selectedTags.includes(entry.tag);
              return (
                <button
                  type="button"
                  key={entry.tag}
                  className={`conversation-facet-child ${isOn ? 'active' : ''}`}
                  onClick={() => onToggleTag(entry.tag)}
                  onKeyDown={(event) => moveRovingFocus(event, '.conversation-facets', 'button')}
                  tabIndex={-1}
                  aria-pressed={isOn}
                  title={isOn ? `Stop filtering by ${entry.tag}` : `Also filter by ${entry.tag}`}
                >
                  <span>{entry.tag}</span>
                  <span className="conversation-facet-child-count">{entry.count}</span>
                </button>
              );
            })}
            {tagVocabulary.length === 0 && (
              <div className="conversation-empty">No tags yet. Tags appear as conversations are labelled.</div>
            )}
          </div>
        )}

        {renderFacetRow(FACETS[2])}
        {facet === 'date' && (
          <div id={`${browserId}-date-group`} className="conversation-facet-group" role="group" aria-label="Date">
            {CONVERSATION_DATE_BUCKETS.map(bucket => {
              const isOn = dateBucket === bucket.id;
              return (
                <button
                  type="button"
                  key={bucket.id}
                  className={`conversation-facet-child ${isOn ? 'active' : ''}`}
                  onClick={() => onDateBucketChange(isOn ? null : bucket.id)}
                  onKeyDown={(event) => moveRovingFocus(event, '.conversation-facets', 'button')}
                  tabIndex={-1}
                  aria-pressed={isOn}
                  title={isOn ? `Stop limiting the list to ${bucket.label.toLowerCase()}` : `Limit the list to ${bucket.label.toLowerCase()}`}
                >
                  <span>{bucket.label}</span>
                  <span className="conversation-facet-child-count">{counts[bucket.id]}</span>
                </button>
              );
            })}
          </div>
        )}

        {filtersActive && (
          <button
            type="button"
            className="conversation-facet-clear"
            onClick={onClearFilters}
            onKeyDown={(event) => moveRovingFocus(event, '.conversation-facets', 'button')}
            tabIndex={-1}
            title="Show every saved conversation again"
          >
            <span aria-hidden="true">􀆄</span>
            <span>Clear filters</span>
          </button>
        )}
      </div>

      <div id={listId} className="conversation-list" role="listbox" aria-label="Saved conversations">
        <div className="conversation-search">
          <span aria-hidden="true">􀊫</span>
          <input
            type="text"
            className="conversation-search-input"
            placeholder="search anything"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            aria-label="Search saved conversations"
            aria-controls={listId}
          />
          {search && (
            <button
              type="button"
              className="conversation-search-clear"
              onClick={() => onSearchChange('')}
              title="Clear the search"
              aria-label="Clear the search"
            >
              􀆄
            </button>
          )}
          <button
            type="button"
            className="conversation-new"
            onClick={onNewConversation}
            title="Start a new conversation"
            aria-label="Start a new conversation"
          >
            􀅼
          </button>
        </div>

        {groupedConversations.map(group => (
          <Fragment key={group.id || 'all'}>
            {group.label && <div className="conversation-group-title">{group.label}</div>}
            {group.rows.map(conversation => {
              const isOpen = conversation.id === activeThreadId;
              const isSelected = conversation.id === selectedThreadId;
              return (
                <div
                  key={conversation.id}
                  className={`conversation-row ${isOpen ? 'active' : ''} ${isSelected ? 'selected' : ''}`}
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => onSelect(conversation.id)}
                  onDoubleClick={() => onOpen(conversation.id)}
                  onKeyDown={(event) => handleRowKeyDown(event, conversation)}
                  title={isOpen
                    ? `${conversationTitleOf(conversation)} — already open in the chat panel`
                    : `${conversationTitleOf(conversation)} — click to preview, double-click to open`}
                >
                  <span className="conversation-row-title">{conversationTitleOf(conversation)}</span>
                  <button
                    type="button"
                    className="conversation-row-tag-btn"
                    onClick={(event) => handleRowTagButton(event, conversation)}
                    tabIndex={-1}
                    title="Preview this conversation and edit its tags"
                    aria-label={`Edit tags for ${conversationTitleOf(conversation)}`}
                  >
                    􀋡
                  </button>
                </div>
              );
            })}
          </Fragment>
        ))}

        {conversations.length === 0 && (
          <div className="conversation-empty">
            {loading
              ? 'Reading saved conversations…'
              : filtersActive
                ? 'No saved conversation matches these filters. Clear them to see everything again.'
                : 'No saved conversations yet. Send a message and this list fills up.'}
          </div>
        )}
      </div>

      <div className="conversation-preview">
        <div className="interaction-toolbar-section-title" aria-hidden="true">
          <span>Preview</span>
        </div>

        <div className="conversation-preview-scroll" ref={previewScrollRef} role="log" aria-label={selected ? `Preview of ${selectedTitle}` : 'Conversation preview'}>
          {!selected && (
            <div className="conversation-preview-empty">
              Pick a conversation on the left to read it here. Nothing is opened or changed until you double-click it.
            </div>
          )}
          {selected && previewMessages.length === 0 && (
            <div className="conversation-preview-empty">
              This conversation has no saved messages yet.
            </div>
          )}
          {selected && previewMessages.map((message, index) => {
            const isUser = message.role === 'user';
            return (
              <div
                key={message.id || index}
                className={`conversation-preview-message ${isUser ? 'user' : 'assistant'}`}
              >
                {!isUser && (
                  <div className="conversation-preview-avatar" aria-hidden="true">
                    <span className="conversation-preview-avatar-glyph">􀌲</span>
                    <span className="conversation-preview-avatar-name">{assistantName}</span>
                  </div>
                )}
                <div className={`conversation-preview-bubble ${isUser ? '' : 'markdown-body'}`}>
                  {isUser ? message.content : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="conversation-tagbar" role="group" aria-label={selected ? `Tags for ${selectedTitle}` : 'Tags'}>
          <span className="conversation-tagbar-label" aria-hidden="true">􀋡</span>
          {appliedTags.map(tag => {
            const isAuto = autoTags.some(auto => normaliseTag(auto) === normaliseTag(tag));
            return (
              <span key={tag} className={`conversation-tag ${isAuto ? 'auto' : ''}`}>
                {isAuto && <span className="conversation-tag-auto-mark" aria-hidden="true" title="Added by the model">􀆿</span>}
                <span>{tag}</span>
                <button
                  type="button"
                  className="conversation-tag-remove"
                  onClick={() => removeTag(tag)}
                  title={isAuto
                    ? `Remove ${tag} — the model will not propose it for this conversation again`
                    : `Remove ${tag}`}
                  aria-label={`Remove tag ${tag}`}
                >
                  􀆄
                </button>
              </span>
            );
          })}

          {tagEditing ? (
            <>
              <input
                ref={tagInputRef}
                type="text"
                className="conversation-tag-input"
                value={tagDraft}
                maxLength={MAX_TAG_LENGTH}
                onChange={(event) => { setTagDraft(event.target.value); setTagHighlight(0); }}
                onKeyDown={handleTagInputKeyDown}
                onBlur={cancelTagEditor}
                role="combobox"
                aria-expanded={tagSuggestions.length > 0}
                aria-controls={tagSuggestions.length > 0 ? `${browserId}-tag-suggestions` : undefined}
                aria-autocomplete="list"
                aria-label="Add a tag"
                placeholder="add a tag"
              />
              {tagSuggestions.length > 0 && (
                <div id={`${browserId}-tag-suggestions`} className="conversation-tag-suggestions" role="listbox" aria-label="Existing tags">
                  {tagSuggestions.map((entry, index) => (
                    <button
                      type="button"
                      key={entry.tag}
                      className={`conversation-tag-suggestion ${index === tagHighlight ? 'active' : ''}`}
                      role="option"
                      aria-selected={index === tagHighlight}
                      tabIndex={-1}
                      // The combobox cancels on blur, so the pointer must not
                      // steal focus before the click lands.
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => commitTag(entry.tag)}
                      title={`Apply ${entry.tag}`}
                    >
                      <span>{entry.tag}</span>
                      <span className="conversation-tag-suggestion-count">{entry.count}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <button
              ref={tagAddRef}
              type="button"
              className="conversation-tag-add"
              onClick={() => setTagEditing(true)}
              disabled={!selected || appliedTags.length >= MAX_TAGS_FROM_EDITOR}
              title={!selected
                ? 'Pick a conversation first'
                : appliedTags.length >= MAX_TAGS_FROM_EDITOR
                  ? `This conversation already has the maximum of ${MAX_TAGS_FROM_EDITOR} tags`
                  : 'Add a tag to this conversation'}
              aria-label="Add a tag"
            >
              􀅼
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
