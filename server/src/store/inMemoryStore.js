const store = {
  users: [],
  analyses: [],
};

function makeId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

export function getMemoryStore() {
  return store;
}

export function findMemoryUserByEmail(email) {
  const normalized = String(email || '').trim().toLowerCase();
  return store.users.find((user) => String(user.email).trim().toLowerCase() === normalized) || null;
}

export function findMemoryUserById(id) {
  return store.users.find((user) => String(user._id) === String(id)) || null;
}

export function createMemoryUser({ name, email, password }) {
  const user = {
    _id: makeId('user'),
    name: String(name || '').trim(),
    email: String(email || '').trim().toLowerCase(),
    password: String(password || ''),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.users.push(user);
  return user;
}

export function findMemoryAnalysesByUser(userId) {
  return [...store.analyses]
    .filter((analysis) => String(analysis.user) === String(userId))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function findMemoryAnalysisById(userId, analysisId) {
  return store.analyses.find(
    (analysis) => String(analysis.user) === String(userId) && String(analysis._id) === String(analysisId),
  ) || null;
}

export function deleteMemoryAnalysisById(userId, analysisId) {
  const index = store.analyses.findIndex(
    (analysis) => String(analysis.user) === String(userId) && String(analysis._id) === String(analysisId),
  );

  if (index === -1) {
    return null;
  }

  const [deleted] = store.analyses.splice(index, 1);
  return deleted;
}

export function createMemoryAnalysis(payload) {
  const analysis = {
    ...payload,
    _id: payload._id || makeId('analysis'),
    createdAt: payload.createdAt || new Date().toISOString(),
    updatedAt: payload.updatedAt || new Date().toISOString(),
  };

  store.analyses.push(analysis);
  return analysis;
}
