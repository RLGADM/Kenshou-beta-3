// src/utils/userToken.ts
export function ensureUserToken(): string {
  let userToken = localStorage.getItem("userToken");
  if (!userToken || userToken === "undefined" || userToken.trim() === "") {
    userToken = crypto.randomUUID();
    localStorage.setItem("userToken", userToken);
    console.log("🆕 Nouveau userToken généré →", userToken);
  }
  return userToken;
}
