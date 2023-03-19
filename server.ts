import express from "express";
import ThirdPartyPasswordlessNode from "supertokens-node/recipe/thirdpartypasswordless"
import { SMTPService } from "supertokens-node/recipe/thirdpartypasswordless/emaildelivery"
import SessionNode from "supertokens-node/recipe/session"
import Dashboard from "supertokens-node/recipe/dashboard"
import UserMetadata from "supertokens-node/recipe/usermetadata"
import { middleware as SupertokensMiddleware} from "supertokens-node/framework/express"
import { google } from 'googleapis'

import supertokens from "supertokens-node";
import dotenv from 'dotenv';
import { AuthConfig } from "./interfaces";
import { appInfo } from "./appinfo";
import actuator from 'express-actuator'

dotenv.config();

let backendConfig = (): AuthConfig => {
    let OAuth2 = google.auth.OAuth2
    let oauth2Client = new OAuth2()
    return {
        
        framework: "express",
        supertokens: {
            // this is the location of the SuperTokens core.
            connectionURI: process.env.SUPERTOKENS_CORE_URI || "http://localhost:3567",
            apiKey: process.env.SUPERTOKENS_API_KEY || "",
        },
        appInfo,
        // recipeList contains all the modules that you want to
        // use from SuperTokens. See the full list here: https://supertokens.com/docs/guides
        recipeList: [
            ThirdPartyPasswordlessNode.init({
                emailDelivery: {
                    service: new SMTPService({
                        smtpSettings: {
                            host: process.env.SMTP_HOST || '',
                            authUsername: process.env.SMTP_USER || '',
                            password: process.env.SMTP_PASS || '',
                            port: +(process.env.SMTP_PORT || 587),
                        
                            from: {
                                name: process.env.SMTP_FROM_NAME || 'CareToCall Development',
                                email: process.env.SMTP_FROM_EMAIL || 'info@caretocall.com',
                            },
                            secure: false
                        },
                    })
                },
                override: {
                    apis: (originalImplementation) => {
                        return {
                            ...originalImplementation,
    
                            // we override the thirdparty sign in / up API
                            thirdPartySignInUpPOST: async function (input) {
                                if (originalImplementation.thirdPartySignInUpPOST === undefined) {
                                    throw Error("Should never come here")
                                }
    
                                let response = await originalImplementation.thirdPartySignInUpPOST(input)
    
                                // if sign in / up was successful...
                                if (response.status === "OK") {
                                    // In this example we are using Google as our provider
                                    
                                    let accessToken = response.authCodeResponse.access_token
                                    let userId = response.user.id       
                                    oauth2Client.setCredentials({access_token: accessToken})
                                    var oauth2 = google.oauth2({
                                        auth: oauth2Client,
                                        version: 'v2'
                                      })
                                      oauth2.userinfo.get(
                                        function(err, res) {
                                          if (err) {
                                             console.log(err)
                                          } else {
                                            UserMetadata.updateUserMetadata(userId, { first_name: res?.data.given_name,last_name: res?.data.family_name, picture: res?.data.picture, name: res?.data.name})
                                          }
                                      })                      
                                    
    
                                    // TODO: ...
                                }
    
                                return response
                            },
                        }
                    }
                },
                providers: [
                    // We have provided you with development keys which you can use for testing.
                    // IMPORTANT: Please replace them with your own OAuth keys for production use.
                    ThirdPartyPasswordlessNode.Google({
                        clientId: process.env.GOOGLE_CLIENT_ID!,
                        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
                        scope: ["profile", "email"],
                        
                    }),
                ],
                contactMethod: "EMAIL",
                flowType: "USER_INPUT_CODE_AND_MAGIC_LINK",
            }),
            SessionNode.init({
                jwt: {
                    enable: true,
                },
                override: {
                    functions: function (originalImplementation) {
                        return {
                            ...originalImplementation,
                            createNewSession: async function (input) {
                                input.accessTokenPayload = {
                                    ...input.accessTokenPayload,
                                    "https://hasura.io/jwt/claims": {
                                        "x-hasura-user-id": input.userId,
                                        "x-hasura-default-role": "user",
                                        "x-hasura-allowed-roles": ["user"],
                                    }
                                };
    
                                return originalImplementation.createNewSession(input);
                            },
                        };
                    }
                },
            }),
            UserMetadata.init({}),
            Dashboard.init({
                apiKey: process.env.SUPERTOKENS_API_KEY || "",
            }),
        ],
        isInServerlessEnv: true,
    }
}
supertokens.init(backendConfig());


const app = express();

app.use(SupertokensMiddleware());

app.use(actuator());
const port = process.env.PORT;
const server = app.listen(port, async () => {
    
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
  })

