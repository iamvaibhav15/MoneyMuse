const Tesseract = require('tesseract.js');
const pdfParse = require('pdf-parse');
const fs = require('fs');

class ReceiptParser {
  static async extractFromImage(filePath) {
    try {
      const { data: { text } } = await Tesseract.recognize(filePath, 'eng', {
        logger: m => console.log(m)
      });

      return this.parseReceiptText(text);
    } catch (error) {
      console.error('Error extracting text from image:', error);
      throw new Error('Failed to extract text from image');
    }
  }

  static async extractFromPDF(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      
      return this.parseReceiptText(data.text);
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  static parseReceiptText(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    let merchant = '';
    let total = 0;
    let date = null;
    const items = [];
    let confidence = 0.5;

    // Extract merchant (usually first few lines)
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      if (lines[i].length > 3 && !this.isPrice(lines[i]) && !this.isDate(lines[i])) {
        merchant = lines[i];
        break;
      }
    }

    // Extract total amount
    const totalPatterns = [
      /total[:\s]*\$?(\d+\.?\d*)/i,
      /amount[:\s]*\$?(\d+\.?\d*)/i,
      /\$(\d+\.\d{2})/g
    ];

    for (const pattern of totalPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        const amounts = matches.map(match => {
          const num = match.match(/(\d+\.?\d*)/);
          return num ? parseFloat(num[1]) : 0;
        });
        total = Math.max(...amounts);
        if (total > 0) break;
      }
    }

    // Extract date
    const datePatterns = [
      /(\d{1,2}\/\d{1,2}\/\d{2,4})/,
      /(\d{1,2}-\d{1,2}-\d{2,4})/,
      /(\d{4}-\d{1,2}-\d{1,2})/
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        date = new Date(match[1]);
        if (!isNaN(date.getTime())) break;
      }
    }

    // Extract line items
    lines.forEach(line => {
      const itemMatch = line.match(/(.+?)\s+\$?(\d+\.?\d*)/);
      if (itemMatch && !line.toLowerCase().includes('total')) {
        const name = itemMatch[1].trim();
        const price = parseFloat(itemMatch[2]);
        if (name.length > 2 && price > 0) {
          items.push({
            name,
            price,
            quantity: 1
          });
        }
      }
    });

    // Calculate confidence based on extracted data
    if (merchant) confidence += 0.2;
    if (total > 0) confidence += 0.2;
    if (date) confidence += 0.1;
    if (items.length > 0) confidence += 0.1;

    return {
      merchant: merchant || 'Unknown Merchant',
      total: total || 0,
      date: date || new Date(),
      items,
      confidence: Math.min(confidence, 1.0),
      rawText: text
    };
  }

  static isPrice(text) {
    return /\$?\d+\.?\d*/.test(text);
  }

  static isDate(text) {
    return /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(text);
  }
}

module.exports = ReceiptParser;