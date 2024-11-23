// import { GenAIActionModel } from "@/models/GenAIAction";
// import { currentUser } from "@clerk/nextjs/server";
// import { Logger } from "@/lib/logger";
// import { v4 as uuidv4 } from 'uuid';

// export async function srv_addGenAIAction(action: string, promptTokens: number, completionTokens: number, costInCents: number) {
//   const user = await currentUser();
//   if (!user) {
//     await Logger.warning('Unauthorized add genAI action attempt', { action, promptTokens, completionTokens, costInCents });
//     return;
//   }
//   await GenAIActionModel.create({ id: uuidv4(), action, promptTokens, completionTokens, costInCents, dateCreated: new Date() });
// }   
