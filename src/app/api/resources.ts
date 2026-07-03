import axiosClient from './client';

export interface Resource {
  id: string;
  name: string;
  instrument: string;
  status: string;
  [key: string]: any;
}

export const getResources = async (): Promise<Resource[]> => {
  try {
    const response = await axiosClient.get('plugins/resources');
    const data = response.data;
    const combined: Resource[] = [];

    // Instruments
    if (data.instruments && Array.isArray(data.instruments)) {
      combined.push(
        ...data.instruments.map((instrument: any, index: number) => ({
          id: instrument.name || `instrument-${index}`,
          name: instrument.name || "Unnamed",
          instrument: extractTypeName(instrument.type),
          status: instrument.properties?.Error ? "Error" : "Active",
          error: instrument.properties?.Error || "",
          type: instrument.type,
          properties: instrument.properties || {},
        })),
      );
    }

    // Connections
   const connections = data.connections ?? data.conections;

if (Array.isArray(connections)) {
  combined.push(
    ...connections.map((connection: any, index: number) => ({
      id: connection.name || `connection-${index}`,
      name: connection.name || "Unnamed",
      instrument: extractTypeName(connection.type),
      status: connection.properties?.Error ? "Error" : "Active",
      error: connection.properties?.Error || "",
      type: connection.type,
      properties: connection.properties || {},
    })),
  );
}


    // DUTs
    if (data.duts && Array.isArray(data.duts)) {
      combined.push(
        ...data.duts.map((resource: any, index: number) => ({
          id: String(resource.id ?? resource.name ?? resource.dutName ?? `dut-${index}`),
          name:
            String(
              resource.name ||
              resource.properties?.Name ||
              resource.properties?.name ||
              resource.dutName ||
              resource.model ||
              extractTypeName(resource.type ?? resource.properties?.type ?? "")
            ) || `DUT ${index}`,
          instrument: String(
            resource.instrument ?? extractTypeName(resource.type ?? resource.properties?.type ?? ""),
          ),
          status:
            String(resource.status ?? "").trim() ||
            (resource.properties?.Error ? "Error" : "Active"),
          type: String(resource.type ?? resource.properties?.type ?? ""),
          properties: resource.properties ?? {},
          ...resource,
        })),
      );
    }

    if (combined.length > 0) {
      return combined;
    }

    // Fallbacks (array, or {resources: [...]})
    if (Array.isArray(data)) {
      return data.map((item: any, index: number) => ({
        id: item.id || item.name || `resource-${index}`,
        name: item.name || "Unnamed",
        instrument: item.instrument || extractTypeName(item.type),
        status: item.status || "Active",
        ...item,
      }));
    }

    if (data.resources && Array.isArray(data.resources)) {
      return data.resources.map((resource: any, index: number) => ({
        id: resource.id || resource.name || `resource-${index}`,
        name: resource.name || "Unnamed",
        instrument: resource.instrument || extractTypeName(resource.type),
        status: resource.status || "Active",
        ...resource,
      }));
    }

    return [];
  } catch (error) {
    throw error;
  }
};

/**
 * Extract the type name from a fully qualified type name
 * Example: "OpenTap.Plugins.BasicSteps.GenericScpiInstrument" -> "GenericScpiInstrument"
 */
// resources.ts

export const extractTypeName = (fullType: string): string => {
  if (!fullType) return "";
  const parts = fullType.split(".");
  return parts[parts.length - 1] || fullType;
};

export interface ResourceSchemaProperty {
  name: string;
  displayName: string;
  type: string;
  isEditable: boolean;
  value: any;
  enumValues: string[];
}

export interface ResourceSchema {
  resourceKind: string;
  pluginTypeName: string;
  fullTypeName: string;
  count: number;
  properties: ResourceSchemaProperty[];
}

export interface AddResourcePayload {
  resourceKind: string;
  pluginTypeName: string;
  name: string;
  properties: Record<string, any>;
}

export interface UpdateResourcePayload {
  resourceKind: string;
  name: string;
  newName: string;
  properties: Record<string, any>;
}

export interface DeleteResourcePayload {
  resourceKind: string;
  name: string;
}

export const addResource = async (payload: AddResourcePayload) => {
  const response = await axiosClient.post('plugins/resources/add', payload);
  return response.data;
};

export const updateResource = async (payload: UpdateResourcePayload) => {
  const response = await axiosClient.post('plugins/resources/update', payload);
  return response.data;
};

export const deleteResource = async (payload: DeleteResourcePayload) => {
  const response = await axiosClient.post('plugins/resources/delete', payload);
  return response.data;
};

export const getResourceSchema = async (
  pluginTypeName: string,
  resourceKind: string = 'instrument',
): Promise<ResourceSchema> => {
  try {
    const response = await axiosClient.get('plugins/resources/schema', {
      params: {
        resourceKind: resourceKind,
        pluginTypeName: pluginTypeName,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

