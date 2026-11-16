export const getDockerImage = (resource) => {
  const {
    static_image,
    docker_registry_image_name,
    docker_registry_image_tag,
    docker_compose_raw,
  } = resource;

  if (static_image) return static_image;
  if (docker_registry_image_name) {
    return docker_registry_image_tag
      ? `${docker_registry_image_name}:${docker_registry_image_tag}`
      : docker_registry_image_name;
  }
  if (!docker_compose_raw) return null;
  const imageMatch = docker_compose_raw.match(/image:\s*['"]?([^\s'"]+)/);
  return imageMatch ? imageMatch[1] : null;
};

export const getSourceInfo = (resource) => {
  const { git_repository, docker_registry_image_name } = resource;

  if (git_repository) {
    return { type: "git", value: git_repository, icon: "🔗" };
  }
  if (docker_registry_image_name) {
    return { type: "docker", value: docker_registry_image_name, icon: "🐋" };
  }
  return null;
};

export const getResourceTag = (resource) => {
  const { database_type, build_pack, service_type, applications } = resource;

  if (database_type) return database_type;
  if (build_pack) return build_pack;
  if (service_type) return service_type;
  if (applications && applications.length > 0 && applications[0].image) {
    return applications[0].image.split(":")[0];
  }
  return null;
};

export const hasResourceDetails = (resource) => {
  const {
    description,
    created_at,
    git_repository,
    static_image,
    docker_registry_image_name,
    docker_compose_raw,
    applications,
    databases,
  } = resource;

  return !!(
    description ||
    getDockerImage(resource) ||
    created_at ||
    git_repository ||
    static_image ||
    docker_registry_image_name ||
    docker_compose_raw ||
    (applications && applications.length > 0) ||
    (databases && databases.length > 0)
  );
};
