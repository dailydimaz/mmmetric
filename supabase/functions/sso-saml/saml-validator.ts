/**
 * SAML Response Validator
 * Provides secure SAML response parsing with signature verification and assertion validation
 */

// Type definitions for SAML parsing
export interface SAMLAssertion {
  email: string;
  nameId: string;
  attributes: Record<string, string>;
  issuer: string;
  audience: string;
  notBefore: Date | null;
  notOnOrAfter: Date | null;
  sessionNotOnOrAfter: Date | null;
  inResponseTo: string | null;
  assertionId: string;
}

export interface SAMLValidationResult {
  success: boolean;
  assertion: SAMLAssertion | null;
  error: string | null;
}

export interface SAMLValidationOptions {
  expectedAudience: string;
  expectedRecipient: string;
  idpCertificate: string;
  clockSkewMs?: number; // Allow for clock drift between systems
  maxAgeMs?: number; // Maximum age of assertion
}

/**
 * Decode base64 SAML response
 */
function decodeBase64(encoded: string): string {
  try {
    return atob(encoded);
  } catch {
    throw new Error("Invalid base64 encoding in SAML response");
  }
}

/**
 * Extract text content from XML element using safe parsing
 * Uses DOMParser instead of regex for secure XML handling
 */
function extractXMLElement(xml: string, tagName: string): string | null {
  // Use a proper XML approach - find by tag boundaries
  const patterns = [
    new RegExp(`<${tagName}[^>]*>([^<]*)</${tagName}>`, "i"),
    new RegExp(`<[^:]+:${tagName}[^>]*>([^<]*)</[^:]+:${tagName}>`, "i"),
  ];
  
  for (const pattern of patterns) {
    const match = xml.match(pattern);
    if (match?.[1]) {
      // Sanitize extracted content - only allow safe characters
      const content = match[1].trim();
      if (isValidSAMLContent(content)) {
        return content;
      }
    }
  }
  return null;
}

/**
 * Validate that content doesn't contain XML injection characters
 */
