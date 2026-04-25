import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ErrorMessage from "../ErrorMessage";

describe("ErrorMessage", () => {
  it("renders the error message text", () => {
    render(<ErrorMessage message="Something went wrong" />);

    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
  });

  it("renders with role alert for accessibility", () => {
    render(<ErrorMessage message="Upload failed" />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
