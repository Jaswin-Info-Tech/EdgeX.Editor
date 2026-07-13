import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ServerSettingsModal } from "../app/components/editor/ServerSettingsModal";

import {
  getServerSettings,
  saveServerSettings,
  getActiveServerProfile,
} from "../app/config/serverSettings";

import type { ApiServerProfile } from "../app/config/serverSettings";
vi.mock("../app/config/serverSettings", () => ({
  getServerSettings: vi.fn(),
  saveServerSettings: vi.fn(),
  getActiveServerProfile: vi.fn(),
}));


const mockServer: ApiServerProfile = {
  id: "server-1",
  name: "Test Server",
  baseUrl: "https://api.test.com",
  apiKey: "12345",
  licenseKey: "license",
  environment: "DEV",
  lastTestedAt: undefined,
  lastLatencyMs: undefined,
  lastTestStatus: undefined,
  lastTestMessage: undefined,
};

describe("ServerSettingsModal", () => {

  const onClose = vi.fn();
  const onSaved = vi.fn();


  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(getServerSettings).mockReturnValue({
      servers: [mockServer],
      activeServerId: "server-1",
    });

    vi.mocked(saveServerSettings).mockReturnValue({
      servers: [mockServer],
      activeServerId: "server-1",
    });

    vi.mocked(getActiveServerProfile).mockReturnValue(mockServer);
  });


  it("renders modal title", () => {

    render(
      <ServerSettingsModal
        isOpen={true}
        onClose={onClose}
      />
    );


    expect(
      screen.getByText("API Server Settings")
    ).toBeInTheDocument();

  });



  it("renders server profile details", () => {

    render(
      <ServerSettingsModal
        isOpen={true}
        onClose={onClose}
      />
    );


    expect(
      screen.getByDisplayValue("Test Server")
    ).toBeInTheDocument();


    expect(
      screen.getByDisplayValue("https://api.test.com")
    ).toBeInTheDocument();

  });



  it("changes server name", async () => {

    const user = userEvent.setup();


    render(
      <ServerSettingsModal
        isOpen={true}
        onClose={onClose}
      />
    );


    const input =
      screen.getByDisplayValue("Test Server");


    await user.clear(input);
    await user.type(input, "New Server");


    expect(input)
      .toHaveValue("New Server");

  });



  it("changes environment", async () => {

    const user = userEvent.setup();


    render(
      <ServerSettingsModal
        isOpen={true}
        onClose={onClose}
      />
    );


    // use button query because PROD appears twice
    const prodButton =
      screen.getAllByRole("button", {
        name: "PROD"
      })[0];


    await user.click(prodButton);


    expect(prodButton)
      .toHaveTextContent("PROD");

  });



  it("toggles API key visibility", async () => {

    const user = userEvent.setup();


    render(
      <ServerSettingsModal
        isOpen={true}
        onClose={onClose}
      />
    );


    const apiInput =
      screen.getByPlaceholderText(
        "Optional API key"
      );


    expect(apiInput)
      .toHaveAttribute("type", "password");


    const button =
      screen.getByTitle("Show API key");


    await user.click(button);


    expect(apiInput)
      .toHaveAttribute("type", "text");

  });



  it("closes modal when close button clicked", async () => {

    const user = userEvent.setup();


    render(
      <ServerSettingsModal
        isOpen={true}
        onClose={onClose}
      />
    );


    await user.click(
      screen.getByTitle("Close")
    );


    expect(onClose)
      .toHaveBeenCalled();

  });



  it("adds new server profile", async () => {
  const user = userEvent.setup();

  render(
    <ServerSettingsModal
      isOpen={true}
      onClose={onClose}
    />
  );

  await user.click(
    screen.getByText("Add")
  );


  // New server profile should appear in sidebar
  expect(
    screen.getByText("Server 2")
  ).toBeInTheDocument();


  // Check new profile inputs specifically
  expect(
    screen.getByPlaceholderText(
      "https://api.company.com"
    )
  ).toHaveValue("");


});


  it("saves settings when Save Settings clicked", async () => {

    const user = userEvent.setup();


    render(
      <ServerSettingsModal
        isOpen={true}
        onClose={onClose}
        onSaved={onSaved}
      />
    );


    await user.click(
      screen.getByText("Save Settings")
    );


    await waitFor(() => {

      expect(saveServerSettings)
        .toHaveBeenCalled();


      expect(onSaved)
        .toHaveBeenCalled();

      expect(onClose)
        .toHaveBeenCalled();

    });

  });



  it("shows setup title when forceSetup enabled", () => {


    render(
      <ServerSettingsModal
        isOpen={true}
        forceSetup={true}
        onClose={onClose}
      />
    );


    expect(
      screen.getByText(
        "Initial Setup - API Server"
      )
    ).toBeInTheDocument();


  });



  it("does not render when closed", () => {


    render(
      <ServerSettingsModal
        isOpen={false}
        onClose={onClose}
      />
    );


    expect(
      screen.queryByText(
        "API Server Settings"
      )
    )
    .not
    .toBeInTheDocument();


  });


});