const API_KEY = import.meta.env.VITE_API_KEY;
const BASE_URL = "https://solve.ivy.homes";

export async function apiFetch(endpoint, options = {}) {
  let token = sessionStorage.getItem("access_token");

  const headers = {
    "Content-Type": "application/json",
    "X-API-Key": API_KEY,
    ...options.headers,
  };

  if (token) headers["Authorization"] = `Bearer ${token}`;

  let response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });

  // Token refresh trap logic
  if (response.status === 401 && sessionStorage.getItem("refresh_token")) {
    const refreshResponse = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY,
        Authorization: `Bearer ${sessionStorage.getItem("refresh_token")}`,
      },
    });

    if (refreshResponse.ok) {
      const data = await refreshResponse.json();
      sessionStorage.setItem("access_token", data.access_token);
      sessionStorage.setItem("refresh_token", data.refresh_token);

      headers["Authorization"] = `Bearer ${data.access_token}`;
      response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
    } else {
      sessionStorage.clear();
      window.location.href = "/login";
    }
  }

  return response;
}
