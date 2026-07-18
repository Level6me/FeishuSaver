import axios from "axios";

describe("Admin Endpoints (E2E)", () => {
  const baseURL = "http://localhost:8009";
  const commonUsername = "testcommon_" + Date.now();
  const adminUsername = "testadmin_" + Date.now();
  const password = "Password123";
  const commonCode = "9527";
  const adminCode = "230713";

  let commonToken = "";
  let adminToken = "";

  // Skipped by default as it requires the server to be running on localhost:8009
  describe.skip("Role based access and settings", () => {
    beforeAll(async () => {
      // 1. Register and login common user
      await axios.post(`${baseURL}/user/register`, { username: commonUsername, password, registerCode: commonCode });
      const commonLogin = await axios.post(`${baseURL}/user/login`, { username: commonUsername, password });
      commonToken = commonLogin.data.data.token;

      // 2. Register and login admin user
      await axios.post(`${baseURL}/user/register`, { username: adminUsername, password, registerCode: adminCode });
      const adminLogin = await axios.post(`${baseURL}/user/login`, { username: adminUsername, password });
      adminToken = adminLogin.data.data.token;
    });

    it("should prevent common users from accessing global settings", async () => {
      const res = await axios.get(`${baseURL}/setting/get`, {
        headers: { Authorization: `Bearer ${commonToken}` }
      });
      const { globalSetting } = res.data.data;
      expect(globalSetting).toBeNull();
    });

    it("should allow admins to access global settings", async () => {
      const res = await axios.get(`${baseURL}/setting/get`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const { globalSetting } = res.data.data;
      expect(globalSetting).not.toBeNull();
      expect(globalSetting).toBeDefined();
    });

    it("should allow admins to update global settings", async () => {
      // Fetch current
      const getRes = await axios.get(`${baseURL}/setting/get`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const { userSettings, globalSetting } = getRes.data.data;
      
      const originalPort = globalSetting.httpProxyPort;
      const newPort = originalPort === 7890 ? 7891 : 7890;
      globalSetting.httpProxyPort = newPort;

      // Update
      await axios.post(`${baseURL}/setting/save`, { userSettings, globalSetting }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      // Verify
      const getRes2 = await axios.get(`${baseURL}/setting/get`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      expect(getRes2.data.data.globalSetting.httpProxyPort).toBe(newPort);

      // Restore
      getRes2.data.data.globalSetting.httpProxyPort = originalPort;
      await axios.post(`${baseURL}/setting/save`, {
        userSettings: getRes2.data.data.userSettings,
        globalSetting: getRes2.data.data.globalSetting
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
    });
  });
});