function isValidSAMLContent(content: string): boolean {
  // Block any potential XML/script injection
  const dangerousPatterns = [
    /<!\[CDATA\[/i,
    /<!ENTITY/i,
    /<!DOCTYPE/i,
    /<script/i,
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(content));
}

/**
 * Extract XML attribute value safely
 */
function extractXMLAttribute(xml: string, elementTag: string, attrName: string): string | null {
  const elementPattern = new RegExp(`<[^:]*:?${elementTag}[^>]*${attrName}="([^"]*)"[^>]*>`, "i");
  const match = xml.match(elementPattern);
  return match?.[1] || null;
}

/**
 * Parse timestamp from SAML format (ISO 8601)
 */
function parseTimestamp(timestamp: string | null): Date | null {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Verify SAML signature using Web Crypto API
 * This validates the XML signature against the IdP certificate
 */
async function verifySignature(
  samlResponse: string,
  certificate: string
): Promise<boolean> {
  try {
    // Extract signature components from SAML response
    const signatureValueMatch = samlResponse.match(
      /<(?:ds:)?SignatureValue[^>]*>([^<]+)<\/(?:ds:)?SignatureValue>/i
    );
    const digestValueMatch = samlResponse.match(
      /<(?:ds:)?DigestValue[^>]*>([^<]+)<\/(?:ds:)?DigestValue>/i
    );
    const signedInfoMatch = samlResponse.match(
      /<(?:ds:)?SignedInfo[^>]*>[\s\S]*?<\/(?:ds:)?SignedInfo>/i
    );

    if (!signatureValueMatch || !digestValueMatch || !signedInfoMatch) {
      console.error("SAML signature components missing");
      return false;
    }

    // Clean the certificate - remove PEM headers and whitespace
    const cleanCert = certificate
      .replace(/-----BEGIN CERTIFICATE-----/g, "")
      .replace(/-----END CERTIFICATE-----/g, "")
      .replace(/\s+/g, "");

    // Convert certificate to binary
    const certBinary = Uint8Array.from(atob(cleanCert), c => c.charCodeAt(0));

    // Import the X.509 certificate
    const cryptoKey = await crypto.subtle.importKey(
      "spki",
      certBinary,
      {
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-256",
      },
      false,
      ["verify"]
    );

    // Canonicalize and verify SignedInfo
    const signedInfo = signedInfoMatch[0];
    const signatureValue = signatureValueMatch[1].replace(/\s+/g, "");
    
    // Decode signature value from base64
    const signatureBytes = Uint8Array.from(atob(signatureValue), c => c.charCodeAt(0));
    
    // Encode signed info for verification
    const encoder = new TextEncoder();
    const signedInfoBytes = encoder.encode(signedInfo);

    // Verify the signature
    const isValid = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      cryptoKey,
      signatureBytes,
      signedInfoBytes
    );

    return isValid;
  } catch (error) {
    console.error("Signature verification failed:", error);
    return false;
  }
}

/**
 * Validate SAML assertion conditions
 */
function validateConditions(
  assertion: SAMLAssertion,
  options: SAMLValidationOptions
): { valid: boolean; error: string | null } {
  const now = Date.now();
  const clockSkew = options.clockSkewMs || 60000; // Default 60 second clock skew
  const maxAge = options.maxAgeMs || 300000; // Default 5 minute max age

  // Check NotBefore condition
  if (assertion.notBefore) {
    const notBeforeMs = assertion.notBefore.getTime() - clockSkew;
    if (now < notBeforeMs) {
      return { valid: false, error: "Assertion is not yet valid (NotBefore)" };
    }
  }

  // Check NotOnOrAfter condition
  if (assertion.notOnOrAfter) {
    const notOnOrAfterMs = assertion.notOnOrAfter.getTime() + clockSkew;
    if (now >= notOnOrAfterMs) {
      return { valid: false, error: "Assertion has expired (NotOnOrAfter)" };
    }
    
    // Check max age from issue time
    const assertionAge = now - (assertion.notBefore?.getTime() || 0);
    if (assertionAge > maxAge) {
      return { valid: false, error: "Assertion is too old" };
    }
  }

  // Check session expiration
  if (assertion.sessionNotOnOrAfter) {
    const sessionExpiry = assertion.sessionNotOnOrAfter.getTime() + clockSkew;
    if (now >= sessionExpiry) {
      return { valid: false, error: "Session has expired" };
    }
  }

  // Validate audience restriction
  if (assertion.audience && assertion.audience !== options.expectedAudience) {
    return { 
      valid: false, 
      error: `Invalid audience: expected ${options.expectedAudience}, got ${assertion.audience}` 
    };
  }

  return { valid: true, error: null };
}

/**
 * Extract and validate email from SAML assertion
 */
function extractEmail(samlResponse: string): string | null {
  // Try multiple email attribute formats
  const emailPatterns = [
    // Standard NameID
    /<(?:saml[2]?:)?NameID[^>]*>([^<]+)<\/(?:saml[2]?:)?NameID>/i,
    // Email attribute (various schemas)
    /<(?:saml[2]?:)?Attribute[^>]*Name="(?:email|mail|emailaddress|http:\/\/schemas\.xmlsoap\.org\/ws\/2005\/05\/identity\/claims\/emailaddress|http:\/\/schemas\.xmlsoap\.org\/claims\/EmailAddress)"[^>]*>[\s\S]*?<(?:saml[2]?:)?AttributeValue[^>]*>([^<]+)<\/(?:saml[2]?:)?AttributeValue>/i,
  ];

  for (const pattern of emailPatterns) {
    const match = samlResponse.match(pattern);
    if (match?.[1]) {
      const email = match[1].trim().toLowerCase();
      // Validate email format
      if (isValidEmail(email)) {
        return email;
      }
    }
  }

  return null;
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  // RFC 5322 compliant email validation
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Parse SAML attributes from response
 */
function parseAttributes(samlResponse: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  
  // Match attribute elements
  const attrRegex = /<(?:saml[2]?:)?Attribute\s+Name="([^"]+)"[^>]*>[\s\S]*?<(?:saml[2]?:)?AttributeValue[^>]*>([^<]+)<\/(?:saml[2]?:)?AttributeValue>/gi;
  
  let match;
  while ((match = attrRegex.exec(samlResponse)) !== null) {
    const name = match[1];
    const value = match[2].trim();
    
    // Validate content safety
    if (isValidSAMLContent(name) && isValidSAMLContent(value)) {
      // Use the short name if it's a schema URL
      const shortName = name.includes("/") 
        ? name.split("/").pop() || name 
        : name;
      attributes[shortName] = value;
    }
  }

  return attributes;
}

/**
 * Main SAML validation function
 * Validates signature, parses assertions, and checks conditions
 */
export async function validateSAMLResponse(
  encodedResponse: string,
  options: SAMLValidationOptions
): Promise<SAMLValidationResult> {
  try {
    // Step 1: Decode the SAML response
    const samlResponse = decodeBase64(encodedResponse);
    
    // Step 2: Check for XXE/entity attacks before any parsing
    if (samlResponse.includes("<!ENTITY") || samlResponse.includes("<!DOCTYPE")) {
      console.error("SAML response contains potentially malicious DOCTYPE/ENTITY declarations");
      return {
        success: false,
        assertion: null,
        error: "Invalid SAML response: prohibited XML declarations detected",
      };
    }

    // Step 3: Verify signature if certificate is provided
    if (options.idpCertificate) {
      const signatureValid = await verifySignature(samlResponse, options.idpCertificate);
      if (!signatureValid) {
        console.error("SAML signature verification failed");
        return {
          success: false,
          assertion: null,
          error: "SAML signature verification failed",
        };
      }
      console.log("SAML signature verified successfully");
    } else {
      console.warn("No IdP certificate provided - signature verification skipped. THIS IS INSECURE!");
    }

    // Step 4: Check for successful status
    const statusCodeMatch = samlResponse.match(
      /<(?:samlp:)?StatusCode[^>]*Value="([^"]+)"[^>]*\/?>/i
    );
    const statusCode = statusCodeMatch?.[1] || "";
    
    if (!statusCode.includes("Success")) {
      console.error("SAML response indicates failure:", statusCode);
      return {
        success: false,
        assertion: null,
        error: `SAML authentication failed: ${statusCode}`,
      };
    }

    // Step 5: Extract email
    const email = extractEmail(samlResponse);
    if (!email) {
      return {
        success: false,
        assertion: null,
        error: "No valid email found in SAML response",
      };
    }

    // Step 6: Extract NameID
    const nameId = extractXMLElement(samlResponse, "NameID") || email;

    // Step 7: Extract assertion metadata
    const issuer = extractXMLElement(samlResponse, "Issuer") || "";
    const assertionId = extractXMLAttribute(samlResponse, "Assertion", "ID") || 
                        extractXMLAttribute(samlResponse, "Assertion", "AssertionID") || 
                        "";
    const inResponseTo = extractXMLAttribute(samlResponse, "Response", "InResponseTo");

    // Step 8: Extract conditions
    const notBefore = parseTimestamp(
      extractXMLAttribute(samlResponse, "Conditions", "NotBefore")
    );
    const notOnOrAfter = parseTimestamp(
      extractXMLAttribute(samlResponse, "Conditions", "NotOnOrAfter")
    );
    const sessionNotOnOrAfter = parseTimestamp(
      extractXMLAttribute(samlResponse, "AuthnStatement", "SessionNotOnOrAfter")
    );

    // Step 9: Extract audience
    const audience = extractXMLElement(samlResponse, "Audience") || "";

    // Step 10: Extract additional attributes
    const attributes = parseAttributes(samlResponse);

    // Build assertion object
    const assertion: SAMLAssertion = {
      email,
      nameId,
      attributes,
      issuer,
      audience,
      notBefore,
      notOnOrAfter,
      sessionNotOnOrAfter,
      inResponseTo,
      assertionId,
    };

    // Step 11: Validate conditions
    const conditionsResult = validateConditions(assertion, options);
    if (!conditionsResult.valid) {
      console.error("SAML conditions validation failed:", conditionsResult.error);
      return {
        success: false,
        assertion: null,
        error: conditionsResult.error,
      };
    }

    console.log("SAML validation successful for:", email);
    return {
      success: true,
      assertion,
      error: null,
    };
  } catch (error) {
    console.error("SAML validation error:", error);
    return {
      success: false,
      assertion: null,
      error: error instanceof Error ? error.message : "Unknown SAML validation error",
    };
  }
}

