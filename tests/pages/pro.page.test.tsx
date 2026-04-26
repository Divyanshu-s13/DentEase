import { render, screen } from "@testing-library/react";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ProPage from "@/app/pro/page";

jest.mock("@/components/Navbar", () => () => <div>Navbar</div>);
jest.mock("@/components/landing/PricingSection", () => () => <div>Pricing Section</div>);

jest.mock("@clerk/nextjs/server", () => ({
  currentUser: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

describe("Pro page", () => {
  const mockCurrentUser = currentUser as jest.Mock;
  const mockRedirect = redirect as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirects guests to home", async () => {
    mockCurrentUser.mockResolvedValue(null);

    await expect(ProPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/");
  });

  it("renders pricing content for logged in users", async () => {
    mockCurrentUser.mockResolvedValue({ id: "user_1" });

    render(await ProPage());

    expect(screen.getByText("Unlock Premium AI Dental Care")).toBeInTheDocument();
    expect(screen.getByText("Pricing Section")).toBeInTheDocument();
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
