import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Document endpoints
export const uploadDocument = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/v1/documents/upload', formData, {
    timeout: 120000, // 2 minutes for uploading larger files
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const listDocuments = () => api.get('/v1/documents')
export const getDocument = (id: number) => api.get(`/v1/documents/${id}`)
export const processDocument = (id: number) =>
  api.post(`/v1/documents/${id}/process`, null, {
    timeout: 180000, // 3 minutes for complete OCR + RAG + Pydantic Agent extraction
  })
export const getDocumentStatus = (id: number) => api.get(`/v1/documents/${id}/status`)

// Policy endpoints
export const getPolicies = () => api.get('/v1/policies')
export const listPolicies = () => api.get('/v1/policies')
export const getPolicy = (id: number) => api.get(`/v1/policies/${id}`)
export const getPolicyFields = (id: number) => api.get(`/v1/policies/${id}/fields`)
export const getPolicyClauses = (id: number) => api.get(`/v1/policies/${id}/clauses`)
export const getPolicyEvidence = (id: number) => api.get(`/v1/policies/${id}/evidence`)
export const getAllPolicyEvidences = () => api.get('/v1/policies/evidences/all')

// Comparison endpoints
export const createComparison = (policyAId: number, policyBId: number) =>
  api.post('/v1/comparisons', null, { params: { policy_a_id: policyAId, policy_b_id: policyBId } })
export const listComparisons = () => api.get('/v1/comparisons')
export const getComparison = (id: number) => api.get(`/v1/comparisons/${id}`)

// Report endpoints
export const generateReport = (comparisonId: number) =>
  api.post(`/v1/reports/comparison/${comparisonId}`)

// Logs & Settings
export const getLogs = () => api.get('/api/logs')
export const getSettings = () => api.get('/api/settings')