import { render, screen } from "@testing-library/react";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AdminPage from "@/app/admin/page";

jest.mock("@/app/admin/AdminDashboardClient", () => () => <div>Admin Dashboard Client</div>);

jest.mock("@clerk/nextjs/server", () => ({
  currentUser: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

describe("Admin page", () => {
  const mockCurrentUser = currentUser as jest.Mock;
  const mockRedirect = redirect as jest.Mock;
  const originalAdminEmail = process.env.ADMIN_EMAIL;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ADMIN_EMAIL = "admin@example.com";
  });

  afterAll(() => {
    process.env.ADMIN_EMAIL = originalAdminEmail;
  });

  it("redirects guests to home", async () => {
    mockCurrentUser.mockResolvedValue(null);

    await expect(AdminPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/");
  });

  it("redirects non-admin users to dashboard", async () => {
    mockCurrentUser.mockResolvedValue({
      emailAddresses: [{ emailAddress: "user@example.com" }],
    });

    await expect(AdminPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
  });

  it("renders admin dashboard for admin user", async () => {
    mockCurrentUser.mockResolvedValue({
      emailAddresses: [{ emailAddress: "admin@example.com" }],
    });

    render(await AdminPage());

    expect(screen.getByText("Admin Dashboard Client")).toBeInTheDocument();
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