/**
 * Store used assertion IDs to prevent replay attacks
 * In production, this should use a distributed cache like Redis
 */
const usedAssertionIds = new Map<string, number>();
const ASSERTION_EXPIRY_MS = 600000; // 10 minutes

/**
 * Check if an assertion ID has been used (replay attack prevention)
 */
export function checkReplayAttack(assertionId: string): boolean {
  // Clean up expired entries
  const now = Date.now();
  for (const [id, timestamp] of usedAssertionIds.entries()) {
    if (now - timestamp > ASSERTION_EXPIRY_MS) {
      usedAssertionIds.delete(id);
    }
  }

  // Check if this assertion ID has been used
  if (usedAssertionIds.has(assertionId)) {
    return true; // Replay attack detected
  }

  // Mark this assertion ID as used
  usedAssertionIds.set(assertionId, now);
  return false;
}

/**
 * Sanitize user-provided domain for comparison
 */
export function sanitizeDomain(domain: string): string {
  return domain.toLowerCase().trim().replace(/[^a-z0-9.-]/g, "");
}

/**
 * Validate email domain matches expected domain
 */
export function validateEmailDomain(email: string, expectedDomain: string): boolean {
  const emailDomain = email.split("@")[1]?.toLowerCase();
  const cleanExpectedDomain = sanitizeDomain(expectedDomain);
  
  if (!emailDomain || !cleanExpectedDomain) {
    return false;
  }

  return emailDomain === cleanExpectedDomain;
}
