import axios from "axios";

describe("Auth Endpoints (E2E)", () => {
  const baseURL = "http://localhost:8009";
  const testUsername = "testuser_" + Date.now();
  const testPassword = "Password123";
  const registerCode = "9527";

  // Skipped by default as it requires the server to be running on localhost:8009
  it.skip("should successfully register a new user", async () => {
    const regRes = await axios.post(`${baseURL}/user/register`, {
      username: testUsername,
      password: testPassword,
      registerCode
    });
    
    expect(regRes.status).toBe(200);
    expect(regRes.data).toBeDefined();
    // Assuming a standard response format { code: 200, msg: "success" }
    expect(regRes.data.code).toBe(200);
  });

  it.skip("should successfully login with the registered user", async () => {
    const loginRes = await axios.post(`${baseURL}/user/login`, {
      username: testUsername,
      password: testPassword
    });
    
    expect(loginRes.status).toBe(200);
    expect(loginRes.data).toBeDefined();
    expect(loginRes.data.code).toBe(200);
    expect(loginRes.data.data).toHaveProperty("token");
  });
});
