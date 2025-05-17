import Loading from "@/components/loading/Loading";
import { Suspense } from "react";
import SettingsContent from "./SettingsContent";

export default function Settings() {
  return (
    <Suspense fallback={<Loading />}>
      <SettingsContent />
    </Suspense>
  );
}
