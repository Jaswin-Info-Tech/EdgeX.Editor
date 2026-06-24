import type { LibraryItem, Plugin } from "../types/editor";

export const BASE_LIBRARY: LibraryItem[] = [
  { id: "lb1", name: "Set Frequency", category: "RF Instruments", type: "rf", description: "Set center frequency on signal analyzer",
    defaultProps: [
      { key: "freq", label: "Center Frequency", type: "frequency", value: 2400000000, unit: "Hz", group: "RF Parameters" },
      { key: "span", label: "Span", type: "frequency", value: 100000000, unit: "Hz", group: "RF Parameters" },
      { key: "rbw", label: "Resolution BW", type: "frequency", value: 1000000, unit: "Hz", group: "RF Parameters" },
      { key: "ref_level", label: "Reference Level", type: "number", value: 10, unit: "dBm", group: "RF Parameters" },
    ]},
  { id: "lb2", name: "Measure Power", category: "RF Instruments", type: "measure", description: "Measure average power level",
    defaultProps: [
      { key: "averages", label: "Averages", type: "number", value: 10, group: "Measurement" },
      { key: "expected", label: "Expected Power", type: "number", value: -10.0, unit: "dBm", group: "Limits" },
      { key: "tolerance", label: "Tolerance ±", type: "number", value: 2.0, unit: "dB", group: "Limits" },
      { key: "on_fail", label: "Verdict on Fail", type: "enum", value: "Fail", options: ["Fail", "Inconclusive", "Pass"], group: "Limits" },
    ]},
  { id: "lb3", name: "Set Attenuation", category: "RF Instruments", type: "rf", description: "Set attenuator level",
    defaultProps: [
      { key: "atten", label: "Attenuation", type: "number", value: 0, unit: "dB", group: "Parameters" },
      { key: "port", label: "Port", type: "enum", value: "RF1", options: ["RF1", "RF2", "RF3", "RF4"], group: "Parameters" },
    ]},
  { id: "lb4", name: "Sweep Frequency", category: "RF Instruments", type: "rf", description: "Sweep across a frequency range",
    defaultProps: [
      { key: "start", label: "Start Frequency", type: "frequency", value: 1000000000, unit: "Hz", group: "Sweep" },
      { key: "stop", label: "Stop Frequency", type: "frequency", value: 3000000000, unit: "Hz", group: "Sweep" },
      { key: "points", label: "Points", type: "number", value: 401, group: "Sweep" },
    ]},
  { id: "lb5", name: "Verify Harmonics", category: "RF Instruments", type: "measure", description: "Measure and verify harmonic levels",
    defaultProps: [
      { key: "limit", label: "Harmonic Limit", type: "number", value: -40, unit: "dBc", group: "Limits" },
      { key: "order", label: "Max Harmonic Order", type: "number", value: 3, group: "Measurement" },
    ]},
  { id: "lb6", name: "Ping Host", category: "Network", type: "network", description: "Send ICMP ping to target host",
    defaultProps: [
      { key: "host", label: "Host / IP", type: "string", value: "192.168.1.1", group: "Target" },
      { key: "count", label: "Ping Count", type: "number", value: 4, group: "Parameters" },
      { key: "timeout", label: "Timeout", type: "number", value: 1000, unit: "ms", group: "Parameters" },
      { key: "max_rtt", label: "Max RTT", type: "number", value: 5, unit: "ms", group: "Limits" },
    ]},
  { id: "lb7", name: "Check Latency", category: "Network", type: "network", description: "Measure round-trip network latency",
    defaultProps: [
      { key: "threshold", label: "Latency Threshold", type: "number", value: 5, unit: "ms", group: "Limits" },
      { key: "samples", label: "Sample Count", type: "number", value: 100, group: "Parameters" },
    ]},
  { id: "lb8", name: "TCP Connect", category: "Network", type: "network", description: "Verify TCP connection to endpoint",
    defaultProps: [
      { key: "host", label: "Host / IP", type: "string", value: "192.168.1.1", group: "Target" },
      { key: "port", label: "TCP Port", type: "number", value: 443, group: "Target" },
      { key: "timeout", label: "Connect Timeout", type: "number", value: 3000, unit: "ms", group: "Parameters" },
    ]},
  { id: "lb9", name: "Delay", category: "Flow Control", type: "flow", description: "Wait for a specified duration",
    defaultProps: [
      { key: "delay", label: "Delay Duration", type: "number", value: 500, unit: "ms", group: "Parameters" },
      { key: "log", label: "Log Wait Message", type: "boolean", value: true, group: "Options" },
    ]},
  { id: "lb10", name: "Repeat", category: "Flow Control", type: "sequence", description: "Repeat child steps N times",
    defaultProps: [
      { key: "count", label: "Repeat Count", type: "number", value: 3, group: "Parameters" },
      { key: "break_on_fail", label: "Break on Fail", type: "boolean", value: false, group: "Parameters" },
    ]},
  { id: "lb11", name: "Read Register", category: "Hardware I/O", type: "hw", description: "Read a device register value",
    defaultProps: [
      { key: "address", label: "Register Address", type: "string", value: "0x04", group: "Target" },
      { key: "expected", label: "Expected Value", type: "string", value: "0xA5", group: "Limits" },
      { key: "mask", label: "Bit Mask", type: "string", value: "0xFF", group: "Limits" },
    ]},
  { id: "lb12", name: "Write Register", category: "Hardware I/O", type: "hw", description: "Write a value to a device register",
    defaultProps: [
      { key: "address", label: "Register Address", type: "string", value: "0x08", group: "Target" },
      { key: "value", label: "Write Value", type: "string", value: "0x01", group: "Parameters" },
      { key: "verify", label: "Verify Readback", type: "boolean", value: true, group: "Parameters" },
    ]},
  { id: "lb13", name: "Query SCPI", category: "Instruments", type: "instrument", description: "Send SCPI command and read response",
    defaultProps: [
      { key: "address", label: "Instrument Address", type: "string", value: "GPIB0::14::INSTR", group: "Connection" },
      { key: "command", label: "SCPI Command", type: "string", value: ":MEAS:POW?", group: "Command" },
      { key: "expected", label: "Expected Response", type: "string", value: "", group: "Limits" },
    ]},
  { id: "lb14", name: "Connect Instrument", category: "Instruments", type: "instrument", description: "Open VISA instrument connection",
    defaultProps: [
      { key: "address", label: "VISA Address", type: "string", value: "GPIB0::14::INSTR", group: "Connection" },
      { key: "timeout", label: "Timeout", type: "number", value: 5000, unit: "ms", group: "Connection" },
      { key: "reset", label: "Reset on Connect", type: "boolean", value: true, group: "Connection" },
    ]},
  { id: "lb15", name: "Log Message", category: "Utility", type: "flow", description: "Write a custom log message",
    defaultProps: [
      { key: "message", label: "Message", type: "string", value: "Test checkpoint reached", group: "Parameters" },
      { key: "level", label: "Log Level", type: "enum", value: "INFO", options: ["INFO", "DEBUG", "WARN", "ERROR"], group: "Parameters" },
    ]},
  { id: "lb16", name: "Disconnect All", category: "Instruments", type: "instrument", description: "Disconnect all instruments",
    defaultProps: [
      { key: "send_local", label: "Send GTL", type: "boolean", value: true, group: "Options" },
    ]},
];

