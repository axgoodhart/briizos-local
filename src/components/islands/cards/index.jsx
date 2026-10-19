import TerminalCard from './TerminalCard';
import WebviewCard from './WebviewCard';
import ThoughtsCard from './ThoughtsCard';
import MediaCard from './MediaCard';
import AgentCard, { AgentFaceToggle } from './AgentCard';
import DocsCard from './DocsCard';
import GoalsCard from './GoalsCard';
import PlanningCard from './PlanningCard';
import ShipCard from './ShipCard';
import MonetizeCard from './MonetizeCard';

const BODIES = {
  terminal: TerminalCard,
  webview: WebviewCard,
  thoughts: ThoughtsCard,
  media: MediaCard,
  agent: AgentCard,
  docs: DocsCard,
  goals: GoalsCard,
  planning: PlanningCard,
  ship: ShipCard,
  monetize: MonetizeCard,
};

const HEADS = {
  agent: AgentFaceToggle,
};

export function CardHead(props) {
  const Head = HEADS[props.card.kind];
  return Head ? <Head {...props} /> : null;
}

export default function CardBody(props) {
  const Body = BODIES[props.card.kind] || DocsCard;
  return <Body {...props} />;
}
