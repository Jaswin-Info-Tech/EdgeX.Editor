import axiosClient from './client';

export interface Resource {
  id: string;
  name: string;
  instrument: string;
  status: string;
  [key: string]: any;
}

/**
 * Normalize a properties payload into a flat { propName: value } map,
 * regardless of whether the backend sends it as an array of
 * { name, value } objects (new schema-style format) or as a plain object
 * (old format).
 */
const propsArrayToMap = (properties: any): Record<string, any> => {
  if (Array.isArray(properties)) {
    return properties.reduce((acc: Record<string, any>, prop: any) => {
      if (prop && typeof prop === "object" && "name" in prop) {
        acc[prop.name] = prop.value;
      }
      return acc;
    }, {});
  }
  if (properties && typeof properties === "object") {
    return properties;
  }
  return {};
};

export const getResources = async (): Promise<Resource[]> => {
  try {
    const response = await axiosClient.get('plugins/resources');
    
    // Handle the API response structure
    const data = response.data;
    
    // If response has instruments array
    if (data.instruments && Array.isArray(data.instruments)) {
      return data.instruments.map((instrument: any, index: number) => {
        const propsMap = propsArrayToMap(instrument.properties);
        return {
          id: instrument.name || `instrument-${index}`,
          name: instrument.name || "Unnamed",
          instrument: extractTypeName(instrument.type),
          status: propsMap.Error ? "Error" : "Active",
          error: propsMap.Error || "",
          type: instrument.type,
          properties: propsMap,
        };
      });
    }

    // If response is directly an array of resources
    if (Array.isArray(data)) {
      return data.map((item: any, index: number) => {
        const propsMap = propsArrayToMap(item.properties);
        return {
          id: item.id || item.name || `resource-${index}`,
          name: item.name || "Unnamed",
          instrument: item.instrument || extractTypeName(item.type),
          status: item.status || (propsMap.Error ? "Error" : "Active"),
          ...item,
          properties: propsMap,
        };
      });
    }

    // If response is a single object with resources
    if (data.resources && Array.isArray(data.resources)) {
      return data.resources.map((resource: any, index: number) => {
        const propsMap = propsArrayToMap(resource.properties);
        return {
          id: resource.id || resource.name || `resource-${index}`,
          name: resource.name || "Unnamed",
          instrument: resource.instrument || extractTypeName(resource.type),
          status: resource.status || (propsMap.Error ? "Error" : "Active"),
          ...resource,
          properties: propsMap,
        };
      });
    }

    return [];
  } catch (error) {
    throw error;
  }
};

export const extractTypeName = (fullType: string): string => {
  if (!fullType) return "";
  const parts = fullType.split(".");
  return parts[parts.length - 1] || fullType;
};

export interface ResourceSchemaProperty {
  name: string;
  displayName: string;
  type: string;
  editorType?: string;
  isEditable: boolean;
  isReadable?: boolean;
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
  resourceKind: string = 'Instrument',
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