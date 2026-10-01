"use client";

import { useParams } from "next/navigation";
import { BattleView } from "@/components/commons/Battle";
import { CommonsGate } from "@/components/commons/Gate";

export default function BattlePage() {
  return (
    <CommonsGate>
      <BattleView id={useParams<{ id: string }>().id} />
    </CommonsGate>
  );
}
