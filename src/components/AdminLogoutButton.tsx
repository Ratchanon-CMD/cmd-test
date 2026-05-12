"use client";

export function AdminLogoutButton() {
  async function handleClick() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  return (
    <button className="button-secondary" type="button" onClick={handleClick}>
      Logout
    </button>
  );
}
