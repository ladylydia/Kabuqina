import { Send } from "lucide-react";
import { PlatformPage } from "./PlatformPage";
import { Section } from "../../components/ui/Section";
import { TelegramSettingsBlock } from "../../components/TelegramSettingsBlock";
import { PairingSettingsBlock } from "../../components/PairingSettingsBlock";
import { useI18n } from "../../lib/i18n";

export function TelegramPage() {
  const { t } = useI18n();
  return (
    <PlatformPage title={t("settings.telegramTitle")} desc={t("settings.telegramLead")}>
      <Section icon={Send} title={t("settings.telegramTitle")}>
        <TelegramSettingsBlock />
      </Section>
      <Section title={t("settings.telegramPairingTitle")}>
        <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-500 mb-3">
          {t("settings.telegramPairingLead")}
        </p>
        <PairingSettingsBlock platform="telegram" />
      </Section>
    </PlatformPage>
  );
}
