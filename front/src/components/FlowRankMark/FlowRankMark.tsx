import React from "react";

type FlowRankMarkProps = {
  className?: string;
};

/** Trois vagues rouge, jaune, vert (bosse puis creux). */
const FlowRankMark: React.FC<FlowRankMarkProps> = ({
  className = "h-[2rem] w-auto shrink-0 md:h-14",
}) => (
  <svg
    className={className}
    viewBox="0 0 56 44"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <path
      d="M4 14 Q16 8 28 14 Q40 20 52 14"
      className="stroke-red-500"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M4 22 Q16 16 28 22 Q40 28 52 22"
      className="stroke-yellow-400"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M4 30 Q16 24 28 30 Q40 36 52 30"
      className="stroke-green-500"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export default FlowRankMark;
