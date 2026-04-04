export const OPINION_SYSTEM_PROMPT = `You are a senior legal opinion expert specialising in Indian property law and banking compliance.
You generate legal opinions for law firms that serve as panel advocates for banks.

Your task is to produce a structured legal opinion draft based on the provided document data and template format.
The opinion must be in English, professional, and legally precise.

You MUST respond with a valid JSON object containing these fields:
{
  "summaryFindings": "Brief summary of key findings from the documents",
  "titleChainAnalysis": "Analysis of the chain of title based on extracted document data",
  "encumbranceAnalysis": "Analysis of any encumbrances, liens, or charges on the property",
  "riskObservations": "Key risks or red flags identified in the documents",
  "finalOpinion": "Overall legal opinion and recommendation",
  "recommendation": "POSITIVE" | "NEGATIVE" | "CONDITIONAL",
  "conditions": ["Array of conditions if recommendation is CONDITIONAL, otherwise empty array"]
}

Be thorough but concise. Flag any missing documents or data gaps as risks.`;

export function buildUserPrompt(params: {
  loanType: string;
  loanAmount?: number;
  propertyLocation?: string;
  bankClientName: string;
  endCustomerName?: string;
  templateContent?: Record<string, unknown>;
  documents: Array<{
    documentType: string;
    extractedData?: Record<string, any>;
    rawOcrText?: string;
  }>;
}): string {
  const parts: string[] = [];

  parts.push('## Opinion Request Details');
  parts.push(`- Loan Type: ${params.loanType}`);
  if (params.loanAmount) parts.push(`- Loan Amount: INR ${params.loanAmount.toLocaleString()}`);
  if (params.propertyLocation) parts.push(`- Property Location: ${params.propertyLocation}`);
  parts.push(`- Bank Client: ${params.bankClientName}`);
  if (params.endCustomerName) parts.push(`- Borrower: ${params.endCustomerName}`);

  if (params.templateContent) {
    parts.push('\n## Opinion Template Structure');
    parts.push('Follow this template format provided by the bank client:');
    parts.push('```json');
    parts.push(JSON.stringify(params.templateContent, null, 2));
    parts.push('```');
  }

  parts.push('\n## Uploaded Documents');
  if (params.documents.length === 0) {
    parts.push('No documents have been uploaded yet. Note this as a significant gap.');
  } else {
    for (const doc of params.documents) {
      parts.push(`\n### ${doc.documentType.replace(/_/g, ' ')}`);
      if (doc.extractedData && Object.keys(doc.extractedData).length > 0) {
        parts.push('Extracted Data:');
        parts.push('```json');
        parts.push(JSON.stringify(doc.extractedData, null, 2));
        parts.push('```');
      }
      if (doc.rawOcrText) {
        const preview = doc.rawOcrText.length > 2000
          ? doc.rawOcrText.slice(0, 2000) + '\n... (truncated)'
          : doc.rawOcrText;
        parts.push(`OCR Text:\n${preview}`);
      }
    }
  }

  parts.push('\nGenerate the legal opinion draft as a JSON object.');
  return parts.join('\n');
}
