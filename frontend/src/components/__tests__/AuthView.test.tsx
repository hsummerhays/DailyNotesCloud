import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthView } from "../AuthView";
import { useAuth } from "../../lib/AuthContext";

vi.mock("../../lib/AuthContext", () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

function setupAuth(overrides: Partial<ReturnType<typeof useAuth>> = {}) {
  const value = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    login: vi.fn().mockResolvedValue(undefined),
    signup: vi.fn().mockResolvedValue(undefined),
    loginWithGoogle: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn(),
    clearError: vi.fn(),
    ...overrides,
  };
  mockedUseAuth.mockReturnValue(value);
  return value;
}

describe("AuthView", () => {
  beforeEach(() => {
    mockedUseAuth.mockReset();
  });

  it("renders the sign-in form by default", () => {
    setupAuth();
    render(<AuthView />);

    expect(screen.getByText("Welcome Back")).toBeInTheDocument();
    expect(screen.queryByText("Display Name")).not.toBeInTheDocument();
  });

  it("toggles to sign-up mode and shows the display name field", () => {
    setupAuth();
    render(<AuthView />);

    fireEvent.click(screen.getByText("Don't have an account? Sign Up"));

    expect(screen.getByText("Create an Account")).toBeInTheDocument();
    expect(screen.getByText("Display Name")).toBeInTheDocument();
  });

  it("calls login with the entered credentials on submit", () => {
    const auth = setupAuth();
    render(<AuthView />);

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    expect(auth.login).toHaveBeenCalledWith("a@b.com", "password123");
  });

  it("calls signup with email, password, and display name in sign-up mode", () => {
    const auth = setupAuth();
    render(<AuthView />);

    fireEvent.click(screen.getByText("Don't have an account? Sign Up"));
    fireEvent.change(screen.getByPlaceholderText("John Doe"), { target: { value: "Alice" } });
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));

    expect(auth.signup).toHaveBeenCalledWith("a@b.com", "password123", "Alice");
  });

  it("does not submit when required fields are empty", () => {
    const auth = setupAuth();
    render(<AuthView />);

    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    expect(auth.login).not.toHaveBeenCalled();
  });

  it("shows the error message when login fails", async () => {
    setupAuth({ login: vi.fn().mockRejectedValue(new Error("Invalid email or password.")) });
    render(<AuthView />);

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "wrongpass" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    expect(await screen.findByText("Invalid email or password.")).toBeInTheDocument();
  });

  it("does not render the Google sign-in button when no client ID is configured", () => {
    setupAuth();
    render(<AuthView />);

    expect(screen.queryByText("OR")).not.toBeInTheDocument();
    expect(document.getElementById("google-signin-btn")).not.toBeInTheDocument();
  });
});
