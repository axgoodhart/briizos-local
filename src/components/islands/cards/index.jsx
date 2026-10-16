import TerminalCard from './TerminalCard';
import WebviewCard from './WebviewCard';
import ThoughtsCard from './ThoughtsCard';
import MediaCard from './MediaCard';
import AgentCard from './AgentCard';
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

export default function CardBody(props) {
  const Body = BODIES[props.card.kind] || DocsCard;
  return <Body {...props} />;
}
