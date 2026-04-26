import { render, screen } from "@testing-library/react";
import DashboardPage from "@/app/dashboard/page";

jest.mock("@/components/Navbar", () => () => <div>Navbar</div>);
jest.mock("@/components/dashboard/WelcomeSection", () => () => <div>Welcome Section</div>);
jest.mock("@/components/dashboard/MainActions", () => () => <div>Main Actions</div>);
jest.mock("@/components/dashboard/ActivityOverview", () => () => <div>Activity Overview</div>);

describe("Dashboard page", () => {
  it("renders all dashboard sections", () => {
    render(<DashboardPage />);

    expect(screen.getByText("Navbar")).toBeInTheDocument();
    expect(screen.getByText("Welcome Section")).toBeInTheDocument();
    expect(screen.getByText("Main Actions")).toBeInTheDocument();
    expect(screen.getByText("Activity Overview")).toBeInTheDocument();
  });
});
