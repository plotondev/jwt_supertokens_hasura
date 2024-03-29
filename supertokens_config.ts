import ThirdPartyPasswordless from "supertokens-node/recipe/thirdpartypasswordless";
import { SMTPService } from "supertokens-node/recipe/thirdpartypasswordless/emaildelivery";
import Session from "supertokens-node/recipe/session";
import Dashboard from "supertokens-node/recipe/dashboard";
import UserMetadata from "supertokens-node/recipe/usermetadata";
import UserRoles from "supertokens-node/recipe/userroles";
import Multitenancy from "supertokens-node/recipe/multitenancy";
import { google } from "googleapis";
import { AuthConfig } from "./interfaces";
import Mailjet from "node-mailjet";
import { saveTokens } from "./oauthTokens";

export const backendConfig = (): AuthConfig => {
  const appInfo = {
    appName: process.env.APP_NAME!,
    websiteDomain: process.env.PLOTON_CLIENT_URL!,
    apiDomain: process.env.PLOTON_CLIENT_URL!,
    apiBasePath: "/api/",
  };

  let OAuth2 = google.auth.OAuth2;
  let oauth2Client = new OAuth2();
  return {
    framework: "express",
    supertokens: {
      // this is the location of the SuperTokens core.
      connectionURI: process.env.SUPERTOKENS_CORE_URI!,
      apiKey: process.env.SUPERTOKENS_API_KEY!,
    },
    enableDebugLogs: true,
    appInfo,
    // recipeList contains all the modules that you want to
    // use from SuperTokens. See the full list here: https://supertokens.com/docs/guides
    recipeList: [
      ThirdPartyPasswordless.init({
        emailDelivery: {
          service: new SMTPService({
            smtpSettings: {
              host: process.env.SMTP_HOST || "",
              authUsername: process.env.SMTP_USER || "",
              password: process.env.SMTP_PASS || "",
              port: +(process.env.SMTP_PORT || 587),

              from: {
                name: process.env.SMTP_FROM_NAME!,
                email: process.env.SMTP_FROM_EMAIL!,
              },
              secure: false,
            },
          }),
        },
        override: {
          functions: (originalImplementation) => {
            return {
              ...originalImplementation,

              sendEmail: async function ({
                codeLifetime, // amount of time the code is alive for (in MS)
                email, //user email
                urlWithLinkCode, // magic link
                userInputCode, // OTP
              }: {
                codeLifetime: number;
                email: string;
                urlWithLinkCode: string;
                userInputCode: string;
              }) {
                // TODO: create and send email
                console.log(codeLifetime);
                console.log(email);
                console.log(urlWithLinkCode);
                console.log(userInputCode);
              },
              thirdPartySignInUp: async function (input) {
                // TODO: Some pre sign in / up logic

                let response = await originalImplementation.thirdPartySignInUp(
                  input
                );

                //Save oauth2 tokens of selected provider
                saveTokens(
                  JSON.stringify(response.oAuthTokens),
                  response.user.id,
                  input.thirdPartyId
                );
                let { id: userId, email: userEmail } = response.user;
                if (response.status === "OK" && response.createdNewUser) {
                  //add user to public tenant
                  await UserRoles.addRoleToUser("public", userId, "user");

                  // ----- default personal workspace
                  await Multitenancy.createOrUpdateTenant(userId, {
                    passwordlessEnabled: true,
                    thirdPartyEnabled: true,
                  });
                  await UserRoles.addRoleToUser(userId, userId, "admin");
                  // ----- default personal workspace end

                  // This is the response from the OAuth 2 provider that contains their tokens or user info.
                  let providerAccessToken =
                    response.oAuthTokens["access_token"];

                  if (input.thirdPartyId === "google") {
                    oauth2Client.setCredentials({
                      access_token: providerAccessToken,
                    });
                    var oauth2 = google.oauth2({
                      auth: oauth2Client,
                      version: "v2",
                    });
                    oauth2.userinfo.get(function (err, res) {
                      if (err) {
                        console.log(err);
                      } else {
                        UserMetadata.updateUserMetadata(userId, {
                          first_name: res?.data.given_name,
                          last_name: res?.data.family_name,
                          picture: res?.data.picture,
                          name: res?.data.name,
                          email: res?.data.email,
                        });
                      }
                    });
                  }

                  if (response.createdNewUser) {
                    // TODO: Post sign up logic
                    const mailjet = new Mailjet({
                      apiKey: process.env.SMTP_USER,
                      apiSecret: process.env.SMTP_PASS,
                    });
                    mailjet.post;
                  } else {
                    // TODO: Post sign in logic
                  }
                }
                const roles = await UserRoles.getRolesForUser(input.tenantId, userId);
                input.userContext = {
                  isSignup: response.createdNewUser,
                  userId,
                  userEmail,
                  tenantId: input.tenantId,
                  roles: roles.roles,
                  provider:input.thirdPartyId
                }

                return response;
              },
              consumeCode: async function (input) {
                let resp = await originalImplementation.consumeCode(input);

                if (resp.status === "OK") {
                  /*
                   * This is called during the consume code API,
                   * but before calling the createNewSession function.
                   * At the start of the API, we do not know if it will result in a
                   * sign in or a sign up, so we cannot override the API function.
                   * Instead, we override the recipe function as shown here,
                   * and then set the relevant context only if it's a new user.
                   */

                  /*
                   * by default, the userContext Dict is {},
                   * we change it to {isSignUp: true}, since this is called in the
                   * sign up API, and this will tell the create_new_session function
                   * (which will be called next)
                   * to not create a new session in case input.userContext.isSignUp == true
                   */
                  input.userContext.isSignUp = resp.createdNewUser;
                }
                return resp;
              },
            };
          },
        },
        providers: [
          {
            config: {
              thirdPartyId: "google",
              clients: [
                {
                  clientId: process.env.GOOGLE_CLIENT_ID!,
                  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
                },
              ],
            },
          },
          {
            config: {
              thirdPartyId: "github",
              clients: [
                {
                  clientId: process.env.GITHUB_CLIENT_ID!,
                  clientSecret: process.env.GITHUB_CLIENT_SECRET!,
                },
              ],
            },
          },
        ],
        contactMethod: "EMAIL",
        flowType: "USER_INPUT_CODE_AND_MAGIC_LINK",
      }),
      Session.init({
        exposeAccessTokenToFrontendInCookieBasedAuth: false,
        override: {
          functions: function (originalImplementation) {
            return {
              ...originalImplementation,
              createNewSession: async function (input) {
                //get workspace and role for user
                
                input.accessTokenPayload = {
                  ...input.accessTokenPayload,
                  "claims": {
                    "x-user-id": input.userId,
                    "x-tenant-id": input.tenantId,
                    "x-default-role": "user",
                    "x-user-email": input.userContext.userEmail,
                    "x-allowed-roles": input.userContext.roles,
                    "x-is-signup": input.userContext.isSignup,
                    "x-provider": input.userContext.provider
                  },
                };

                return originalImplementation.createNewSession(input);
              },
            };
          },
        },
      }),
      UserMetadata.init({}),
      Dashboard.init({}),
      UserRoles.init({})
    ],
    isInServerlessEnv: true,
  };
};
