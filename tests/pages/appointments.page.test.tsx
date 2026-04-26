import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AppointmentsPage from "@/app/appointments/page";
import { useBookAppointment, useUserAppointments } from "@/hooks/use-appointment";
import { toast } from "sonner";

jest.mock("@/components/Navbar", () => () => <div>Navbar</div>);

jest.mock("@/components/appointments/ProgressSteps", () => ({
  __esModule: true,
  default: ({ currentStep }: { currentStep: number }) => <div>Step {currentStep}</div>,
}));

jest.mock("@/components/appointments/DoctorSelectionStep", () => ({
  __esModule: true,
  default: ({ onContinue, onSelectDentist }: { onContinue: () => void; onSelectDentist: (id: string) => void }) => (
    <div>
      <button onClick={() => onSelectDentist("doc_1")} type="button">
        Select Dentist
      </button>
      <button onClick={onContinue} type="button">
        Continue Step 1
      </button>
    </div>
  ),
}));

jest.mock("@/components/appointments/TimeSelectionStep", () => ({
  __esModule: true,
  default: ({
    onContinue,
    onDateChange,
    onTimeChange,
    onTypeChange,
  }: {
    onContinue: () => void;
    onDateChange: (date: string) => void;
    onTimeChange: (time: string) => void;
    onTypeChange: (type: string) => void;
  }) => (
    <div>
      <button onClick={() => onDateChange("2026-05-01")} type="button">
        Set Date
      </button>
      <button onClick={() => onTimeChange("10:00 AM")} type="button">
        Set Time
      </button>
      <button onClick={() => onTypeChange("cleaning")} type="button">
        Set Type
      </button>
      <button onClick={onContinue} type="button">
        Continue Step 2
      </button>
    </div>
  ),
}));

jest.mock("@/components/appointments/BookingConfirmationStep", () => ({
  __esModule: true,
  default: ({ onConfirm }: { onConfirm: () => void }) => (
    <button onClick={onConfirm} type="button">
      Confirm Booking
    </button>
  ),
}));

jest.mock("@/components/appointments/AppointmentConfirmationModal", () => ({
  AppointmentConfirmationModal: ({
    open,
    appointmentDetails,
  }: {
    open: boolean;
    appointmentDetails: { doctorName: string };
  }) => (open ? <div>Appointment Confirmed: {appointmentDetails.doctorName}</div> : null),
}));

jest.mock("@/hooks/use-appointment", () => ({
  useBookAppointment: jest.fn(),
  useUserAppointments: jest.fn(),
}));

jest.mock("@/lib/utils", () => ({
  APPOINTMENT_TYPES: [
    {
      id: "cleaning",
      name: "Teeth Cleaning",
      duration: "30 min",
      price: "$50",
    },
  ],
}));

jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
  },
}));

describe("Appointments page", () => {
  const mockUseBookAppointment = useBookAppointment as jest.Mock;
  const mockUseUserAppointments = useUserAppointments as jest.Mock;
  const mockToastError = toast.error as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock | undefined) = jest.fn().mockResolvedValue({ ok: true });

    mockUseBookAppointment.mockReturnValue({
      isPending: false,
      mutate: jest.fn(),
    });

    mockUseUserAppointments.mockReturnValue({ data: [] });
  });

  it("renders page title and first step", () => {
    render(<AppointmentsPage />);

    expect(screen.getByText("Book an Appointment")).toBeInTheDocument();
    expect(screen.getByText("Step 1")).toBeInTheDocument();
  });

  it("shows upcoming appointments list", () => {
    mockUseUserAppointments.mockReturnValue({
      data: [
        {
          id: "apt_1",
          doctorImageUrl: "doctor.png",
          doctorName: "Dr. Jane",
          reason: "Checkup",
          date: "2026-05-01",
          time: "09:30 AM",
        },
      ],
    });

    render(<AppointmentsPage />);

    expect(screen.getByText("Your Upcoming Appointments")).toBeInTheDocument();
    expect(screen.getByText("Dr. Jane")).toBeInTheDocument();
  });

  it("shows validation error if required fields are missing", () => {
    render(<AppointmentsPage />);

    fireEvent.click(screen.getByText("Select Dentist"));
    fireEvent.click(screen.getByText("Continue Step 1"));
    fireEvent.click(screen.getByText("Continue Step 2"));
    fireEvent.click(screen.getByText("Confirm Booking"));

    expect(mockToastError).toHaveBeenCalledWith("Please fill in all required fields");
  });

  it("books an appointment and opens confirmation modal", async () => {
    const mutate = jest.fn((_: unknown, options: { onSuccess: (appointment: any) => void }) => {
      options.onSuccess({
        id: "apt_1",
        patientEmail: "patient@example.com",
        doctorName: "Dr. Jane",
        date: "2026-05-01",
        time: "09:30 AM",
      });
    });

    mockUseBookAppointment.mockReturnValue({
      isPending: false,
      mutate,
    });

    render(<AppointmentsPage />);

    fireEvent.click(screen.getByText("Select Dentist"));
    fireEvent.click(screen.getByText("Continue Step 1"));
    fireEvent.click(screen.getByText("Set Date"));
    fireEvent.click(screen.getByText("Set Time"));
    fireEvent.click(screen.getByText("Set Type"));
    fireEvent.click(screen.getByText("Continue Step 2"));
    fireEvent.click(screen.getByText("Confirm Booking"));

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/send-appointment-email",
        expect.objectContaining({ method: "POST" })
      );
    });

    expect(screen.getByText(/Appointment Confirmed: Dr. Jane/i)).toBeInTheDocument();
  });
});
