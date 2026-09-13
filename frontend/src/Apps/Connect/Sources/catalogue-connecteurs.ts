export type ConnectorStatus = "disponible" | "beta" | "roadmap";

export interface IConnectorEntry {
  id: string;
  type: string;
  subType: string;
  status: ConnectorStatus;
}

export const STATUS_LABELS: Record<ConnectorStatus, string> = {
  disponible: "Disponible",
  beta: "Bêta",
  roadmap: "Roadmap",
};

export const STATUS_COLORS: Record<ConnectorStatus, string> = {
  disponible: "green",
  beta: "orange",
  roadmap: "default",
};

export function isConnectorClickable(status: ConnectorStatus): boolean {
  return status !== "roadmap";
}

export function groupByStatus<T extends { status: ConnectorStatus }>(
  connectors: T[]
): Record<ConnectorStatus, T[]> {
  return {
    disponible: connectors.filter((c) => c.status === "disponible"),
    beta: connectors.filter((c) => c.status === "beta"),
    roadmap: connectors.filter((c) => c.status === "roadmap"),
  };
}