export const PRESET_PLUGINS: Plugin[] = [
  {
    id: "p1", name: "Keysight RF Suite", version: "3.2.1", author: "Keysight Technologies",
    description: "RF measurement steps for Keysight signal analyzers and generators (N9030, E4438C)",
    status: "installed",
    steps: [
      { id: "lp1a", name: "EVM Measurement", category: "Keysight RF", type: "measure", description: "Error Vector Magnitude measurement",
        defaultProps: [
          { key: "modulation", label: "Modulation", type: "enum", value: "QAM16", options: ["QAM16", "QAM64", "QAM256", "QPSK"], group: "Signal" },
          { key: "evm_limit", label: "EVM Limit", type: "number", value: -30, unit: "dB", group: "Limits" },
        ]},
      { id: "lp1b", name: "Phase Noise", category: "Keysight RF", type: "measure", description: "Phase noise measurement at offsets",
        defaultProps: [
          { key: "carrier", label: "Carrier Frequency", type: "frequency", value: 1000000000, unit: "Hz", group: "Parameters" },
          { key: "limit", label: "Phase Noise Limit", type: "number", value: -120, unit: "dBc/Hz", group: "Limits" },
        ]},
    ],
  },
  {
    id: "p2", name: "NI-DAQmx I/O", version: "1.5.0", author: "National Instruments",
    description: "Digital and analog I/O for NI DAQ hardware (USB-6001, PCIe-6321)",
    status: "available",
    steps: [
      { id: "lp2a", name: "Analog Input Read", category: "NI DAQmx", type: "hw", description: "Read analog voltage from DAQ channel",
        defaultProps: [
          { key: "device", label: "Device", type: "string", value: "Dev1", group: "Target" },
          { key: "channel", label: "Channel", type: "string", value: "ai0", group: "Target" },
          { key: "max_v", label: "Max Voltage", type: "number", value: 10, unit: "V", group: "Range" },
        ]},
    ],
  },
  {
    id: "p3", name: "Serial Protocol Tester", version: "2.0.3", author: "OpenTAP Community",
    description: "UART/SPI/I2C protocol verification steps",
    status: "available",
    steps: [
      { id: "lp3a", name: "UART Send", category: "Serial", type: "hw", description: "Send bytes over UART serial port",
        defaultProps: [
          { key: "port", label: "COM Port", type: "string", value: "COM3", group: "Connection" },
          { key: "baud", label: "Baud Rate", type: "number", value: 115200, group: "Connection" },
          { key: "data", label: "Data (hex)", type: "string", value: "AA BB CC", group: "Data" },
        ]},
      { id: "lp3b", name: "UART Receive & Verify", category: "Serial", type: "hw", description: "Wait for UART response and compare",
        defaultProps: [
          { key: "expected", label: "Expected Data (hex)", type: "string", value: "AA 00 FF", group: "Verification" },
          { key: "timeout", label: "Receive Timeout", type: "number", value: 1000, unit: "ms", group: "Connection" },
        ]},
    ],
  },
];
