import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Card, Tabs, Badge, ButtonAccent, ButtonSecondary, EmptyState } from "../ui";
import { usePolicies, useUpdateGroupPolicy } from "../../hooks/queries";
import { useToast } from "../ui/Toast";
import type { RawPolicy } from "@hr-attendance-app/types";

const POLICY_GROUPS = [
  "jp-fulltime", "jp-contract", "jp-gyoumu-itaku", "jp-parttime",
  "jp-sales", "jp-intern", "np-fulltime", "np-paid-intern", "np-unpaid-intern",
] as const;

const POLICY_DOMAINS = [
  { key: "hours", labelKey: "admin.policy.hours" },
  { key: "leave", labelKey: "admin.policy.leave" },
  { key: "overtime", labelKey: "admin.policy.overtime" },
  { key: "compensation", labelKey: "admin.policy.compensation" },
  { key: "probation", labelKey: "admin.policy.probation" },
  { key: "flags", labelKey: "admin.policy.flags" },
  { key: "payment", labelKey: "admin.policy.payment" },
  { key: "report", labelKey: "admin.policy.report" },
  { key: "salaryStatement", labelKey: "admin.policy.salaryStatement" },
] as const;

type DomainKey = typeof POLICY_DOMAINS[number]["key"];

export const PolicyTab = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const [selectedGroup, setSelectedGroup] = useState<string>(POLICY_GROUPS[0]);
  const [activeDomain, setActiveDomain] = useState<DomainKey>(POLICY_DOMAINS[0].key);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, unknown>>({});

  const { data: policyData, isLoading } = usePolicies(selectedGroup);
  const updatePolicy = useUpdateGroupPolicy();

  const rawPolicy = (policyData?.raw ?? {}) as RawPolicy;
  const isDeprecated = rawPolicy.deprecated === true;
  const domainData = (rawPolicy as unknown as Record<string, Record<string, unknown>>)[activeDomain];

  // Reset editing state when group or domain changes
  useEffect(() => {
    setEditing(false);
    setDraft({});
  }, [selectedGroup, activeDomain]);

  const handleEdit = useCallback(() => {
    setDraft({ ...(domainData ?? {}) });
    setEditing(true);
  }, [domainData]);

  const handleCancel = useCallback(() => {
    setEditing(false);
    setDraft({});
  }, []);

  const handleFieldChange = useCallback((key: string, value: unknown) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(() => {
    const updatedPolicy: RawPolicy = {
      ...rawPolicy,
      [activeDomain]: draft,
    };
    updatePolicy.mutate(
      { groupName: selectedGroup, policy: updatedPolicy },
      {
        onSuccess: () => {
          toast.show(t("admin.policy.saved"), "success");
          setEditing(false);
          setDraft({});
        },
        onError: (err) => toast.show(err.message, "danger"),
      },
    );
  }, [rawPolicy, activeDomain, draft, selectedGroup, updatePolicy, toast, t]);

  const getFieldDescription = (key: string): string | null => {
    const descKey = `admin.policy.fieldDesc.${key}`;
    const desc = t(descKey);
    // If the translation returns the key itself, there's no description
    return desc !== descKey ? desc : null;
  };

  const renderFieldValue = (key: string, value: unknown) => {
    if (!editing) {
      if (typeof value === "boolean") {
        return <Badge label={value ? t("common.yes") : t("common.no")} variant={value ? "success" : "info"} />;
      }
      if (Array.isArray(value)) {
        return <ReadOnlyValue>{value.length} {t("admin.policy.items")}</ReadOnlyValue>;
      }
      return <ReadOnlyValue>{String(value ?? "")}</ReadOnlyValue>;
    }

    // Editing mode — render inputs based on value type
    const draftValue = draft[key];
    if (typeof value === "boolean" || typeof draftValue === "boolean") {
      return (
        <ToggleButton
          type="button"
          $active={!!draftValue}
          onClick={() => handleFieldChange(key, !draftValue)}
        >
          {draftValue ? t("common.yes") : t("common.no")}
        </ToggleButton>
      );
    }
    if (typeof value === "number" || typeof draftValue === "number") {
      return (
        <FieldInput
          type="number"
          value={draftValue as number ?? 0}
          onChange={(e) => handleFieldChange(key, Number(e.target.value))}
        />
      );
    }
    if (Array.isArray(value) || Array.isArray(draftValue)) {
      return (
        <FieldInput
          type="text"
          value={JSON.stringify(draftValue ?? [])}
          onChange={(e) => {
            try { handleFieldChange(key, JSON.parse(e.target.value)); } catch { /* ignore invalid JSON */ }
          }}
          placeholder="JSON array"
        />
      );
    }
    return (
      <FieldInput
        type="text"
        value={String(draftValue ?? "")}
        onChange={(e) => handleFieldChange(key, e.target.value)}
      />
    );
  };

  return (
    <PolicyLayout>
      <GroupList>
        <GroupHeader>{t("admin.policy.groups")}</GroupHeader>
        {POLICY_GROUPS.map((group) => (
          <GroupButton
            key={group}
            $active={selectedGroup === group}
            onClick={() => setSelectedGroup(group)}
          >
            {group}
          </GroupButton>
        ))}
      </GroupList>

      <PolicyContent>
        {isDeprecated && (
          <DeprecatedBanner>
            <Badge label={t("admin.policy.deprecated")} variant="warning" />
            <DeprecatedText>{t("admin.policy.deprecatedHint")}</DeprecatedText>
          </DeprecatedBanner>
        )}

        <Tabs
          tabs={POLICY_DOMAINS.map((d) => ({ key: d.key, label: t(d.labelKey) }))}
          activeKey={activeDomain}
          onChange={(key) => setActiveDomain(key as DomainKey)}
        />

        {isLoading ? (
          <LoadingText>{t("common.loading")}</LoadingText>
        ) : !domainData || Object.keys(domainData).length === 0 ? (
          <EmptyState message={t("admin.policy.noData")} />
        ) : (
          <Card>
            <DomainGrid>
              {Object.entries(domainData).map(([key, value]) => {
                const description = getFieldDescription(key);
                return (
                  <DomainField key={key}>
                    <FieldHeader>
                      <FieldLabel>{key}</FieldLabel>
                      {description && <FieldDescription>{description}</FieldDescription>}
                    </FieldHeader>
                    <FieldValue>{renderFieldValue(key, value)}</FieldValue>
                  </DomainField>
                );
              })}
            </DomainGrid>
            <ActionRow>
              {editing ? (
                <>
                  <ButtonSecondary onClick={handleCancel}>
                    {t("common.cancel")}
                  </ButtonSecondary>
                  <ButtonAccent
                    disabled={updatePolicy.isPending}
                    onClick={handleSave}
                  >
                    {updatePolicy.isPending ? t("common.submitting") : t("common.submit")}
                  </ButtonAccent>
                </>
              ) : (
                <ButtonAccent onClick={handleEdit} disabled={isDeprecated}>
                  {t("admin.policy.edit")}
                </ButtonAccent>
              )}
            </ActionRow>
          </Card>
        )}
      </PolicyContent>
    </PolicyLayout>
  );
};

