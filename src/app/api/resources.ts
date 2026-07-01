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
    
    // Handle the API response structure
    const data = response.data;
    
    // If response has instruments array
    if (data.instruments && Array.isArray(data.instruments)) {
      return data.instruments.map((instrument: any, index: number) => ({
        id: instrument.name || `instrument-${index}`,
        name: instrument.name || "Unnamed",
        instrument: extractTypeName(instrument.type),
        status: instrument.properties?.Error ? "Error" : "Active",
        error: instrument.properties?.Error || "",
        type: instrument.type,
        properties: instrument.properties || {},
      }));
    }
    
    // If response is directly an array of resources
    if (Array.isArray(data)) {
      return data.map((item: any, index: number) => ({
        id: item.id || item.name || `resource-${index}`,
        name: item.name || "Unnamed",
        instrument: item.instrument || extractTypeName(item.type),
        status: item.status || "Active",
        ...item,
      }));
    }
    
    // If response is a single object with resources
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
const extractTypeName = (fullType: string): string => {
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

export const getResourceSchema = async (pluginTypeName: string): Promise<ResourceSchema> => {
  try {
    const response = await axiosClient.get('plugins/resources/schema', {
      params: {
        resourceKind: 'Instrument',
        pluginTypeName: pluginTypeName,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

