import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./hooks/useAuth";
import { Layout } from "./components/common/Layout";
import "./i18n/index";
import "./theme/theme.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

function Placeholder({ name }: { name: string }) {
  return <div className="wd-card"><h2>{name}</h2><p>Coming soon</p></div>;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Placeholder name="Dashboard" />} />
              <Route path="attendance" element={<Placeholder name="Attendance" />} />
              <Route path="leave" element={<Placeholder name="Leave" />} />
              <Route path="reports" element={<Placeholder name="Reports" />} />
              <Route path="payroll" element={<Placeholder name="Payroll" />} />
              <Route path="team" element={<Placeholder name="Team" />} />
              <Route path="admin" element={<Placeholder name="Admin" />} />
              <Route path="settings" element={<Placeholder name="Settings" />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
