import { useTranslation } from "react-i18next";
import { Card, PageLayout, SectionTitle, TextMuted } from "../../theme/primitives";

export function TeamPage() {
  const { t } = useTranslation();

  return (
    <PageLayout>
      <Card>
        <SectionTitle>{t("team.overview")}</SectionTitle>
        <TextMuted>{t("team.noMembers")}</TextMuted>
      </Card>

      <Card>
        <SectionTitle>{t("team.flags")}</SectionTitle>
        <TextMuted>{t("team.noFlags")}</TextMuted>
      </Card>

      <Card>
        <SectionTitle>{t("team.surplusBanking")}</SectionTitle>
        <TextMuted>{t("team.noSurplus")}</TextMuted>
      </Card>

      <Card>
        <SectionTitle>{t("team.missingReports")}</SectionTitle>
        <TextMuted>{t("team.allSubmitted")}</TextMuted>
      </Card>
    </PageLayout>
  );
}
