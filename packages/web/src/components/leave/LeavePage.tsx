import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LeaveTypes } from "@willdesign-hr/types";
import { Card, PageLayout, SectionTitle, TextMuted, FormField, FormLayout, ButtonAccent } from "../../theme/primitives";

export function LeavePage() {
  const { t } = useTranslation();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [leaveType, setLeaveType] = useState<string>(LeaveTypes.PAID);

  return (
    <PageLayout>
      <Card>
        <SectionTitle>{t("leave.newRequest")}</SectionTitle>
        <FormLayout>
          <FormField>
            <label htmlFor="leave-type">{t("leave.leaveType")}</label>
            <select id="leave-type" value={leaveType} onChange={(e) => setLeaveType(e.target.value)}>
              <option value={LeaveTypes.PAID}>{t("leave.paid")}</option>
              <option value={LeaveTypes.UNPAID}>{t("leave.unpaid")}</option>
              <option value={LeaveTypes.SHIFT_PERMISSION}>{t("leave.shiftPermission")}</option>
            </select>
          </FormField>
          <FormField>
            <label htmlFor="start-date">{t("leave.startDate")}</label>
            <input
              type="date"
              id="start-date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </FormField>
          <FormField>
            <label htmlFor="end-date">{t("leave.endDate")}</label>
            <input
              type="date"
              id="end-date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </FormField>
          <ButtonAccent type="submit">{t("leave.submit")}</ButtonAccent>
        </FormLayout>
      </Card>

      <Card>
        <SectionTitle>{t("leave.myRequests")}</SectionTitle>
        <TextMuted>{t("leave.noRequests")}</TextMuted>
      </Card>
    </PageLayout>
  );
}
