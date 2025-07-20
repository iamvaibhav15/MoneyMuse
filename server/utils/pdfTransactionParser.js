const pdfParse = require('pdf-parse');
const fs = require('fs');

class PDFTransactionParser {
  static async parseTransactionHistory(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      
      return this.extractTransactions(data.text);
    } catch (error) {
      console.error('Error parsing PDF transaction history:', error);
      throw new Error('Failed to parse PDF transaction history');
    }
  }

  static extractTransactions(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    const transactions = [];
    
    // Common patterns for transaction data
    const transactionPattern = /^(\d{2}-\d{2}-\d{4})([A-Za-z\s]+?)(-?\d+(?:\.\d+)?)(income|expense)$/;

    lines.forEach((line, index) => {
      const match = line.match(transactionPattern);
      if (!match) return;
      const [_, dateStr, rawDesc, amountStr, type] = match;
      // Convert DD-MM-YYYY → JS Date
      const [dd, mm, yyyy] = dateStr.split('-');
      const date = new Date(`${yyyy}-${mm}-${dd}`);
      
      const amount = parseFloat(amountStr);
      const description = rawDesc.trim();

      transactions.push({
        date,
        description,
        amount: Math.abs(amount),
        type,                            
        category: this.categorizeTransaction(description),
        source: 'pdf_import',
        lineNumber: index + 1
      });
    });
    // Try table format parsing if no transactions found
    if (transactions.length === 0) {
      return this.parseTableFormat(lines);
    }

    return {
      transactions,
      totalFound: transactions.length,
      confidence: this.calculateConfidence(transactions, lines.length)
    };
  }

  static parseTableFormat(lines) {
    const transactions = [];
    let headerFound = false;
    let dateIndex = -1;
    let descIndex = -1;
    let amountIndex = -1;

    // Find header row
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      const line = lines[i].toLowerCase();
      if (line.includes('date') && line.includes('amount')) {
        headerFound = true;
        const parts = lines[i].split(/\s{2,}|\t/);
        
        parts.forEach((part, index) => {
          const lower = part.toLowerCase();
          if (lower.includes('date')) dateIndex = index;
          if (lower.includes('description') || lower.includes('memo')) descIndex = index;
          if (lower.includes('amount') || lower.includes('total')) amountIndex = index;
        });
        
        // Process subsequent lines as data
        for (let j = i + 1; j < lines.length; j++) {
          const dataParts = lines[j].split(/\s{2,}|\t/);
          if (dataParts.length >= 3) {
            const date = this.parseDate(dataParts[dateIndex] || dataParts[0]);
            const description = dataParts[descIndex] || dataParts[1] || 'Unknown';
            const amount = this.parseAmount(dataParts[amountIndex] || dataParts[dataParts.length - 1]);
            
            if (date && amount !== null) {
              transactions.push({
                date,
                description: description.trim(),
                amount: Math.abs(amount),
                type: amount < 0 ? 'expense' : 'income',
                category: this.categorizeTransaction(description),
                source: 'pdf_import'
              });
            }
          }
        }
        break;
      }
    }

    return {
      transactions,
      totalFound: transactions.length,
      confidence: headerFound ? 0.8 : 0.3
    };
  }

  static parseDate(dateStr) {
    if (!dateStr) return null;
    
    const cleanDate = dateStr.replace(/[^\d\/\-]/g, '');
    const date = new Date(cleanDate);
    
    return isNaN(date.getTime()) ? null : date;
  }

  static parseAmount(amountStr) {
    if (!amountStr) return null;
    
    const cleanAmount = amountStr.replace(/[^\d\.\-\+]/g, '');
    const amount = parseFloat(cleanAmount);
    
    return isNaN(amount) ? null : amount;
  }

  static categorizeTransaction(description) {
    const desc = description.toLowerCase();
    
    const categories = {
      'Food & Dining': ['restaurant', 'food', 'cafe', 'pizza', 'burger', 'starbucks', 'mcdonald'],
      'Shopping': ['amazon', 'walmart', 'target', 'store', 'shop', 'purchase'],
      'Transportation': ['gas', 'fuel', 'uber', 'lyft', 'taxi', 'parking', 'metro'],
      'Bills & Utilities': ['electric', 'water', 'internet', 'phone', 'cable', 'utility'],
      'Healthcare': ['pharmacy', 'doctor', 'hospital', 'medical', 'health'],
      'Entertainment': ['movie', 'netflix', 'spotify', 'game', 'entertainment'],
      'Income': ['salary', 'payroll', 'deposit', 'transfer in', 'refund']
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => desc.includes(keyword))) {
        return category;
      }
    }

    return 'Other';
  }

  static calculateConfidence(transactions, totalLines) {
    if (transactions.length === 0) return 0;
    
    const ratio = transactions.length / totalLines;
    let confidence = Math.min(ratio * 2, 1.0);
    
    // Boost confidence if we have good data quality
    const hasValidDates = transactions.every(t => t.date);
    const hasValidAmounts = transactions.every(t => t.amount > 0);
    const hasDescriptions = transactions.every(t => t.description.length > 3);
    
    if (hasValidDates) confidence += 0.1;
    if (hasValidAmounts) confidence += 0.1;
    if (hasDescriptions) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }
}

module.exports = PDFTransactionParser;