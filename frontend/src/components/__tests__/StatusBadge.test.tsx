import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusBadge } from "../StatusBadge";

describe("StatusBadge", () => {
  it("shows the connected label", () => {
    render(<StatusBadge status="connected" />);
    expect(screen.getByText("Backend Connected")).toBeInTheDocument();
  });

  it("shows the offline label", () => {
    render(<StatusBadge status="offline" />);
    expect(screen.getByText("Offline Mode (Local)")).toBeInTheDocument();
  });

  it("shows the connecting label", () => {
    render(<StatusBadge status="connecting" />);
    expect(screen.getByText("Connecting to API...")).toBeInTheDocument();
  });
});
