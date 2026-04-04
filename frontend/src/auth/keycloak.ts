import Keycloak from 'keycloak-js';

const defaultKeycloakUrl =
  typeof window !== 'undefined' ? `${window.location.origin}/auth` : 'http://localhost:8080/auth';

const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL ?? defaultKeycloakUrl,
  realm: import.meta.env.VITE_KEYCLOAK_REALM ?? 'legal-opinion-saas',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? 'legal-opinion-web',
});

export default keycloak;
