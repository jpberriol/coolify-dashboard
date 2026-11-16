import resourceRepository from "../repositories/ResourceRepository";

// Legacy exports for backward compatibility
export const fetchAllResources = () => resourceRepository.fetchAll();
export const startResource = (type, uuid) => resourceRepository.start(type, uuid);
export const stopResource = (type, uuid) => resourceRepository.stop(type, uuid);
export const redeployResource = (type, uuid) => resourceRepository.redeploy(type, uuid);
export const getResourceLogs = (type, uuid) => resourceRepository.getLogs(type, uuid);
