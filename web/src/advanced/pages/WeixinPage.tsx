import { QrCode } from "lucide-react";
import { PlatformPage } from "./PlatformPage";
import { Section } from "../../components/ui/Section";
import { WeixinQrRouteCBlock } from "../../components/WeixinQrRouteCBlock";
import { useI18n } from "../../lib/i18n";

export function WeixinPage() {
  const { t } = useI18n();
  return (
    <PlatformPage title={t("settings.weixinTitle")} desc={t("settings.weixinLead")}>
      <Section icon={QrCode} title={t("settings.weixinTitle")}>
        <WeixinQrRouteCBlock />
      </Section>
    </PlatformPage>
  );
}
