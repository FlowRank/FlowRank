import React from "react";

interface ConfirmProps {
  title: string;
  couleur?: "green" | "brown" | string;
  onClick: () => void;
  classNameAddon?: string;
}

const Confirm: React.FC<ConfirmProps> = ({ title, couleur = "green", onClick, classNameAddon = "" }) => {
  const colorClass =
    couleur === "green"
      ? "bg-emerald-500"
      : couleur === "brown"
      ? "bg-amber-800"
      : typeof couleur === "string"
      ? couleur
      : "bg-sky-600";

  return (
    <button
      type="button"
      className={`rounded-xl px-6 py-3 font-semibold text-white transition hover:opacity-90 ${colorClass} ${classNameAddon}`}
      onClick={onClick}
    >
      {title}
    </button>
  );
};

export default Confirm;
