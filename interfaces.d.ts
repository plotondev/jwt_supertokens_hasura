import { TypeFramework } from "supertokens-node/lib/build/framework/types";

export interface AuthConfig {
  framework: TypeFramework;
  supertokens: {
    connectionURI: string;
    apiKey: string;
  };
  appInfo: {
    appName: string;
    websiteDomain: string;
    apiDomain: string;
    apiBasePath: string;
  };
  enableDebugLogs: boolean;
  recipeList: Array<RecipeListFunction>;
  isInServerlessEnv: boolean;
}