const PolicyLayout = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space.md};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
  }
`;

const GroupList = styled.div`
  width: 180px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.xs};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    width: 100%;
    flex-direction: row;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
`;

const GroupHeader = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.textMuted};
  padding: ${({ theme }) => theme.space.sm};
`;

const GroupButton = styled.button<{ $active: boolean }>`
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  border: none;
  background: ${({ theme, $active }) => $active ? theme.colors.selected : "transparent"};
  color: ${({ theme, $active }) => $active ? theme.colors.accent : theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme, $active }) => $active ? theme.fontWeights.semibold : theme.fontWeights.normal};
  cursor: pointer;
  border-radius: ${({ theme }) => theme.radii.sm};
  text-align: left;
  min-height: 44px;
  white-space: nowrap;
  transition: all ${({ theme }) => theme.transition};

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceHover};
  }
`;

const PolicyContent = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.md};
`;

const DeprecatedBanner = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  background: ${({ theme }) => theme.colors.warningLight};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.warning};
`;

const DeprecatedText = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.warning};
`;

const LoadingText = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  padding: ${({ theme }) => theme.space.lg};
`;

const DomainGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.space.lg};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;

const DomainField = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.xs};
`;

const FieldHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const FieldLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: capitalize;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`;

const FieldDescription = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xxs};
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.4;
  opacity: 0.8;
`;

const FieldValue = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text};
`;

const ReadOnlyValue = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
`;

const FieldInput = styled.input`
  padding: ${({ theme }) => theme.space.xs} ${({ theme }) => theme.space.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  min-height: 36px;
  width: 100%;
  transition: border-color ${({ theme }) => theme.transition};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.accent};
  }
`;

const ToggleButton = styled.button<{ $active: boolean }>`
  padding: ${({ theme }) => theme.space.xs} ${({ theme }) => theme.space.md};
  border: 1px solid ${({ theme, $active }) => $active ? theme.colors.success : theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme, $active }) => $active ? theme.colors.successLight : theme.colors.background};
  color: ${({ theme, $active }) => $active ? theme.colors.success : theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  min-height: 36px;
  transition: all ${({ theme }) => theme.transition};
`;

const ActionRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.space.sm};
  margin-top: ${({ theme }) => theme.space.md};
`;
