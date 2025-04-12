// Follow the Supabase Edge function setup instructions here:
// https://supabase.com/docs/guides/functions

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

interface RequestBody {
  content: string;
  existingTags: string[];
}

serve(async (req) => {
  try {
    // Parse request body
    const { content, existingTags = [] } = await req.json() as RequestBody;
    
    if (!content || content.trim().length < 20) {
      return new Response(
        JSON.stringify({ suggestedTags: [] }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Extract key themes and emotions from the content
    // This is where we'd integrate with Llama or any other LLM
    // For now, we'll use a simplified approach to represent the basic logic
    
    // Format prompt for tag extraction
    const prompt = `
    Journal Entry:
    ${content.substring(0, 1500)} // Limit length to avoid token limits
    
    Based on this journal entry, suggest 3-5 relevant tags that represent the key themes and emotions.
    Choose specific and meaningful tags rather than generic ones. Focus on emotions, activities, relationships, or concepts mentioned.
    
    The user already has these tags: ${existingTags.join(', ')}
    
    Return only new tags not already in the list above. Format your response as a comma-separated list of tags:
    `;
    
    // In a production scenario, this would be an actual API call to Llama
    // For demonstration purposes, we'll simulate tag extraction
    
    // In a real implementation, you would call an LLM API here
    // const llamaResponse = await fetch('your-llama-api-endpoint', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ prompt })
    // });
    // const llmOutput = await llamaResponse.json();
    // Parse the LLM output to extract tags
    
    // For demonstration, we'll simulate an LLM response with keyword extraction
    const simulatedTags = simulateTagExtraction(content, existingTags);
    
    return new Response(
      JSON.stringify({ suggestedTags: simulatedTags }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in tag suggestion edge function:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process tag suggestions', details: error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
})

// Helper function to simulate LLM tag extraction
function simulateTagExtraction(content: string, existingTags: string[]): string[] {
  const contentLower = content.toLowerCase();
  
  // Define patterns to look for
  const patterns: Record<string, RegExp[]> = {
    'accomplishment': [/accomplish/i, /achieve/i, /complete/i, /finish/i, /success/i],
    'challenge': [/challeng/i, /difficult/i, /hard/i, /struggle/i, /overcome/i],
    'inspiration': [/inspir/i, /motivat/i, /uplift/i, /creativ/i],
    'reflection': [/reflect/i, /think/i, /contemplate/i, /ponder/i],
    'gratitude': [/grateful/i, /thankful/i, /appreciat/i, /blessing/i],
    'frustration': [/frustrat/i, /annoyed/i, /irritate/i, /bother/i],
    'joy': [/joy/i, /happy/i, /delight/i, /excite/i, /cheer/i],
    'sadness': [/sad/i, /unhappy/i, /down/i, /depress/i, /blue/i, /melanchol/i],
    'anxiety': [/anxi/i, /worry/i, /stress/i, /nervous/i, /fear/i, /panic/i],
    'anger': [/anger/i, /angry/i, /rage/i, /furious/i, /upset/i, /mad/i],
    'hope': [/hope/i, /optimis/i, /anticipat/i, /look forward/i, /positive/i],
    'confusion': [/confus/i, /unclear/i, /uncertain/i, /puzzl/i, /perplex/i],
    'love': [/love/i, /affection/i, /care/i, /adore/i, /fond/i],
    'family': [/family/i, /parent/i, /child/i, /mom/i, /dad/i, /brother/i, /sister/i],
    'work': [/work/i, /job/i, /career/i, /profession/i, /office/i],
    'school': [/school/i, /study/i, /class/i, /learn/i, /education/i, /university/i, /college/i],
    'health': [/health/i, /wellness/i, /fitness/i, /exercise/i, /diet/i, /nutrition/i],
    'relationships': [/relationship/i, /friend/i, /partner/i, /boyfriend/i, /girlfriend/i, /husband/i, /wife/i],
    'self-care': [/self-care/i, /self care/i, /care for myself/i, /pamper/i, /relax/i, /rest/i],
    'growth': [/growth/i, /development/i, /progress/i, /improve/i, /better/i],
    'mindfulness': [/mindful/i, /present/i, /aware/i, /attention/i, /conscious/i],
    'productivity': [/productiv/i, /efficient/i, /effective/i, /accomplish/i],
    'creativity': [/creativ/i, /art/i, /write/i, /paint/i, /draw/i, /music/i, /sing/i, /dance/i],
    'dreams': [/dream/i, /aspiration/i, /goal/i, /ambition/i, /wish/i],
    'travel': [/travel/i, /trip/i, /journey/i, /adventure/i, /explore/i, /vacation/i],
    'nature': [/nature/i, /outdoor/i, /outside/i, /hike/i, /walk/i, /garden/i, /plant/i]
  };
  
  // Check for matches
  const matches: string[] = [];
  
  Object.entries(patterns).forEach(([tag, regexList]) => {
    if (!existingTags.includes(tag) && regexList.some(regex => regex.test(contentLower))) {
      matches.push(tag);
    }
  });
  
  // Return up to 5 tags, prioritizing emotion tags
  return matches.slice(0, 5);
}
