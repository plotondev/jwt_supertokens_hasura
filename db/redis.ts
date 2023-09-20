import { Redis } from "ioredis";
const redis = new Redis(process.env.REDIS_URI!);

export const getWorkspaceRoleForUser = async (userID: string) => {
  const workspace = await redis.hget(`users:${userID}`, "selected-wkspc");
  const role = await redis.hget(`users:${userID}`, `wkspc-${workspace}:role`);
  return { workspace, role };
};

export const setWorkspaceForUser = async (
  userID: string,
  workspace: string
) => {
  await redis.hset(`users:${userID}`, "selected-wkspc", workspace);

  return;
};

export const createWorkspace = async (workspace: string) => {
  await redis.hset(`workspaces:${workspace}`, workspace);
  return;
};
