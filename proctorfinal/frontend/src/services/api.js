import axios from "axios"

const api = axios.create({ baseURL: "/api", headers: { "Content-Type": "application/json" } })

api.interceptors.request.use(cfg => {
  const t = localStorage.getItem("access")
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})

api.interceptors.response.use(r => r, async err => {
  const orig = err.config
  if (err.response?.status === 401 && !orig._retry) {
    orig._retry = true
    const refresh = localStorage.getItem("refresh")
    if (refresh) {
      try {
        const { data } = await axios.post("/api/token/refresh/", { refresh })
        localStorage.setItem("access", data.access)
        orig.headers.Authorization = `Bearer ${data.access}`
        return api(orig)
      } catch {
        localStorage.clear()
        window.location.href = "/login"
      }
    }
  }
  return Promise.reject(err)
})

export const authAPI = {
  register: d => api.post("/register/", d),
  login:    d => api.post("/login/",    d),
  logout:   r => api.post("/logout/",   { refresh: r }),
  profile:  () => api.get("/profile/"),
  users:    () => api.get("/users/"),
}

export const examsAPI = {
  list:    ()          => api.get("/exams/"),
  get:     id          => api.get(`/exams/${id}/`),
  create:  d           => api.post("/exams/", d),
  update:  (id, d)     => api.patch(`/exams/${id}/`, d),
  delete:  id          => api.delete(`/exams/${id}/`),
  start:   examId      => api.post("/start-exam/",  { exam_id: examId }),
  submit:  (aid, score)=> api.post("/submit-exam/", { attempt_id: aid, score }),
  attempts:()          => api.get("/attempts/"),
}

export const violationsAPI = {
  report: d  => api.post("/violation/", d),
  list:   p  => api.get("/violations/", { params: p }),
  logs:   () => api.get("/logs/"),
}

export const reportsAPI = {
  overall: () => api.get("/report/"),
}

export const questionsAPI = {
  list:        examId    => api.get("/questions/",  { params: { exam_id: examId } }),
  create:      d         => api.post("/questions/", d),
  update:      (id, d)   => api.patch(`/questions/${id}/`, d),
  delete:      id        => api.delete(`/questions/${id}/`),
  submitAnswer:d         => api.post("/submit-answer/", d),
  answers:     params    => api.get("/answers/",   { params }),
  gradeAnswer: d         => api.post("/grade-answer/", d),
  myResult:    attemptId => api.get(`/my-result/${attemptId}/`),
}

export const resultsAPI = {
  finalise:   d         => api.post("/finalise-result/", d),
  list:       examId    => api.get("/results/",    { params: { exam_id: examId } }),
  leaderboard:examId    => api.get("/leaderboard/",{ params: { exam_id: examId } }),
  uploadFrame:fd        => api.post("/upload-frame/", fd, { headers: { "Content-Type": "multipart/form-data" } }),
  frames:     attemptId => api.get("/frames/",     { params: { attempt_id: attemptId } }),
}

export default api
