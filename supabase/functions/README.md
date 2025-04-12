# Supabase Edge Functions for Path to Authenticity

This directory contains Edge Functions that can be deployed to Supabase to enhance the app's AI capabilities.

## Deploying the Tag Suggestion Function

The `suggest-tags` function uses AI to analyze journal entries and suggest relevant tags based on the content.

### Prerequisites

1. Install Supabase CLI: https://supabase.com/docs/guides/cli
2. Log in to Supabase CLI: `supabase login`
3. Link your project: `supabase link --project-ref <your-project-id>`

### Deployment Steps

1. Navigate to this directory in your terminal
2. Deploy the function:
   ```
   supabase functions deploy suggest-tags --no-verify-jwt
   ```
3. If you want to secure the function with JWT verification:
   ```
   supabase functions deploy suggest-tags
   ```

### Using the Function with Llama

The `suggest-tags` function is designed to work with Llama or other AI models. 

For Llama integration, you'll need to:

1. Deploy an instance of Llama accessible via API
2. Update the function to call your Llama API endpoint
3. Replace the placeholder code with actual API calls to Llama

### Local Testing

For local development, the app includes a fallback mechanism that will suggest tags based on keyword matching when the Edge Function is unavailable. This allows for testing the UI without deploying the Edge Function.

### Environment Variables

If you're using API keys for your AI service, you should set them as secrets:

```bash
supabase secrets set LLAMA_API_KEY=your-api-key
```

Then access them in your function using Deno.env:

```typescript
const apiKey = Deno.env.get('LLAMA_API_KEY')
```

### Function Structure

The function expects a POST request with a JSON body containing:
- `content`: The text content of the journal entry
- `existingTags`: An array of tags already applied to the entry

It returns a JSON response with:
- `suggestedTags`: An array of suggested tags for the entry
