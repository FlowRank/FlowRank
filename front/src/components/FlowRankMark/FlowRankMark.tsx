type FlowRankMarkProps = {
  className?: string;
};

/** Trois vagues rouge, jaune, vert (bosse puis creux). */
const FlowRankMark: React.FC<FlowRankMarkProps> = ({
  className = "h-8 w-auto shrink-0 md:h-14",
}) => (
  <img
    src="/flowrank-mark.svg"
    alt=""
    aria-hidden
    className={className}
    draggable={false}
  />
);

export default FlowRankMark;
