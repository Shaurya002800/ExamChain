import { Routes, Route, Navigate } from "react-router-dom";
import Landing          from "./pages/Landing";
import StudentLogin     from "./pages/StudentLogin";
import ExamRoom         from "./pages/ExamRoom";
import Results          from "./pages/Results";
import ExaminerDashboard from "./pages/ExaminerDashboard";
import AdminDashboard   from "./pages/AdminDashboard";
import Verify           from "./pages/Verify";

export default function App() {
  return (
    <Routes>
      <Route path="/"          element={<Landing />} />
      <Route path="/student"   element={<StudentLogin />} />
      <Route path="/exam/:id"  element={<ExamRoom />} />
      <Route path="/results"   element={<Results />} />
      <Route path="/examiner"  element={<ExaminerDashboard />} />
      <Route path="/admin"     element={<AdminDashboard />} />
      <Route path="/verify"    element={<Verify />} />
      <Route path="*"          element={<Navigate to="/" />} />
    </Routes>
  );
}