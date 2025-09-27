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
    // Create PDF in landscape orientation for certificate
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

      // Set black background to match website theme
      this.doc.setFillColor(25, 25, 35); // Dark background matching the website
      this.doc.rect(0, 0, this.pageWidth, this.pageHeight, "F");

      // Add professional styling with green and white theme
      this.addPremiumBorder();
      await this.addPremiumHeader();
      this.addPremiumContent(data);
      await this.addPremiumQRCode(data.certificateId);

      console.log("✅ Professional certificate generated successfully");
      return this.doc.output("blob");
    } catch (error) {
      console.error("❌ Error generating certificate:", error);
      throw new Error("Failed to generate certificate");
    }
  }

  private addProfessionalBackground(): void {
    this.doc.setDrawColor(35, 35, 45);
    this.doc.setLineWidth(0.2);

    // Create elegant hexagonal pattern
    const hexSize = 8;
    const spacing = 14;

    for (let x = 0; x < this.pageWidth; x += spacing) {
      for (let y = 0; y < this.pageHeight; y += spacing * 0.866) {
        const offsetX = (y / (spacing * 0.866)) % 2 === 0 ? 0 : spacing / 2;
        this.drawHexagon(x + offsetX, y, hexSize);
      }
    }
  }

  private drawHexagon(centerX: number, centerY: number, size: number): void {
    const points: [number, number][] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const x = centerX + size * Math.cos(angle);
      const y = centerY + size * Math.sin(angle);
      points.push([x, y]);
    }

    for (let i = 0; i < points.length; i++) {
      const [x1, y1] = points[i];
      const [x2, y2] = points[(i + 1) % points.length];
      this.doc.line(x1, y1, x2, y2);
    }
  }

  private addProfessionalBorders(): void {
    // Outer border with rounded corners effect
    this.doc.setDrawColor(0, 255, 65);
    this.doc.setLineWidth(3);
    this.doc.rect(15, 15, this.pageWidth - 30, this.pageHeight - 30);

    // Inner decorative border
    this.doc.setLineWidth(1);
    this.doc.rect(20, 20, this.pageWidth - 40, this.pageHeight - 40);

    // Accent lines at corners
    this.addCornerAccents();
  }

  private addCornerAccents(): void {
    const cornerLength = 15;
    const offset = 25;

    this.doc.setDrawColor(0, 255, 65);
    this.doc.setLineWidth(2);

    // Top-left corner
    this.doc.line(offset, offset, offset + cornerLength, offset);
    this.doc.line(offset, offset, offset, offset + cornerLength);

    // Top-right corner
    this.doc.line(
      this.pageWidth - offset - cornerLength,
      offset,
      this.pageWidth - offset,
      offset
    );
    this.doc.line(
      this.pageWidth - offset,
      offset,
      this.pageWidth - offset,
      offset + cornerLength
    );

    // Bottom-left corner
    this.doc.line(
      offset,
      this.pageHeight - offset - cornerLength,
      offset,
      this.pageHeight - offset
    );
    this.doc.line(
      offset,
      this.pageHeight - offset,
      offset + cornerLength,
      this.pageHeight - offset
    );

    // Bottom-right corner
    this.doc.line(
      this.pageWidth - offset,
      this.pageHeight - offset - cornerLength,
      this.pageWidth - offset,
      this.pageHeight - offset
    );
    this.doc.line(
      this.pageWidth - offset - cornerLength,
      this.pageHeight - offset,
      this.pageWidth - offset,
      this.pageHeight - offset
    );
  }

  private async addProfessionalHeader(): Promise<void> {
    try {
      const logoResponse = await fetch("/logo.png");
      const logoBlob = await logoResponse.blob();
      const logoDataURL = await this.blobToDataURL(logoBlob);

      const logoSize = 20;
      const logoX = 40;
      const logoY = 35;

      this.doc.addImage(logoDataURL, "PNG", logoX, logoY, logoSize, logoSize);
    } catch (error) {
      console.error("Error loading logo:", error);
      // Fallback: Professional text logo
      this.doc.setTextColor(0, 255, 65);
      this.doc.setFontSize(14);
      this.doc.setFont("helvetica", "bold");
      this.doc.text("AlienVault", 40, 45);
    }

    // Institution name and tagline
    this.doc.setTextColor(180, 180, 190);
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "normal");
    this.doc.text("PROFESSIONAL CERTIFICATION AUTHORITY", 70, 42);
    this.doc.text("Excellence in Digital Education", 70, 50);
  }

  private addCertificateTitle(): void {
    this.doc.setTextColor(0, 255, 65);
    this.doc.setFontSize(32);
    this.doc.setFont("helvetica", "bold");
    const title = "CERTIFICATE OF ACHIEVEMENT";
    this.doc.text(title, this.pageWidth / 2, 80, { align: "center" });

    // Add decorative underline
    this.doc.setDrawColor(0, 255, 65);
    this.doc.setLineWidth(1);
    const titleWidth = this.doc.getTextWidth(title);
    const startX = (this.pageWidth - titleWidth) / 2;
    this.doc.line(startX, 85, startX + titleWidth, 85);
  }

  private addPresentationText(): void {
    this.doc.setTextColor(200, 200, 210);
    this.doc.setFontSize(12);
    this.doc.setFont("helvetica", "normal");
    const text = "This is to certify that";
    this.doc.text(text, this.pageWidth / 2, 100, { align: "center" });
  }

  private addStudentNameSection(studentName: string): void {
    console.log("📝 Adding student name section for:", studentName);

    // Add elegant background highlight for name (subtle green)
    this.doc.setFillColor(0, 255, 65, 0.05); // Very light green
    const nameWidth = this.doc.getTextWidth(studentName) * 1.5;
    const nameHeight = 18;
    const nameX = (this.pageWidth - nameWidth) / 2;
    const nameY = 108;

    this.doc.rect(nameX, nameY, nameWidth, nameHeight, "F");

    this.doc.setTextColor(0, 255, 65);
    this.doc.setFontSize(26);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(studentName, this.pageWidth / 2, 122, { align: "center" });

    // Add decorative flourishes
    this.addNameDecorations();
  }

  private addNameDecorations(): void {
    const centerX = this.pageWidth / 2;
    const y = 122; // Match the new name position

    this.doc.setDrawColor(0, 255, 65);
    this.doc.setLineWidth(1);

    // Left decoration
    this.doc.line(centerX - 80, y + 5, centerX - 60, y + 5);
    this.doc.line(centerX - 75, y, centerX - 65, y + 10);

    // Right decoration
    this.doc.line(centerX + 60, y + 5, centerX + 80, y + 5);
    this.doc.line(centerX + 65, y, centerX + 75, y + 10);
  }

  private addAchievementText(): void {
    this.doc.setTextColor(200, 200, 210);
    this.doc.setFontSize(12);
    this.doc.setFont("helvetica", "normal");
    const text = "has successfully completed the comprehensive course";
    this.doc.text(text, this.pageWidth / 2, 140, { align: "center" });
  }

  private addCourseNameSection(courseName: string): void {
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(16);
    this.doc.setFont("helvetica", "bold");

    // Handle long course names by wrapping text
    const maxWidth = this.pageWidth - 80;
    const lines = this.doc.splitTextToSize(`"${courseName}"`, maxWidth);

    let yPosition = 155;
    for (let i = 0; i < lines.length; i++) {
      this.doc.text(lines[i], this.pageWidth / 2, yPosition + i * 8, {
        align: "center",
      });
    }

    // Add subtle underline under the last line
    const lastLineY = yPosition + (lines.length - 1) * 8;
    this.doc.setDrawColor(100, 100, 120);
    this.doc.setLineWidth(0.5);
    const lastLineWidth = this.doc.getTextWidth(lines[lines.length - 1]);
    const startX = (this.pageWidth - lastLineWidth) / 2;
    this.doc.line(startX, lastLineY + 3, startX + lastLineWidth, lastLineY + 3);
  }

  private addPerformanceSection(data: CertificateData): void {
    const centerX = this.pageWidth / 2;
    const y = 185; // Adjusted for better spacing

    // Performance box background
    this.doc.setFillColor(35, 35, 45);
    this.doc.setDrawColor(0, 255, 65);
    this.doc.setLineWidth(1);
    this.doc.rect(centerX - 50, y - 8, 100, 18, "FD");

    this.doc.setTextColor(0, 255, 65);
    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "bold");
    const scoreText = `FINAL SCORE: ${data.score}% | ${data.marksObtained}/${data.totalMarks} MARKS`;
    this.doc.text(scoreText, centerX, y + 1, { align: "center" });
  }

  private addAuthenticationSection(
    completionDate: string,
    instructorName: string,
    certificateId: string
  ): void {
    const y = 210; // Adjusted positioning
    const leftX = 80;
    const rightX = this.pageWidth - 80;

    // Date section
    this.addAuthField("DATE OF COMPLETION", completionDate, leftX, y);

    // Instructor section
    this.addAuthField(
      "CERTIFIED BY",
      instructorName || "AlienVault Academy",
      rightX,
      y
    );

    // Certificate ID in center
    this.doc.setTextColor(120, 120, 130);
    this.doc.setFontSize(8);
    this.doc.setFont("helvetica", "normal");
    this.doc.text(
      `Certificate ID: ${certificateId}`,
      this.pageWidth / 2,
      y + 25,
      { align: "center" }
    );
  }

  private addAuthField(
    label: string,
    value: string,
    x: number,
    y: number
  ): void {
    // Label
    this.doc.setTextColor(150, 150, 160);
    this.doc.setFontSize(8);
    this.doc.setFont("helvetica", "normal");
    this.doc.text(label, x, y - 5, { align: "center" });

    // Value
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(value, x, y + 5, { align: "center" });

    // Underline
    this.doc.setDrawColor(0, 255, 65);
    this.doc.setLineWidth(0.5);
    this.doc.line(x - 30, y + 8, x + 30, y + 8);
  }

  private async addSignatureSection(): Promise<void> {
    try {
      const signatureResponse = await fetch("/signature.png");
      if (signatureResponse.ok) {
        const signatureBlob = await signatureResponse.blob();
        const signatureDataURL = await this.blobToDataURL(signatureBlob);

        const sigWidth = 25;
        const sigHeight = 12;
        const sigX = this.pageWidth - 80 - sigWidth / 2;
        const sigY = 190; // Adjusted position

        this.doc.addImage(
          signatureDataURL,
          "PNG",
          sigX,
          sigY,
          sigWidth,
          sigHeight
        );
      }
    } catch (error) {
      // Add signature placeholder
      this.doc.setTextColor(100, 100, 110);
      this.doc.setFontSize(8);
      this.doc.text("Digital Signature", this.pageWidth - 80, 200, {
        align: "center",
      });
    }

    // Add official seal placeholder
    this.addOfficialSeal();
  }

  private addOfficialSeal(): void {
    const sealX = 80;
    const sealY = 190; // Adjusted position
    const sealRadius = 12;

    // Seal circle
    this.doc.setDrawColor(0, 255, 65);
    this.doc.setLineWidth(2);
    this.doc.circle(sealX, sealY, sealRadius);

    // Inner circle
    this.doc.setLineWidth(1);
    this.doc.circle(sealX, sealY, sealRadius - 3);

    // Seal text
    this.doc.setTextColor(0, 255, 65);
    this.doc.setFontSize(6);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("OFFICIAL", sealX, sealY - 2, { align: "center" });
    this.doc.text("SEAL", sealX, sealY + 3, { align: "center" });
  }

  private async addProfessionalFooter(): Promise<void> {
    const footerY = this.pageHeight - 25;

    try {
      const logoResponse = await fetch("/logo.png");
      const logoBlob = await logoResponse.blob();
      const logoDataURL = await this.blobToDataURL(logoBlob);

      const logoSize = 15;
      const logoX = (this.pageWidth - logoSize) / 2;

      this.doc.addImage(
        logoDataURL,
        "PNG",
        logoX,
        footerY - 10,
        logoSize,
        logoSize
      );
    } catch (error) {
      console.error("Error loading footer logo:", error);
    }

    // Footer text
    this.doc.setTextColor(0, 255, 65);
    this.doc.setFontSize(8);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("ALIENVAULT ACADEMY", this.pageWidth / 2, footerY + 8, {
      align: "center",
    });

    this.doc.setTextColor(120, 120, 130);
    this.doc.setFontSize(6);
    this.doc.setFont("helvetica", "normal");
    this.doc.text(
      "Advancing Digital Excellence Through Innovation",
      this.pageWidth / 2,
      footerY + 12,
      {
        align: "center",
      }
    );
  }

  private async addSecurityElements(certificateId: string): Promise<void> {
    // Subtle watermark
    this.doc.setTextColor(40, 40, 50);
    this.doc.setFontSize(60);
    this.doc.setFont("helvetica", "bold");

    // Save current state
    this.doc.saveGraphicsState();

    // Rotate and add watermark
    const centerX = this.pageWidth / 2;
    const centerY = this.pageHeight / 2;

    this.doc.text("VERIFIED", centerX, centerY, {
      align: "center",
      angle: -45,
    });

    this.doc.restoreGraphicsState();

    // Add QR code with verification URL
    await this.addQRCode(certificateId);
  }

  private async addQRCode(certificateId: string): Promise<void> {
    try {
      const qrSize = 20;
      const qrX = this.pageWidth - 30;
      const qrY = this.pageHeight - 40;

      // Generate verification URL
      const verificationUrl = `${window.location.origin}/verify-certificate?id=${certificateId}&source=qr`;

      console.log("🔗 Generating QR code for:", verificationUrl);

      // Generate QR code with standard black/white colors
      const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
        width: 256,
        margin: 1,
        color: {
          dark: "#000000", // Standard black
          light: "#FFFFFF", // Standard white
        },
      });

      console.log("✅ QR code generated successfully with standard colors");

      // Add QR code to PDF
      this.doc.addImage(qrCodeDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

      // QR label
      this.doc.setTextColor(0, 255, 65);
      this.doc.setFontSize(6);
      this.doc.setFont("helvetica", "bold");
      this.doc.text("SCAN TO VERIFY", qrX + qrSize / 2, qrY + qrSize + 5, {
        align: "center",
      });
    } catch (error) {
      console.error("❌ Error generating QR code:", error);
      // Fallback to placeholder if QR generation fails
      this.addQRPlaceholder();
    }
  }

  private addQRPlaceholder(): void {
    const qrSize = 15;
    const qrX = this.pageWidth - 35;
    const qrY = this.pageHeight - 35;

    // QR code border
    this.doc.setDrawColor(100, 100, 110);
    this.doc.setLineWidth(0.5);
    this.doc.rect(qrX, qrY, qrSize, qrSize);

    // QR pattern simulation
    this.doc.setFillColor(100, 100, 110);
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        if ((i + j) % 2 === 0) {
          this.doc.rect(qrX + i * 3, qrY + j * 3, 2, 2, "F");
        }
      }
    }

    // QR label
    this.doc.setTextColor(100, 100, 110);
    this.doc.setFontSize(6);
    this.doc.text("VERIFY", qrX + qrSize / 2, qrY + qrSize + 5, {
      align: "center",
    });
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
      console.log("📁 Starting download process...");
      console.log("📁 Blob size:", blob.size, "bytes");
      console.log("📁 Filename:", filename);

      const url = URL.createObjectURL(blob);
      console.log("🔗 Object URL created:", url);

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.style.display = "none"; // Hide the link

      console.log("🔗 Link element created:", link);

      document.body.appendChild(link);
      console.log("🔗 Link added to document");

      link.click();
      console.log("🔗 Link clicked - download should start");

      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log("🗞️ Cleanup completed");
      }, 100);
    } catch (error) {
      console.error("❌ Download failed:", error);
      throw error;
    }
  }

  // ============ PREMIUM PROFESSIONAL DESIGN ============

  private addPremiumBorder(): void {
    // Elegant double border design
    this.doc.setDrawColor(30, 30, 35);
    this.doc.setLineWidth(3);
    this.doc.rect(20, 20, this.pageWidth - 40, this.pageHeight - 40);

    this.doc.setDrawColor(0, 200, 50);
    this.doc.setLineWidth(1);
    this.doc.rect(25, 25, this.pageWidth - 50, this.pageHeight - 50);

    // Corner decorations
    this.addElegantCorners();
  }

  private addElegantCorners(): void {
    const size = 12;
    const offset = 30;

    this.doc.setDrawColor(0, 200, 50);
    this.doc.setLineWidth(2);

    // Top corners
    this.doc.line(offset, offset + size, offset + size, offset);
    this.doc.line(
      this.pageWidth - offset - size,
      offset,
      this.pageWidth - offset,
      offset + size
    );

    // Bottom corners
    this.doc.line(
      offset,
      this.pageHeight - offset - size,
      offset + size,
      this.pageHeight - offset
    );
    this.doc.line(
      this.pageWidth - offset - size,
      this.pageHeight - offset,
      this.pageWidth - offset,
      this.pageHeight - offset - size
    );
  }

  private async addPremiumHeader(): Promise<void> {
    try {
      const logoResponse = await fetch("/logo.png");
      const logoBlob = await logoResponse.blob();
      const logoDataURL = await this.blobToDataURL(logoBlob);

      this.doc.addImage(logoDataURL, "PNG", 40, 40, 20, 20);
    } catch (error) {
      // Elegant text fallback in green
      this.doc.setTextColor(0, 255, 65); // Bright green for logo text
      this.doc.setFontSize(16);
      this.doc.setFont("helvetica", "bold");
      this.doc.text("AlienVault", 40, 55);
    }

    // Institution details in white
    this.doc.setTextColor(0, 255, 65);
    this.doc.setFontSize(20);
    this.doc.setFont("helvetica", "normal");
    this.doc.text("Teacher's Choice", 70, 50);
    // this.doc.setFontSize(16);
    // this.doc.text("Professional Certification Authority", 70, 58);
  }

  private addPremiumContent(data: CertificateData): void {
    // Main title with elegant styling in white
    this.doc.setTextColor(255, 255, 255); // White text
    this.doc.setFontSize(36);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("CERTIFICATE", this.pageWidth / 2, 90, { align: "center" });

    this.doc.setFontSize(20);
    this.doc.setFont("helvetica", "normal");
    this.doc.text("OF ACHIEVEMENT", this.pageWidth / 2, 110, {
      align: "center",
    });

    // Elegant divider in green
    this.doc.setDrawColor(0, 255, 65); // Bright green
    this.doc.setLineWidth(2);
    this.doc.line(this.pageWidth / 2 - 80, 115, this.pageWidth / 2 + 80, 115);

    // Certification text in light gray
    this.doc.setTextColor(200, 200, 200); // Light gray
    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "normal");
    this.doc.text("This is to certify that", this.pageWidth / 2, 135, {
      align: "center",
    });

    // Student name with premium styling in green
    this.doc.setTextColor(0, 255, 65); // Bright green for name
    this.doc.setFontSize(32);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(data.studentName, this.pageWidth / 2, 160, {
      align: "center",
    });

    // Name underline in green
    const nameWidth = this.doc.getTextWidth(data.studentName);
    this.doc.setDrawColor(0, 255, 65);
    this.doc.setLineWidth(1.5);
    this.doc.line(
      this.pageWidth / 2 - nameWidth / 2,
      165,
      this.pageWidth / 2 + nameWidth / 2,
      165
    );

    // Achievement text in light gray
    this.doc.setTextColor(200, 200, 200);
    this.doc.setFontSize(12);
    this.doc.setFont("helvetica", "normal");
    this.doc.text(
      "has successfully completed the comprehensive course",
      this.pageWidth / 2,
      180,
      { align: "center" }
    );

    // Course name with FIXED wrapping to stay within frame
    this.doc.setTextColor(255, 255, 255); // White text
    this.doc.setFontSize(14); // Reduced font size to fit better
    this.doc.setFont("helvetica", "bold");

    const maxWidth = this.pageWidth - 120; // More conservative margin
    const lines = this.doc.splitTextToSize(`"${data.courseName}"`, maxWidth);

    let yPosition = 200;
    // Limit to maximum 2 lines to prevent overflow
    const maxLines = Math.min(lines.length, 2);
    for (let i = 0; i < maxLines; i++) {
      this.doc.text(lines[i], this.pageWidth / 2, yPosition + i * 8, {
        align: "center",
      });
    }

    // Performance section with proper positioning
    const scoreY = yPosition + maxLines * 8 + 20;
    this.doc.setFillColor(40, 40, 45); // Dark gray background
    this.doc.setDrawColor(0, 255, 65); // Green border
    this.doc.setLineWidth(1);
    this.doc.rect(this.pageWidth / 2 - 80, scoreY - 8, 160, 20, "FD");

    this.doc.setTextColor(0, 255, 65); // Green text for score
    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "bold");
    const scoreText = `Final Score: ${data.score}% • ${data.marksObtained}/${data.totalMarks} Points`;
    this.doc.text(scoreText, this.pageWidth / 2, scoreY + 3, {
      align: "center",
    });

    // Footer section with proper spacing
    const footerY = this.pageHeight - 60;

    // Date in light gray
    this.doc.setTextColor(180, 180, 180);
    this.doc.setFontSize(9);
    this.doc.setFont("helvetica", "normal");
    this.doc.text("DATE OF COMPLETION", 60, footerY - 5);

    this.doc.setTextColor(255, 255, 255); // White text
    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(data.completionDate, 60, footerY + 5);

    // Instructor in light gray
    this.doc.setTextColor(180, 180, 180);
    this.doc.setFontSize(9);
    this.doc.setFont("helvetica", "normal");
    this.doc.text("CERTIFIED BY", this.pageWidth - 60, footerY - 5, {
      align: "center",
    });

    this.doc.setTextColor(255, 255, 255); // White text
    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(
      data.instructorName || "AlienVault Academy",
      this.pageWidth - 60,
      footerY + 5,
      { align: "center" }
    );

    // // Certificate ID in light gray
    // this.doc.setTextColor(150, 150, 150);
    // this.doc.setFontSize(8);
    // this.doc.setFont("helvetica", "normal");
    // this.doc.text(
    //   `Certificate ID: ${data.certificateId}`,
    //   this.pageWidth / 2,
    //   this.pageHeight - 35,
    //   { align: "center" }
    // );
  }

  private async addPremiumQRCode(certificateId: string): Promise<void> {
    try {
      const qrSize = 30;
      const qrX = this.pageWidth - 70;
      const qrY = 40;

      const verificationUrl = `${window.location.origin}/verify-certificate?id=${certificateId}&source=qr`;

      const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
        width: 256,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      this.doc.addImage(qrCodeDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

      // QR label
      this.doc.setTextColor(80, 80, 85);
      this.doc.setFontSize(8);
      this.doc.setFont("helvetica", "normal");
      //   this.doc.text("Scan to Verify", qrX + qrSize / 2, qrY + qrSize + 8, {
      //     align: "center",
      //   });
    } catch (error) {
      console.error("Error generating QR code:", error);
    }
  }
}

// Factory function for easy usage
export const generateAndDownloadCertificate = async (
  data: CertificateData
): Promise<void> => {
  try {
    console.log("🏆 Starting certificate generation with data:", data);

    const generator = new CertificateGenerator();
    const blob = await generator.generateCertificate(data);

    console.log("📄 Certificate blob generated:", blob.size, "bytes");

    const filename = `${data.studentName.replace(/\s+/g, "_")}_Certificate_${
      data.certificateId
    }.pdf`;

    console.log("📁 Downloading as:", filename);

    generator.downloadCertificate(blob, filename);

    console.log("✅ Certificate download initiated");
  } catch (error) {
    console.error("❌ Certificate generation failed:", error);
    throw error;
  }
};
