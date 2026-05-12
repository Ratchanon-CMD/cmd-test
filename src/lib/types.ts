export type DocumentView = {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
};

export type RegistrationView = {
  id: string;
  referenceCode: string;
  name: string;
  email: string;
  phone: string;
  organization: string | null;
  jobTitle: string | null;
  dietaryRequirements: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  documents: DocumentView[];
};
