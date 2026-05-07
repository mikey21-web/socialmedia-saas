import { render, screen } from "@testing-library/react";
import { FormSkeleton } from "@/components/FormSkeleton";

describe("FormSkeleton", () => {
  it("renders skeleton placeholders for configured field count", () => {
    const { container } = render(<FormSkeleton fieldCount={3} />);

    expect(screen.getByRole("status", { name: "Form is loading" })).toBeInTheDocument();
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(7);
  });

  it("renders with default field count", () => {
    const { container } = render(<FormSkeleton />);
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(9);
  });
});
