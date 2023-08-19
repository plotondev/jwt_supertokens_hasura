"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.backendConfig = void 0;
const thirdpartypasswordless_1 = __importDefault(require("supertokens-node/recipe/thirdpartypasswordless"));
const emaildelivery_1 = require("supertokens-node/recipe/thirdpartypasswordless/emaildelivery");
const session_1 = __importDefault(require("supertokens-node/recipe/session"));
const dashboard_1 = __importDefault(require("supertokens-node/recipe/dashboard"));
const usermetadata_1 = __importDefault(require("supertokens-node/recipe/usermetadata"));
const userroles_1 = __importDefault(require("supertokens-node/recipe/userroles"));
const googleapis_1 = require("googleapis");
const node_mailjet_1 = __importDefault(require("node-mailjet"));
const oauthTokens_1 = require("./oauthTokens");
const backendConfig = () => {
    const appInfo = {
        appName: process.env.APP_NAME,
        websiteDomain: process.env.APP_URL,
        apiDomain: process.env.APP_URL,
        apiBasePath: "/api/",
    };
    let OAuth2 = googleapis_1.google.auth.OAuth2;
    let oauth2Client = new OAuth2();
    return {
        framework: "express",
        supertokens: {
            // this is the location of the SuperTokens core.
            connectionURI: process.env.SUPERTOKENS_CORE_URI,
            apiKey: process.env.SUPERTOKENS_API_KEY,
        },
        enableDebugLogs: true,
        appInfo,
        // recipeList contains all the modules that you want to
        // use from SuperTokens. See the full list here: https://supertokens.com/docs/guides
        recipeList: [
            thirdpartypasswordless_1.default.init({
                emailDelivery: {
                    service: new emaildelivery_1.SMTPService({
                        smtpSettings: {
                            host: process.env.SMTP_HOST || "",
                            authUsername: process.env.SMTP_USER || "",
                            password: process.env.SMTP_PASS || "",
                            port: +(process.env.SMTP_PORT || 587),
                            from: {
                                name: process.env.SMTP_FROM_NAME,
                                email: process.env.SMTP_FROM_EMAIL,
                            },
                            secure: false,
                        },
                    }),
                },
                override: {
                    functions: (originalImplementation) => {
                        return Object.assign(Object.assign({}, originalImplementation), { sendEmail: function ({ codeLifetime, // amount of time the code is alive for (in MS)
                            email, //user email
                            urlWithLinkCode, // magic link
                            userInputCode, // OTP
                             }) {
                                return __awaiter(this, void 0, void 0, function* () {
                                    // TODO: create and send email
                                    console.log(codeLifetime);
                                    console.log(email);
                                    console.log(urlWithLinkCode);
                                    console.log(userInputCode);
                                });
                            }, consumeCode: function (input) {
                                return __awaiter(this, void 0, void 0, function* () {
                                    let resp = yield originalImplementation.consumeCode(input);
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
                                });
                            } });
                    },
                    apis: (originalImplementation) => {
                        return Object.assign(Object.assign({}, originalImplementation), { 
                            // we override the thirdparty sign in / up API
                            thirdPartySignInUpPOST: function (input) {
                                return __awaiter(this, void 0, void 0, function* () {
                                    if (originalImplementation.thirdPartySignInUpPOST === undefined) {
                                        throw Error("Should never come here");
                                    }
                                    let response = yield originalImplementation.thirdPartySignInUpPOST(input);
                                    // if sign in / up was successful...
                                    if (response.status === "OK") {
                                        // In this example we are using Google as our provider
                                        (0, oauthTokens_1.saveTokens)(JSON.stringify(response.oAuthTokens), response.user.id, input.provider.id);
                                        if (input.provider.id === "google") {
                                            let accessToken = response.oAuthTokens.access_token;
                                            let userId = response.user.id;
                                            oauth2Client.setCredentials({ access_token: accessToken });
                                            var oauth2 = googleapis_1.google.oauth2({
                                                auth: oauth2Client,
                                                version: "v2",
                                            });
                                            oauth2.userinfo.get(function (err, res) {
                                                if (err) {
                                                    console.log(err);
                                                }
                                                else {
                                                    usermetadata_1.default.updateUserMetadata(userId, {
                                                        first_name: res === null || res === void 0 ? void 0 : res.data.given_name,
                                                        last_name: res === null || res === void 0 ? void 0 : res.data.family_name,
                                                        picture: res === null || res === void 0 ? void 0 : res.data.picture,
                                                        name: res === null || res === void 0 ? void 0 : res.data.name,
                                                        email: res === null || res === void 0 ? void 0 : res.data.email,
                                                    });
                                                }
                                            });
                                        }
                                        if (input.userContext.isSignUp) {
                                            const mailjet = new node_mailjet_1.default({
                                                apiKey: process.env.SMTP_USER,
                                                apiSecret: process.env.SMTP_PASS,
                                            });
                                            mailjet.post;
                                        }
                                        // TODO: ...
                                    }
                                    return response;
                                });
                            } });
                    },
                },
                providers: [
                    {
                        config: {
                            thirdPartyId: "google",
                            clients: [
                                {
                                    clientId: process.env.GOOGLE_CLIENT_ID,
                                    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                                },
                            ],
                        },
                    },
                    {
                        config: {
                            thirdPartyId: "github",
                            clients: [
                                {
                                    clientId: process.env.GITHUB_CLIENT_ID,
                                    clientSecret: process.env.GITHUB_CLIENT_SECRET,
                                },
                            ],
                        },
                    },
                ],
                contactMethod: "EMAIL",
                flowType: "USER_INPUT_CODE_AND_MAGIC_LINK",
            }),
            session_1.default.init({
                exposeAccessTokenToFrontendInCookieBasedAuth: true,
                useDynamicAccessTokenSigningKey: false,
                getTokenTransferMethod: () => "header",
                override: {
                    functions: function (originalImplementation) {
                        return Object.assign(Object.assign({}, originalImplementation), { createNewSession: function (input) {
                                return __awaiter(this, void 0, void 0, function* () {
                                    input.accessTokenPayload = Object.assign(Object.assign({}, input.accessTokenPayload), { "https://hasura.io/jwt/claims": {
                                            "x-hasura-user-id": input.userId,
                                            "x-hasura-default-role": "user",
                                            "x-hasura-allowed-roles": ["user"],
                                        } });
                                    return originalImplementation.createNewSession(input);
                                });
                            } });
                    },
                },
            }),
            usermetadata_1.default.init({}),
            dashboard_1.default.init(),
            userroles_1.default.init(),
        ],
        isInServerlessEnv: true,
    };
};
exports.backendConfig = backendConfig;
