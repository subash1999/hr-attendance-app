import { useTranslation } from "react-i18next";
import { Card, PageLayout, SectionTitle, TextMuted, FormField } from "../../theme/primitives";

const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
  { code: "ne", label: "नेपाली" },
] as const;

export function SettingsPage() {
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <PageLayout>
      <Card>
        <SectionTitle>{t("settings.profile")}</SectionTitle>
        <TextMuted>{t("settings.profileDesc")}</TextMuted>
      </Card>

      <Card>
        <SectionTitle>{t("settings.preferences")}</SectionTitle>
        <FormField>
          <label htmlFor="settings-language">{t("settings.language")}</label>
          <select
            id="settings-language"
            value={i18n.language}
            onChange={(e) => handleLanguageChange(e.target.value)}
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
        </FormField>
      </Card>
    </PageLayout>
  );
}
