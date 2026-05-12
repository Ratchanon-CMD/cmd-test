import PDFDocument from "pdfkit/js/pdfkit.standalone";

type TagInput = {
  eventName: string;
  referenceCode: string;
  name: string;
  organization?: string | null;
  jobTitle?: string | null;
};

export async function createNameTagPdf(input: TagInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const document = new PDFDocument({
      size: [360, 240],
      margin: 24
    });
    const chunks: Buffer[] = [];

    document.on("data", (chunk: Buffer) => chunks.push(chunk));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);

    document
      .rect(0, 0, 360, 240)
      .fill("#f8fafc")
      .fillColor("#0f172a")
      .fontSize(12)
      .text(input.eventName, 24, 24, { align: "center", width: 312 })
      .moveDown();

    document
      .fontSize(30)
      .fillColor("#111827")
      .text(input.name, 24, 72, {
        align: "center",
        width: 312
      });

    document
      .fontSize(14)
      .fillColor("#475569")
      .text(input.jobTitle || "Participant", 24, 124, {
        align: "center",
        width: 312
      })
      .text(input.organization || "", 24, 146, {
        align: "center",
        width: 312
      });

    document
      .roundedRect(94, 186, 172, 30, 6)
      .fill("#111827")
      .fillColor("#ffffff")
      .fontSize(13)
      .text(input.referenceCode, 94, 195, {
        align: "center",
        width: 172
      });

    document.end();
  });
}
