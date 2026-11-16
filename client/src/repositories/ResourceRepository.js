import apiClient from "../services/ApiClient";
import {
  mapApplication,
  mapService,
  mapDatabase,
} from "../services/resourceMapper";

class ResourceRepository {
  constructor(client = apiClient) {
    this.client = client;
  }

  async fetchAll() {
    const [applications, services, databases] = await Promise.all([
      this.client.get("/applications"),
      this.client.get("/services"),
      this.client.get("/databases").catch(() => []),
    ]);

    return [
      ...applications.map(mapApplication),
      ...services.map(mapService),
      ...(databases || []).map(mapDatabase),
    ];
  }

  async fetchApplications() {
    const data = await this.client.get("/applications");
    return data.map(mapApplication);
  }

  async fetchServices() {
    const data = await this.client.get("/services");
    return data.map(mapService);
  }

  async fetchDatabases() {
    try {
      const data = await this.client.get("/databases");
      return (data || []).map(mapDatabase);
    } catch (error) {
      console.warn("Failed to fetch databases:", error);
      return [];
    }
  }

  async start(type, uuid) {
    return await this.client.post(`/${type}s/${uuid}/start`);
  }

  async stop(type, uuid) {
    return await this.client.post(`/${type}s/${uuid}/stop`);
  }

  async redeploy(type, uuid) {
    return await this.client.post(`/${type}s/${uuid}/redeploy`);
  }

  async getLogs(type, uuid) {
    return await this.client.get(`/${type}s/${uuid}/logs`);
  }
}

const resourceRepository = new ResourceRepository();

export default resourceRepository;
export { ResourceRepository };
