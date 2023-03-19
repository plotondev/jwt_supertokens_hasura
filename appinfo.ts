const port = process.env.APP_PORT || 3000;

const apiBasePath = "/api/";

export const websiteDomain = process.env.APP_URL || `http://localhost:${port}`;

export const appInfo = {
    appName: "CareToCall",
    websiteDomain,
    apiDomain: websiteDomain,
    apiBasePath,
};
