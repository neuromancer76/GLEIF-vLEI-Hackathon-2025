// Sample data for testing the VLEI Supplier Portal

export const sampleCompany = {
  companyName: "ACME Corporation",
  address: "123 Business Street, New York, NY 10001",
  prefix: "ACME",
  oobi: "http://localhost:5156/oobi/EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao"
};

export const sampleOrder = {
  orderId: "ORD-2024-001",
  description: "Supply chain management software development and implementation services for enterprise resource planning system integration",
  totalAmount: "150000.00",
  requester: sampleCompany,
  candidates: [
    {
      name: "Tech Solutions Inc.",
      address: "456 Tech Avenue, San Francisco, CA 94105", 
      lei: "549300ABCDEFGHIJK123",
      supplierEmail: "contact@techsolutions.com",
      applied: false
    },
    {
      name: "Global Systems Ltd.",
      address: "789 Innovation Drive, Austin, TX 78701",
      lei: "549300ZYXWVUTSRQPO987", 
      supplierEmail: "sales@globalsystems.com",
      applied: true
    },
    {
      name: "Digital Innovations Co.",
      address: "321 Digital Way, Seattle, WA 98101",
      lei: "549300MNOPQRSTUVWX456",
      supplierEmail: "info@digitalinnovations.com", 
      applied: false
    }
  ],
  createdAt: new Date().toISOString()
};

// Sample supplier invitation links for testing
export const sampleSupplierLinks = [
  "http://localhost:5173/supplier?orderId=ORD-2024-001&email=contact@techsolutions.com",
  "http://localhost:5173/supplier?orderId=ORD-2024-001&email=sales@globalsystems.com",
  "http://localhost:5173/supplier?orderId=ORD-2024-001&email=info@digitalinnovations.com"
];

// For easy copying during testing
console.log("Sample Company Data:", sampleCompany);
console.log("Sample Order Data:", sampleOrder);
console.log("Sample Supplier Links:", sampleSupplierLinks);