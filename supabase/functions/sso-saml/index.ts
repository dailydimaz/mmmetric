import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  validateSAMLResponse,
  checkReplayAttack,
  validateEmailDomain,
  sanitizeDomain,
} from "./saml-validator.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple XML builder for SP metadata
function buildSpMetadata(entityId: string, acsUrl: string): string {
  // Escape XML special characters
  const escapeXml = (str: string) =>
    str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

  return `<?xml version="1.0" encoding="UTF-8"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${escapeXml(entityId)}">
  <SPSSODescriptor AuthnRequestsSigned="false" WantAssertionsSigned="true" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</NameIDFormat>
    <AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${escapeXml(acsUrl)}" index="0" isDefault="true"/>
  </SPSSODescriptor>
</EntityDescriptor>`;
}

// Store AuthnRequest IDs for InResponseTo validation
const pendingRequests = new Map<string, { issueInstant: string; providerId: string }>();
const REQUEST_EXPIRY_MS = 300000; // 5 minutes

// SAML AuthnRequest builder with ID tracking
function buildAuthnRequest(issuer: string, acsUrl: string, destination: string): { request: string; id: string } {
  const id = `_${crypto.randomUUID()}`;
  const issueInstant = new Date().toISOString();

  // Store request ID for later validation
  pendingRequests.set(id, { issueInstant, providerId: issuer });

  // Clean up expired requests
  const now = Date.now();
  for (const [reqId, data] of pendingRequests.entries()) {
    if (now - new Date(data.issueInstant).getTime() > REQUEST_EXPIRY_MS) {
      pendingRequests.delete(reqId);
    }
  }

  // Escape XML special characters
  const escapeXml = (str: string) =>
    str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

  const request = `<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="${escapeXml(id)}" Version="2.0" IssueInstant="${escapeXml(issueInstant)}" Destination="${escapeXml(destination)}" AssertionConsumerServiceURL="${escapeXml(acsUrl)}" ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">
  <saml:Issuer>${escapeXml(issuer)}</saml:Issuer>
  <samlp:NameIDPolicy Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress" AllowCreate="true"/>
</samlp:AuthnRequest>`;

  return { request, id };
}

