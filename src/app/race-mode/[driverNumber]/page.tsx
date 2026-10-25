import ModeGuard from "@/src/components/ModeGuard";
import { RaceDecisionScreen } from "@/src/components/RaceDecisionScreen";

export const metadata = {
  title: "Yarış Sonucu | F1 Story",
  description: "F1 Story Yarış Modu Sonuç Ekranı",
};

export default function DynamicRaceModePage() {
  return(
  <ModeGuard requiredMode={1}>
    <RaceDecisionScreen />
  </ModeGuard>
  )

}
