# Chatbot Refactor - Setup Complete!

## What was created:

Folders:

- supabase/functions/chatbot-process/handlers/
- supabase/functions/chatbot-process/services/
- supabase/functions/chatbot-process/utils/

Files:

- utils/cors.ts
- utils/supabaseClient.ts
- utils/formatters.ts
- utils/prompts.ts

## Next Steps:

1. Ask Claude to create remaining service files:
   - services/contextService.ts
   - services/geminiService.ts
   - services/facebookService.ts

2. Ask Claude to create handler files:
   - handlers/messageHandler.ts
   - handlers/orderTrackingHandler.ts
   - handlers/quickReplyHandler.ts

3. Update index.ts with new orchestrator code

4. Test locally: supabase functions serve chatbot-process

5. Deploy: supabase functions deploy chatbot-process
