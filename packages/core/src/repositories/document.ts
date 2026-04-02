import type { Document } from "@willdesign-hr/types";

export interface DocumentRepository {
  save(metadata: Document): Promise<Document>;
  findByEmployee(employeeId: string): Promise<readonly Document[]>;
  getUploadUrl(employeeId: string, fileName: string): Promise<string>;
  getDownloadUrl(employeeId: string, documentId: string): Promise<string>;
}