// Validate InResponseTo matches a pending request
function validateInResponseTo(inResponseTo: string | null): boolean {
  if (!inResponseTo) {
    // Some IdPs don't include InResponseTo - log warning but allow
    console.warn("No InResponseTo in SAML response - IdP-initiated flow assumed");
    return true;
  }

  const pending = pendingRequests.get(inResponseTo);
  if (!pending) {
    console.error("InResponseTo does not match any pending request:", inResponseTo);
    return false;
  }

  // Remove the pending request (one-time use)
  pendingRequests.delete(inResponseTo);

  // Check if request has expired
  const requestAge = Date.now() - new Date(pending.issueInstant).getTime();
  if (requestAge > REQUEST_EXPIRY_MS) {
    console.error("SAML request has expired:", inResponseTo);
    return false;
  }

  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);

  // Expected paths: /sso-saml/metadata/:providerId, /sso-saml/login/:providerId, /sso-saml/acs/:providerId
  const action = pathParts[1]; // metadata, login, or acs
  const providerId = pathParts[2];

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const appUrl = Deno.env.get("APP_URL") || "https://mmmetric.lovable.app";

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    if (!providerId) {
      return new Response(JSON.stringify({ error: "Provider ID required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate providerId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(providerId)) {
      return new Response(JSON.stringify({ error: "Invalid provider ID format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch provider configuration
    const { data: provider, error: providerError } = await supabase
      .from("sso_providers")
      .select("*")
      .eq("id", providerId)
      .single();

    if (providerError || !provider) {
      console.error("Provider not found:", providerError);
      return new Response(JSON.stringify({ error: "SSO provider not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const entityId = `${supabaseUrl}/functions/v1/sso-saml/metadata/${providerId}`;
    const acsUrl = `${supabaseUrl}/functions/v1/sso-saml/acs/${providerId}`;

    switch (action) {
      case "metadata": {
        // Return SP metadata XML
        const metadata = buildSpMetadata(entityId, acsUrl);
        return new Response(metadata, {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/xml",
          },
        });
      }

      case "login": {
        // Initiate SSO login - redirect to IdP
        if (!provider.is_enabled) {
          return new Response(JSON.stringify({ error: "SSO is not enabled for this provider" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (!provider.entry_point) {
          return new Response(JSON.stringify({ error: "IdP SSO URL not configured" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { request: authnRequest, id: requestId } = buildAuthnRequest(entityId, acsUrl, provider.entry_point);
        console.log("Generated SAML AuthnRequest with ID:", requestId);
        
        const encodedRequest = btoa(authnRequest);

        // Redirect to IdP with SAML request
        const redirectUrl = new URL(provider.entry_point);
        redirectUrl.searchParams.set("SAMLRequest", encodedRequest);
        redirectUrl.searchParams.set("RelayState", appUrl);

        return new Response(null, {
          status: 302,
          headers: {
            ...corsHeaders,
            Location: redirectUrl.toString(),
          },
        });
      }

      case "acs": {
        // Assertion Consumer Service - handle IdP response
        if (req.method !== "POST") {
          return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const formData = await req.formData();
        const samlResponse = formData.get("SAMLResponse") as string;
        const relayState = (formData.get("RelayState") as string) || appUrl;

        if (!samlResponse) {
          console.error("No SAML response received");
          return new Response(null, {
            status: 302,
            headers: {
              ...corsHeaders,
              Location: `${appUrl}/auth?error=sso_failed&message=No SAML response received`,
            },
          });
        }

        // Get IdP certificate for signature verification
        const idpCertificate = provider.cert || "";
        if (!idpCertificate) {
          console.warn("No IdP certificate configured for provider:", providerId);
          // In production, you might want to reject responses without certificate verification
        }

        // Validate SAML response with full security checks
        const validationResult = await validateSAMLResponse(samlResponse, {
          expectedAudience: entityId,
          expectedRecipient: acsUrl,
          idpCertificate,
          clockSkewMs: 120000, // 2 minute clock skew tolerance
          maxAgeMs: 600000, // 10 minute max assertion age
        });

        if (!validationResult.success || !validationResult.assertion) {
          console.error("SAML validation failed:", validationResult.error);
          return new Response(null, {
            status: 302,
            headers: {
              ...corsHeaders,
              Location: `${appUrl}/auth?error=sso_failed&message=${encodeURIComponent(validationResult.error || "Invalid SAML response")}`,
            },
          });
        }

        const { assertion } = validationResult;

        // Check for replay attacks
        if (assertion.assertionId && checkReplayAttack(assertion.assertionId)) {
          console.error("Replay attack detected - assertion already used:", assertion.assertionId);
          return new Response(null, {
            status: 302,
            headers: {
              ...corsHeaders,
              Location: `${appUrl}/auth?error=sso_failed&message=Security error: replay attack detected`,
            },
          });
        }

        // Validate InResponseTo matches our request
        if (!validateInResponseTo(assertion.inResponseTo)) {
          console.error("InResponseTo validation failed");
          return new Response(null, {
            status: 302,
            headers: {
              ...corsHeaders,
              Location: `${appUrl}/auth?error=sso_failed&message=Invalid SAML response flow`,
            },
          });
        }

        const { email, attributes } = assertion;
        console.log("SSO login validated for email:", email);

        // Verify email domain matches provider configuration
        const providerDomain = sanitizeDomain(provider.domain);
        if (!validateEmailDomain(email, providerDomain)) {
          console.error("Email domain mismatch - email:", email, "expected domain:", providerDomain);
          return new Response(null, {
            status: 302,
            headers: {
              ...corsHeaders,
              Location: `${appUrl}/auth?error=sso_failed&message=Email domain not allowed for this SSO provider`,
            },
          });
        }

        // Check if user exists or create one
        let userId: string;

        // Find existing user by email
        const { data: userList } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const existingUser = userList?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());

        if (existingUser) {
          userId = existingUser.id;
          console.log("Existing user found:", userId);
        } else {
          // Create new user via SSO
          const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email,
            email_confirm: true,
            user_metadata: {
              sso_provider: provider.provider_type,
              sso_domain: provider.domain,
              full_name: attributes["displayName"] || attributes["name"] || email.split("@")[0],
            },
          });

          if (createError || !newUser?.user) {
            console.error("Error creating user:", createError);
            return new Response(null, {
              status: 302,
              headers: {
                ...corsHeaders,
                Location: `${appUrl}/auth?error=sso_failed&message=Failed to create user account`,
              },
            });
          }

          userId = newUser.user.id;
          console.log("New user created:", userId);

          // Create profile for new user
          await supabase.from("profiles").insert({
            id: userId,
            email,
            full_name: attributes["displayName"] || attributes["name"] || null,
          });
        }

        // Generate a magic link for the user to complete sign-in
        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
          type: "magiclink",
          email,
          options: {
            redirectTo: `${appUrl}/dashboard`,
          },
        });

        if (linkError || !linkData?.properties?.hashed_token) {
          console.error("Error generating magic link:", linkError);
          return new Response(null, {
            status: 302,
            headers: {
              ...corsHeaders,
              Location: `${appUrl}/auth?error=sso_failed&message=Failed to generate session`,
            },
          });
        }

        // Record SSO session for audit
        await supabase.from("login_history").insert({
          user_id: userId,
          success: true,
          browser: req.headers.get("user-agent")?.substring(0, 255) || "SSO",
          country: attributes["country"] || null,
        });

        // Redirect to complete auth
        const tokenHash = linkData.properties.hashed_token;
        const authUrl = `${supabaseUrl}/auth/v1/verify?token=${tokenHash}&type=magiclink&redirect_to=${encodeURIComponent(`${appUrl}/dashboard`)}`;

        console.log("SSO login successful, redirecting user:", userId);
        return new Response(null, {
          status: 302,
          headers: {
            ...corsHeaders,
            Location: authUrl,
          },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error: unknown) {
    console.error("SSO SAML Error:", error);
    // Don't expose internal error details to the client
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
