// test/helpers/mockAuth.ts
export const createMockUser = (isAdmin = false) => ({
  _id: "user123",
  email: "test@example.com",
  name: "Test User",
  isAdmin
});

export const createMockRequest = (token?: string) => ({
  headers: token ? { authorization: `Bearer ${token}` } : {},
  user: undefined
});