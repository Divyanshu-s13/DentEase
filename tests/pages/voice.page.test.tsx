import { render, screen } from "@testing-library/react";
import { auth } from "@clerk/nextjs/server";
import VoicePage from "@/app/voice/page";

jest.mock("@/components/Navbar", () => () => <div>Navbar</div>);
jest.mock("@/components/voice/WelcomeSection", () => () => <div>Voice Welcome</div>);
jest.mock("@/components/voice/FeatureCards", () => () => <div>Feature Cards</div>);
jest.mock("@/components/voice/VapiWidget", () => () => <div>Vapi Widget</div>);
jest.mock("@/components/voice/ProPlanRequired", () => () => <div>Pro Plan Required</div>);

jest.mock("@clerk/nextjs/server", () => ({
  auth: jest.fn(),
}));

describe("Voice page", () => {
  const mockAuth = auth as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders voice UI and checks plan entitlements", async () => {
    const has = jest.fn().mockReturnValue(false);
    mockAuth.mockResolvedValue({ has });

    render(await VoicePage());

    expect(has).toHaveBeenNthCalledWith(1, { plan: "ai_basic" });
    expect(has).toHaveBeenNthCalledWith(2, { plan: "ai_pro" });
    expect(screen.getByText("Voice Welcome")).toBeInTheDocument();
    expect(screen.getByText("Feature Cards")).toBeInTheDocument();
    expect(screen.getByText("Vapi Widget")).toBeInTheDocument();
  });
});
