import DriverSelectScreen from "@/src/components/DriverSelectScreen";
import ModeGuard from "@/src/components/ModeGuard";
export const metadata = {
  title: "Sürücü Seç | F1 Story",
  description: "Yarış modunda oynamak istediğin sürücüyü seç.",
};

export default function RaceModePage() {
  return(
  <ModeGuard requiredMode={1}>
    <DriverSelectScreen />
  </ModeGuard>
  )
}
