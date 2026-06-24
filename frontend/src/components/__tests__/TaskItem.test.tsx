import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Task } from "@/lib/types";
import { TaskItem } from "../TaskItem";

const task: Task = { id: "1", title: "Write tests", completed: false, createdAt: new Date().toISOString() };

describe("TaskItem", () => {
  it("renders the task title", () => {
    render(<TaskItem task={task} onToggle={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText("Write tests")).toBeInTheDocument();
  });

  it("calls onToggle with the task id when the checkbox is clicked", () => {
    const onToggle = vi.fn();
    render(<TaskItem task={task} onToggle={onToggle} onDelete={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Mark task as complete" }));
    expect(onToggle).toHaveBeenCalledWith("1");
  });

  it("calls onDelete with the task id when delete is clicked", () => {
    const onDelete = vi.fn();
    render(<TaskItem task={task} onToggle={vi.fn()} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole("button", { name: "Delete task" }));
    expect(onDelete).toHaveBeenCalledWith("1");
  });

  it("shows a strikethrough style and the inverse toggle label when completed", () => {
    render(<TaskItem task={{ ...task, completed: true }} onToggle={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText("Write tests")).toHaveClass("line-through");
    expect(screen.getByRole("button", { name: "Mark task as incomplete" })).toBeInTheDocument();
  });
});
