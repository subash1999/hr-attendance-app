import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Card, Badge, FormField, ButtonAccent, ButtonSecondary, Modal, EmptyState } from "../ui";
import { useToast } from "../ui/Toast";
import { useEmployees, useUpdateEmployee } from "../../hooks/queries";
import { EmploymentTypes, Regions, EmployeeStatuses } from "@hr-attendance-app/types";
import type { Employee } from "@hr-attendance-app/types";

const EMPLOYMENT_TYPE_OPTIONS = Object.values(EmploymentTypes);

export const EmployeesTab = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const { data: employees, isLoading } = useEmployees();
  const updateEmployee = useUpdateEmployee();
  const [editing, setEditing] = useState<Employee | null>(null);

  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formSlackId, setFormSlackId] = useState("");
  const [formRegion, setFormRegion] = useState("");
  const [formEmploymentType, setFormEmploymentType] = useState("");
  const [formLanguage, setFormLanguage] = useState("");

  const openEdit = useCallback((emp: Employee) => {
    setEditing(emp);
    setFormName(emp.name);
    setFormEmail(emp.email);
    setFormSlackId(emp.slackId);
    setFormRegion(emp.region);
    setFormEmploymentType(emp.employmentType);
    setFormLanguage(emp.languagePreference);
  }, []);

  const handleSave = useCallback(() => {
    if (!editing) return;
    updateEmployee.mutate(
      {
        id: editing.id,
        name: formName,
        email: formEmail,
        slackId: formSlackId,
        region: formRegion as Employee["region"],
        employmentType: formEmploymentType as Employee["employmentType"],
        languagePreference: formLanguage as Employee["languagePreference"],
      },
      {
        onSuccess: () => {
          toast.show(t("admin.employees.updated"), "success");
          setEditing(null);
        },
        onError: (err) => toast.show(err.message, "danger"),
      },
    );
  }, [editing, formName, formEmail, formSlackId, formRegion, formEmploymentType, formLanguage, updateEmployee, toast, t]);

  const activeEmployees = employees?.filter((e) => e.status === EmployeeStatuses.ACTIVE) ?? [];

  if (isLoading) return <Card><p>{t("common.loading")}</p></Card>;
  if (!activeEmployees.length) return <EmptyState message={t("admin.employees.none")} />;

  return (
    <>
      <EmployeeList>
        {activeEmployees.map((emp) => (
          <EmployeeRow key={emp.id}>
            <EmployeeInfo>
              <EmployeeName>{emp.name}</EmployeeName>
              <EmployeeMeta>{emp.email}</EmployeeMeta>
              <BadgeRow>
                <Badge label={t(`team.employmentType.${emp.employmentType}`)} variant="info" />
                <Badge label={t(`team.region.${emp.region}`)} variant="info" />
              </BadgeRow>
            </EmployeeInfo>
            <ButtonSecondary onClick={() => openEdit(emp)}>
              {t("admin.employees.edit")}
            </ButtonSecondary>
          </EmployeeRow>
        ))}
      </EmployeeList>

      <Modal
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        title={t("admin.employees.editTitle")}
      >
        <EditForm>
          <FormField>
            <label htmlFor="edit-name">{t("admin.onboard.name")}</label>
            <input id="edit-name" value={formName} onChange={(e) => setFormName(e.target.value)} />
          </FormField>
          <FormField>
            <label htmlFor="edit-email">{t("admin.onboard.email")}</label>
            <input id="edit-email" type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
          </FormField>
          <FormField>
            <label htmlFor="edit-slackId">{t("admin.onboard.slackId")}</label>
            <input id="edit-slackId" value={formSlackId} onChange={(e) => setFormSlackId(e.target.value)} />
          </FormField>
          <FormField>
            <label htmlFor="edit-region">{t("admin.onboard.region")}</label>
            <select id="edit-region" value={formRegion} onChange={(e) => setFormRegion(e.target.value)}>
              <option value={Regions.JP}>{t("team.region.JP")}</option>
              <option value={Regions.NP}>{t("team.region.NP")}</option>
            </select>
          </FormField>
          <FormField>
            <label htmlFor="edit-employmentType">{t("admin.onboard.employmentType")}</label>
            <select id="edit-employmentType" value={formEmploymentType} onChange={(e) => setFormEmploymentType(e.target.value)}>
              {EMPLOYMENT_TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>{t(`team.employmentType.${type}`)}</option>
              ))}
            </select>
          </FormField>
          <FormField>
            <label htmlFor="edit-language">{t("admin.onboard.language")}</label>
            <select id="edit-language" value={formLanguage} onChange={(e) => setFormLanguage(e.target.value)}>
              <option value="en">English</option>
              <option value="ja">日本語</option>
              <option value="ne">नेपाली</option>
            </select>
          </FormField>
          <ButtonRow>
            <ButtonSecondary onClick={() => setEditing(null)}>{t("common.cancel")}</ButtonSecondary>
            <ButtonAccent onClick={handleSave} disabled={updateEmployee.isPending}>
              {updateEmployee.isPending ? t("common.submitting") : t("common.submit")}
            </ButtonAccent>
          </ButtonRow>
        </EditForm>
      </Modal>
    </>
  );
};

const EmployeeList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.sm};
`;

const EmployeeRow = styled(Card)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space.md};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const EmployeeInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const EmployeeName = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`;

const EmployeeMeta = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const BadgeRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space.xs};
  margin-top: ${({ theme }) => theme.space.xs};
`;

const EditForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.md};
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.space.sm};
`;
