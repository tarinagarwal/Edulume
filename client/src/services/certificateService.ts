import jsPDF from "jspdf";
import QRCode from "qrcode";

interface CertificateData {
  studentName: string;
  courseName: string;
  instructorName: string;
  completionDate: string;
  certificateId: string;
  score: number;
  totalMarks: number;
  marksObtained: number;
}

export class CertificateGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;

  constructor() {
    this.doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  async generateCertificate(data: CertificateData): Promise<Blob> {
    try {
      console.log("🏆 Starting professional certificate generation:", data);

      this.doc.setFillColor(252, 251, 247); // Warm cream background
      this.doc.rect(0, 0, this.pageWidth, this.pageHeight, "F");

      this.addMinimalBorder();
      await this.addCleanHeader();
      this.addElegantContent(data);
      await this.addProfessionalFooter(data);
      await this.addQRCode(data.certificateId);

      console.log("✅ Professional certificate generated successfully");
      return this.doc.output("blob");
    } catch (error) {
      console.error("❌ Error generating certificate:", error);
      throw new Error("Failed to generate certificate");
    }
  }

  private addMinimalBorder(): void {
    this.doc.setDrawColor(45, 45, 45); // Dark charcoal
    this.doc.setLineWidth(0.8);
    this.doc.rect(20, 15, this.pageWidth - 40, this.pageHeight - 30);

    this.doc.setDrawColor(180, 140, 90); // Warm gold accent
    this.doc.setLineWidth(0.3);
    this.doc.rect(22, 17, this.pageWidth - 44, this.pageHeight - 34);
  }

  private async addCleanHeader(): Promise<void> {
    try {
      const logoResponse = await fetch("/logo.png");
      const logoBlob = await logoResponse.blob();
      const logoDataURL = await this.blobToDataURL(logoBlob);

      const logoSize = 15;
      const logoX = 35;
      const logoY = 28;

      this.doc.addImage(logoDataURL, "PNG", logoX, logoY, logoSize, logoSize);
    } catch (error) {
      this.doc.setTextColor(45, 45, 45);
      this.doc.setFontSize(14);
      this.doc.setFont("times", "bold");
      this.doc.text("TC", 42, 40);
    }

    this.doc.setTextColor(45, 45, 45);
    this.doc.setFontSize(16);
    this.doc.setFont("times", "bold");
    this.doc.text("Edulume", 55, 35);

    this.doc.setFontSize(9);
    this.doc.setFont("times", "normal");
    this.doc.text("Your Ultimate Learning Hub", 55, 42);
  }

  private addElegantContent(data: CertificateData): void {
    const centerX = this.pageWidth / 2;

    this.doc.setTextColor(45, 45, 45);
    this.doc.setFontSize(48);
    this.doc.setFont("times", "bold");
    this.doc.text("Certificate", centerX, 70, { align: "center" });

    this.doc.setFontSize(24);
    this.doc.setFont("times", "normal");
    this.doc.text("of Achievement", centerX, 85, { align: "center" });

    this.doc.setDrawColor(180, 140, 90);
    this.doc.setLineWidth(1);
    this.doc.line(centerX - 60, 95, centerX + 60, 95);

    this.doc.setTextColor(80, 80, 80);
    this.doc.setFontSize(14);
    this.doc.setFont("times", "normal");
    this.doc.text("This is to certify that", centerX, 105, { align: "center" });

    this.doc.setTextColor(45, 45, 45);
    this.doc.setFontSize(32);
    this.doc.setFont("times", "bold");
    this.doc.text(data.studentName, centerX, 120, { align: "center" });

    this.doc.setTextColor(80, 80, 80);
    this.doc.setFontSize(14);
    this.doc.setFont("times", "normal");
    this.doc.text("has successfully completed the course", centerX, 130, {
      align: "center",
    });

    this.doc.setTextColor(45, 45, 45);
    this.doc.setFontSize(18);
    this.doc.setFont("times", "italic");

    const maxWidth = this.pageWidth - 100;
    const lines = this.doc.splitTextToSize(`"${data.courseName}"`, maxWidth);

    const courseStartY = 140;
    for (let i = 0; i < Math.min(lines.length, 2); i++) {
      this.doc.text(lines[i], centerX, courseStartY + i * 12, {
        align: "center",
      });
    }
  }

  private async addProfessionalFooter(data: CertificateData): Promise<void> {
    const footerY = this.pageHeight - 45;

    this.doc.setTextColor(100, 100, 100);
    this.doc.setFontSize(10);
    this.doc.setFont("times", "normal");
    this.doc.text("Date of Completion", 50, footerY + 10);

    this.doc.setTextColor(45, 45, 45);
    this.doc.setFontSize(12);
    this.doc.setFont("times", "bold");
    this.doc.text(data.completionDate, 50, footerY + 18);

    try {
      const signatureResponse = await fetch("/sign.png");
      if (signatureResponse.ok) {
        const signatureBlob = await signatureResponse.blob();
        const signatureDataURL = await this.blobToDataURL(signatureBlob);

        const sigWidth = 30;
        const sigHeight = 15;
        const sigX = this.pageWidth - 85;
        const sigY = footerY + 1;

        this.doc.addImage(
          signatureDataURL,
          "JPEG",
          sigX,
          sigY,
          sigWidth,
          sigHeight
        );
      }
    } catch (error) {
      console.error("Signature not found, using text fallback");
    }

    this.doc.setTextColor(45, 45, 45);
    this.doc.setFontSize(12);
    this.doc.setFont("times", "bold");
    this.doc.text("Tarin Agarwal", this.pageWidth - 70, footerY + 18, {
      align: "center",
    });
    this.doc.setTextColor(45, 45, 45);
    this.doc.setFontSize(12);
    this.doc.setFont("times", "bold");
    this.doc.text("(Founder & CEO)", this.pageWidth - 70, footerY + 22, {
      align: "center",
    });

    // this.doc.setTextColor(120, 120, 120);
    // this.doc.setFontSize(8);
    // this.doc.setFont("times", "normal");
    // this.doc.text(
    //   `Certificate ID: ${data.certificateId}`,
    //   this.pageWidth / 2,
    //   footerY + 15,
    //   { align: "center" }
    // );
  }

  private async addQRCode(certificateId: string): Promise<void> {
    try {
      const qrSize = 18;
      const qrX = this.pageWidth - 45;
      const qrY = this.pageHeight - 185;

      const verificationUrl = `${window.location.origin}/verify-certificate?id=${certificateId}&source=qr`;

      const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
        width: 256,
        margin: 1,
        color: {
          dark: "#2D2D2D", // Dark charcoal
          light: "#FCFBF7", // Cream background
        },
      });

      this.doc.addImage(qrCodeDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

      this.doc.setTextColor(120, 120, 120);
      this.doc.setFontSize(7);
      this.doc.setFont("times", "normal");
      this.doc.text("Verify", qrX + qrSize / 2, qrY + qrSize + 3, {
        align: "center",
      });
    } catch (error) {
      console.error("Error generating QR code:", error);
    }
  }

  private async blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  downloadCertificate(blob: Blob, filename: string): void {
    try {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error("❌ Download failed:", error);
      throw error;
    }
  }
}

export const generateAndDownloadCertificate = async (
  data: CertificateData
): Promise<void> => {
  try {
    console.log("🏆 Starting certificate generation with data:", data);

    const generator = new CertificateGenerator();
    const blob = await generator.generateCertificate(data);

    const filename = `${data.studentName.replace(/\s+/g, "_")}_Certificate_${
      data.certificateId
    }.pdf`;
    generator.downloadCertificate(blob, filename);

    console.log("✅ Certificate download initiated");
  } catch (error) {
    console.error("❌ Certificate generation failed:", error);
    throw error;
  }
};
