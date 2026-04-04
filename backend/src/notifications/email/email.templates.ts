export function bankNotificationHtml(params: {
  bankName: string;
  referenceNumber: string;
  borrowerName: string;
  firmName: string;
  opinionNumber?: string;
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Legal Opinion Ready</h2>
      <p>Dear ${params.bankName},</p>
      <p>The legal opinion for the following request has been issued:</p>
      <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Reference</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${params.referenceNumber}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Borrower</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${params.borrowerName}</td></tr>
        ${params.opinionNumber ? `<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Opinion #</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${params.opinionNumber}</td></tr>` : ''}
      </table>
      <p>Please log in to the platform to view the complete opinion.</p>
      <p>Regards,<br/>${params.firmName}</p>
    </div>
  `;
}

export function endCustomerNotificationHtml(params: {
  customerName: string;
  referenceNumber: string;
  firmName: string;
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Legal Opinion Issued</h2>
      <p>Dear ${params.customerName},</p>
      <p>Your legal opinion (Reference: <strong>${params.referenceNumber}</strong>) has been issued by ${params.firmName}.</p>
      <p>Please contact your bank representative for further details.</p>
      <p>Regards,<br/>${params.firmName}</p>
    </div>
  `;
}
