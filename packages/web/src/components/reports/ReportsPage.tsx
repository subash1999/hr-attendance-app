import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, PageLayout, SectionTitle, TextMuted, FormField, FormLayout, ButtonAccent } from "../../theme/primitives";

export function ReportsPage() {
  const { t } = useTranslation();
  const [yesterday, setYesterday] = useState("");
  const [today, setToday] = useState("");
  const [blockers, setBlockers] = useState("");

  return (
    <PageLayout>
      <Card>
        <SectionTitle>{t("reports.dailyReport")}</SectionTitle>
        <FormLayout>
          <FormField>
            <label htmlFor="report-yesterday">{t("reports.yesterday")}</label>
            <textarea
              id="report-yesterday"
              rows={3}
              value={yesterday}
              onChange={(e) => setYesterday(e.target.value)}
              placeholder={t("reports.yesterdayPlaceholder")}
            />
          </FormField>
          <FormField>
            <label htmlFor="report-today">{t("reports.today")}</label>
            <textarea
              id="report-today"
              rows={3}
              value={today}
              onChange={(e) => setToday(e.target.value)}
              placeholder={t("reports.todayPlaceholder")}
            />
          </FormField>
          <FormField>
            <label htmlFor="report-blockers">{t("reports.blockers")}</label>
            <textarea
              id="report-blockers"
              rows={2}
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              placeholder={t("reports.blockersPlaceholder")}
            />
          </FormField>
          <ButtonAccent type="submit">{t("reports.submit")}</ButtonAccent>
        </FormLayout>
      </Card>

      <Card>
        <SectionTitle>{t("reports.history")}</SectionTitle>
        <TextMuted>{t("reports.noReports")}</TextMuted>
      </Card>
    </PageLayout>
  );
}
