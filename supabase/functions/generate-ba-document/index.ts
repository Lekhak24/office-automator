import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DocumentRequest {
  type: "user-story" | "brd" | "frd";
  context: string;
  projectName?: string;
  additionalRequirements?: string;
}

const systemPrompts = {
  "user-story": `You are an expert Business Analyst specializing in creating clear, actionable user stories in Agile format.

Format each user story as:
**Title:** [Short descriptive title]
**User Story:** As a [type of user], I want [goal] so that [benefit].
**Acceptance Criteria:**
- Given [context], when [action], then [expected result]
- [Additional criteria as needed]
**Priority:** [High/Medium/Low]
**Story Points:** [Estimate]
**Notes:** [Any additional context]

Generate comprehensive, well-structured user stories based on the requirements provided.`,

  "brd": `You are an expert Business Analyst creating comprehensive Business Requirements Documents (BRD).

Structure the BRD with these sections:
1. **Executive Summary** - Brief overview of the business need
2. **Business Objectives** - Clear, measurable goals
3. **Current State Analysis** - Existing processes and pain points
4. **Proposed Solution** - High-level solution approach
5. **Scope** - In-scope and out-of-scope items
6. **Stakeholders** - Key people and their roles
7. **Business Requirements** - Detailed functional requirements
8. **Non-Functional Requirements** - Performance, security, scalability
9. **Assumptions & Constraints** - Known limitations
10. **Dependencies** - External factors
11. **Success Metrics** - KPIs and measurement criteria
12. **Timeline & Milestones** - High-level schedule
13. **Risks & Mitigation** - Potential issues and solutions
14. **Appendix** - Supporting materials

Create a professional, detailed BRD based on the provided context.`,

  "frd": `You are an expert Business Analyst creating detailed Functional Requirements Documents (FRD).

Structure the FRD with these sections:
1. **Document Control** - Version, date, author, reviewers
2. **Introduction** - Purpose, scope, definitions
3. **System Overview** - High-level architecture
4. **Functional Requirements**
   - FR-001: [Requirement title]
     - Description: [Detailed description]
     - Priority: [Must Have/Should Have/Could Have/Won't Have]
     - Source: [Where this requirement came from]
     - Acceptance Criteria: [How to verify]
5. **User Interface Requirements** - Screen layouts, navigation
6. **Data Requirements** - Data entities, relationships
7. **Integration Requirements** - External systems, APIs
8. **Security Requirements** - Authentication, authorization
9. **Performance Requirements** - Response times, capacity
10. **Error Handling** - Exception scenarios
11. **Traceability Matrix** - Requirements to features mapping

Create a comprehensive, technically detailed FRD based on the provided context.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, context, projectName, additionalRequirements } = await req.json() as DocumentRequest;

    if (!type || !context) {
      throw new Error("Missing required fields: type and context");
    }

    const systemPrompt = systemPrompts[type];
    if (!systemPrompt) {
      throw new Error("Invalid document type");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const userPrompt = `
Project: ${projectName || "Not specified"}
Context/Requirements: ${context}
${additionalRequirements ? `Additional Requirements: ${additionalRequirements}` : ""}

Please generate a comprehensive ${type === "user-story" ? "set of user stories" : type === "brd" ? "Business Requirements Document" : "Functional Requirements Document"} based on the above information.
`;

    console.log(`Generating ${type} document for project: ${projectName}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI API error:", errorText);
      throw new Error("Failed to generate document");
    }

    const data = await response.json();
    const generatedDocument = data.choices[0].message.content;

    console.log(`Successfully generated ${type} document`);

    return new Response(
      JSON.stringify({
        success: true,
        type,
        document: generatedDocument,
        projectName,
        generatedAt: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error generating document:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
