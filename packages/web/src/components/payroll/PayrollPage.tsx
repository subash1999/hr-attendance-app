import { useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Card, PageLayout, SectionTitle, FormField } from "../../theme/primitives";
import { isoToLocalMonth } from "../../utils/date";

const PayrollTable = styled.table`
  width: 100%;
  border-collapse: collapse;

  td {
    padding: ${({ theme }) => theme.space.sm};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }
`;

const AmountCell = styled.td`
  text-align: right;
  font-variant-numeric: tabular-nums;
`;

const TotalRow = styled.tr`
  td {
    font-weight: 700;
    border-top: 2px solid ${({ theme }) => theme.colors.text};
  }
`;

export function PayrollPage() {
  const { t } = useTranslation();
  const [month, setMonth] = useState(isoToLocalMonth(new Date().toISOString()));

  return (
    <PageLayout>
      <Card>
        <SectionTitle>{t("payroll.breakdown")}</SectionTitle>
        <FormField>
          <label htmlFor="payroll-month">{t("payroll.month")}</label>
          <input
            type="month"
            id="payroll-month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </FormField>
      </Card>

      <Card>
        <PayrollTable>
          <tbody>
            <tr>
              <td>{t("payroll.baseSalary")}</td>
              <AmountCell>—</AmountCell>
            </tr>
            <tr>
              <td>{t("payroll.overtime")}</td>
              <AmountCell>—</AmountCell>
            </tr>
            <tr>
              <td>{t("payroll.allowances")}</td>
              <AmountCell>—</AmountCell>
            </tr>
            <tr>
              <td>{t("payroll.deductions")}</td>
              <AmountCell>—</AmountCell>
            </tr>
            <TotalRow>
              <td>{t("payroll.netAmount")}</td>
              <AmountCell>—</AmountCell>
            </TotalRow>
          </tbody>
        </PayrollTable>
      </Card>
    </PageLayout>
  );
}
