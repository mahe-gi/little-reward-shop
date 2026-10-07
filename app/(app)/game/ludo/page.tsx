import { requireCouple } from "@/lib/permissions";
import { getLudoGame } from "@/actions/game";
import { LudoGameClient } from "@/components/game/LudoGameClient";

export const dynamic = "force-dynamic";

export default async function LudoPage() {
  const { user, partner } = await requireCouple();
  const res = await getLudoGame();

  return (
    <LudoGameClient
      gameId={res.data?.gameId || null}
      initialState={res.data?.state || null}
      currentUserId={user.id}
      partnerId={partner?.id || ""}
      userBalance={user.pointBalance}
    />
  );
}
