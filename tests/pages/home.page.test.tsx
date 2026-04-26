import { render, screen } from "@testing-library/react";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Home from "@/app/page";
import { syncUser } from "@/lib/actions/users";

jest.mock("@/components/landing/Header", () => () => <div>Header</div>);
jest.mock("@/components/landing/Hero", () => () => <div>Hero</div>);
jest.mock("@/components/landing/HowItWorks", () => () => <div>How It Works</div>);
jest.mock("@/components/landing/WhatToAsk", () => () => <div>What To Ask</div>);
jest.mock("@/components/landing/PricingSection", () => () => <div>Pricing Section</div>);
jest.mock("@/components/landing/CTA", () => () => <div>CTA</div>);
jest.mock("@/components/landing/Footer", () => () => <div>Footer</div>);

jest.mock("@clerk/nextjs/server", () => ({
  currentUser: jest.fn(),
}));

jest.mock("@/lib/actions/users", () => ({
  syncUser: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

describe("Home page", () => {
  const mockCurrentUser = currentUser as jest.Mock;
  const mockSyncUser = syncUser as jest.Mock;
  const mockRedirect = redirect as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders landing sections for signed-out users", async () => {
    mockCurrentUser.mockResolvedValue(null);
    mockSyncUser.mockResolvedValue(undefined);

    render(await Home());

    expect(mockSyncUser).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Header")).toBeInTheDocument();
    expect(screen.getByText("Hero")).toBeInTheDocument();
    expect(screen.getByText("Pricing Section")).toBeInTheDocument();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("redirects signed-in users to dashboard", async () => {
    mockCurrentUser.mockResolvedValue({ id: "user_1" });
    mockSyncUser.mockResolvedValue(undefined);

    await expect(Home()).rejects.toThrow("NEXT_REDIRECT");

    expect(mockSyncUser).toHaveBeenCalledTimes(1);
    expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
  });
});
