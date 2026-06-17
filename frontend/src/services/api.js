import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000",
  headers: { "Content-Type": "application/json" },
});

// Auto-attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const registerStudent  = (d) => api.post("/api/auth/student/register",  d);
export const loginStudent     = (d) => api.post("/api/auth/student/login",     d);
export const registerExaminer = (d) => api.post("/api/auth/examiner/register", d);
export const loginExaminer    = (d) => api.post("/api/auth/examiner/login",    d);

// Exams
export const createExam    = (d)  => api.post("/api/exams/create",         d);
export const listExams     = ()   => api.get("/api/exams/list");
export const getExam       = (id) => api.get(`/api/exams/${id}`);
export const lockExam      = (id) => api.post(`/api/exams/${id}/lock`);

// Questions
export const uploadQuestions = (d) => api.post("/api/questions/upload", d);
export const listQuestions   = (examId) => api.get(`/api/questions/${examId}/list`);

// Sessions
export const startSession  = (d)  => api.post("/api/sessions/start",  d);
export const getSessionQuestions = (id) => api.get(`/api/sessions/${id}/questions`);
export const submitAnswer  = (d)  => api.post("/api/sessions/answer", d);
export const endSession    = (id) => api.post(`/api/sessions/end?session_id=${id}`);
export const getSession    = (id) => api.get(`/api/sessions/${id}`);

// Results
export const certifyResult    = (d)  => api.post("/api/results/certify",          d);
export const getPendingResults= (examId) => api.get(`/api/results/pending/${examId}`);
export const reviewResult     = (sessionId, d) => api.post(`/api/results/review/${sessionId}`, d);
export const getStudentResults= (id) => api.get(`/api/results/student/${id}`);
export const verifyCredential = (params) => api.get("/api/results/verify", { params });

// Blockchain
export const blockchainStatus  = ()       => api.get("/api/blockchain/status");
export const recentTransactions= ()       => api.get("/api/blockchain/transactions/recent");
export const verifyOnChain     = (params) => api.get("/api/blockchain/verify-credential", { params });

// Agents
export const getAgentStatus  = (examId)     => api.get(`/api/agents/status/${examId}`);
export const getIntegrityFlags= (examId)    => api.get(`/api/agents/flags/${examId}`);
export const recordBrowserEvent= (d)        => api.post("/api/agents/browser-event", d);
export const getSessionRisk  = (sessionId)  => api.get(`/api/agents/session-risk/${sessionId}`);

export default api;
