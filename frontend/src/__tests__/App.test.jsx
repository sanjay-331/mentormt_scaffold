import { render, screen, waitFor } from "@testing-library/react";
import App from "../App";
import api from "../services/api";
import { vi } from "vitest";

vi.spyOn(api, "get").mockResolvedValue({ data: { ping: "pong" } });

test("renders and shows ping", async () => {
  render(<App />);
  await waitFor(() => expect(screen.getByText(/Backend ping:/)).toBeDefined());
  expect(screen.getByText("pong")).toBeDefined();
});
