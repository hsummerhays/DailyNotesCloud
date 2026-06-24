import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NoteForm } from "../NoteForm";

describe("NoteForm", () => {
  it("submits trimmed fields and parsed tags, then clears the form", () => {
    const onSubmit = vi.fn();
    render(<NoteForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByPlaceholderText("Note Title"), { target: { value: "My note" } });
    fireEvent.change(screen.getByPlaceholderText("Write your note content here..."), {
      target: { value: "Body" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Tags/), { target: { value: " gcp , docker ,," } });
    fireEvent.click(screen.getByRole("button", { name: "Save Note" }));

    expect(onSubmit).toHaveBeenCalledWith({ title: "My note", content: "Body", tags: ["gcp", "docker"] });
    expect(screen.getByPlaceholderText("Note Title")).toHaveValue("");
  });

  it("does not submit when the title is blank", () => {
    const onSubmit = vi.fn();
    render(<NoteForm onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole("button", { name: "Save Note" }));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
