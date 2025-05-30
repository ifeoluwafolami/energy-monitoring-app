import { Workbook, Worksheet } from 'exceljs';
import { Request, Response } from 'express';
import path from 'path';
import { Feeder, IFeeder } from '../models/feeder.model';
import { FeederReading, IFeederReading } from '../models/feederReading.model';
import { Region } from '../models/region.model';
import { formatDate } from '../utils/formatDate';
import { BusinessHub } from '../models/businessHub.model';
import { sendEmailWithAttachment } from '../utils/sendEmailWithAttachment';
import cron from 'node-cron';

const TEMPLATE_PATH = path.join(__dirname, '../assets/Feeder_Performance_Template.xlsx');


interface IReportDateRange {
  startDate: Date;
  endDate: Date;
}

interface IReportParams {
  region?: string;
  businessHub?: string;
  dateRange: IReportDateRange;
}

const getColumnLetter = (colIndex: number): string => {
  let letter = '';
  let current = colIndex;
  
  while (current > 0) {
    const temp = (current - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    current = Math.floor((current - temp - 1) / 26);
  }
  
  return letter;
};

interface FailedChecks {
  feederName: string;
  businessHub: string;
  region: string;
  date: string;
  failedChecks: string[];
}

// Daily Report Generation -- Returns buffer
export const generateDailyAllFeedersReportBuffer = async (req: Request, res: Response): Promise<Buffer> => {
  try {
    const { specificDate } = req.query;
    let startDate: Date;
    let endDate: Date;

    if (specificDate) {
      startDate = new Date(specificDate as string);
      startDate.setUTCHours(0, 0, 0, 0);
      endDate = new Date(specificDate as string);
      endDate.setUTCHours(23, 59, 59, 999);
    } else {
      const today = new Date();
      const utcYear = today.getUTCFullYear();
      const utcMonth = today.getUTCMonth();
      const utcDate = today.getUTCDate();
      startDate = new Date(Date.UTC(utcYear, utcMonth, 1));
      endDate = new Date(Date.UTC(utcYear, utcMonth, utcDate));
      endDate.setUTCHours(23, 59, 59, 999);
    }

    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);
    
    const regions = await Region.find();
    if (regions.length === 0) {
      res.status(404).json({ message: "No regions found in the system" });
      return Buffer.alloc(0);
    }

    const feeders = await Feeder.find()
      .populate('businessHub', 'name')
      .populate('region', 'name')
      .sort({ region: 1, businessHub: 1, name: 1 });

    if (feeders.length === 0) {
      res.status(404).json({ message: "No feeders found in the system" });
      return Buffer.alloc(0);
    }

    const workbook = new Workbook();
    await workbook.xlsx.readFile(TEMPLATE_PATH);
    const worksheet = workbook.getWorksheet('Feeder Performance');

    if (!worksheet) throw new Error('Template worksheet not found');

    worksheet.getCell('F1').value = `FEEDER PERFORMANCE TRACKER (${startDateStr} TO ${endDateStr})`;

    const dates: Date[] = [];
    const currentDate = new Date(startDate);
    currentDate.setUTCHours(0, 0, 0, 0);
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    let columnIndex = 9; // Column I
    dates.forEach(date => {
      const formattedDate = formatDate(date);

      worksheet.mergeCells(`${getColumnLetter(columnIndex)}3:${getColumnLetter(columnIndex + 2)}3`);
      const headerCell = worksheet.getCell(`${getColumnLetter(columnIndex)}3`);
      headerCell.value = formattedDate;
      headerCell.alignment = { horizontal: 'center', vertical: 'middle' };
      headerCell.font = { bold: true };
      headerCell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };

      ['Nomination', 'Actual', 'Variance'].forEach((label, i) => {
        const col = columnIndex + i;
        const cell = worksheet.getCell(`${getColumnLetter(col)}4`);
        cell.value = label;
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF2F2F2' }
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.alignment = { horizontal: 'center' };
        worksheet.getColumn(col).width = 15;
      });

      for (let i = 0; i < 3; i++) {
        const col = columnIndex + i;
        const cell = worksheet.getCell(`${getColumnLetter(col)}5`);
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      }

      columnIndex += 4;
    });

    worksheet.getColumn(3).width = 35;
    worksheet.getColumn(1).width = 10;
    worksheet.getColumn(2).width = 20;
    worksheet.getColumn(4).width = 15;
    worksheet.getColumn(5).width = 15;
    worksheet.getColumn(6).width = 15;
    worksheet.getColumn(7).width = 15;

    const analysisCategories = [
      'Actual D-0 < Actual D-1',
      '< 70% Nom',
      '> 130% Nom',
      '< 70% Daily Uptake',
      '> 130% Daily Uptake',
      'Positive Variance',
      'No Flags',
      'Failed Checks Summary'
    ];

    analysisCategories.forEach(category => {
      const analysisSheet = workbook.addWorksheet(category);
      for (let col = 1; col <= worksheet.columnCount; col++) {
          for (let row = 1; row <= 4; row++) {
              const sourceCell = worksheet.getCell(row, col);
              const targetCell = analysisSheet.getCell(row, col);
              targetCell.value = sourceCell.value;
              targetCell.style = JSON.parse(JSON.stringify(sourceCell.style));
              if (sourceCell.isMerged) {
                  const mergedRanges = worksheet.model.merges;
                  for (const rangeStr of mergedRanges) {
                      const match = /^([A-Z]+)(\d+):([A-Z]+)(\d+)$/.exec(rangeStr);
                      if (match) {
                          const [, startCol, startRow, endCol, endRow] = match;
                          const colToNum = (col: string) => {
                              let num = 0;
                              for (let i = 0; i < col.length; i++) {
                                  num = num * 26 + (col.charCodeAt(i) - 64);
                              }
                              return num;
                          };
                          const top = parseInt(startRow, 10);
                          const left = colToNum(startCol);
                          const bottom = parseInt(endRow, 10);
                          const right = colToNum(endCol);

                          if (row >= top && row <= bottom && col >= left && col <= right) {
                              if (row === top && col === left) {
                                  analysisSheet.mergeCells(top, left, bottom, right);
                              }
                          }
                      }
                  }
              }
          }
      }
      for (let col = 1; col <= worksheet.columnCount; col++) {
        if (worksheet.getColumn(col).width) {
          analysisSheet.getColumn(col).width = worksheet.getColumn(col).width;
        }
      }
    });

    let rowIndex = 5;
    const feedersByRegion: { [key: string]: IFeeder[] } = {};
    const failedChecksSummary: FailedChecks[] = [];

    feeders.forEach(feeder => {
      const regionName = typeof feeder.region === 'object' ? (feeder.region as any).name : 'Unknown';
      if (!feedersByRegion[regionName]) {
        feedersByRegion[regionName] = [];
      }
      feedersByRegion[regionName].push(feeder);
    });

    let feederSerial = 1;

    for (const regionName of Object.keys(feedersByRegion)) {
      worksheet.getCell(`A${rowIndex}`).value = regionName;
      worksheet.mergeCells(`A${rowIndex}:G${rowIndex}`);
      const regionCell = worksheet.getCell(`A${rowIndex}`);
      regionCell.font = { bold: true, size: 14 };
      regionCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' }
      };
      regionCell.alignment = {
        horizontal: 'center',
        vertical: 'middle'
      };
      regionCell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      worksheet.getRow(rowIndex).height = 22;
      
      let dateColIndex = 9;
      for (let i = 0; i < dates.length; i++) {
        for (let j = 0; j < 3; j++) {
          const col = dateColIndex + j;
          const cell = worksheet.getCell(`${getColumnLetter(col)}${rowIndex}`);
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        }
        dateColIndex += 4;
      }
      
      rowIndex++;

      
    // Fetch all readings for all feeders in the date range, once
    const allReadings = await FeederReading.find({
    date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 }).lean();

    // Group readings by feeder._id as string
    const readingsByFeeder: { [feederId: string]: IFeederReading[] } = {};
    allReadings.forEach(reading => {
    const feederId = String(reading.feeder);
    if (!readingsByFeeder[feederId]) readingsByFeeder[feederId] = [];
    readingsByFeeder[feederId].push(reading);
    });

    for (const feeder of feedersByRegion[regionName]) {
    const readings = readingsByFeeder[String(feeder._id)] || [];
    const businessHubName = typeof feeder.businessHub === 'object' && feeder.businessHub !== null
        ? (feeder.businessHub as any).name
        : 'Unknown';

    const readingMap = new Map<string, IFeederReading>();
    readings.forEach(reading => {
        const dateKey = formatDate(reading.date);
        readingMap.set(dateKey, reading);
    });

    // --- 1. Populate Feeder Performance Sheet for ALL days ---
    let feederRowIndex = rowIndex;
    worksheet.getCell(`A${feederRowIndex}`).value = feederSerial++;
    worksheet.getCell(`B${feederRowIndex}`).value = businessHubName;
    worksheet.getCell(`C${feederRowIndex}`).value = feeder.name;
    worksheet.getCell(`D${feederRowIndex}`).value = regionName;
    worksheet.getCell(`E${feederRowIndex}`).value = feeder.band;
    worksheet.getCell(`F${feederRowIndex}`).value = feeder.dailyEnergyUptake;
    worksheet.getCell(`G${feederRowIndex}`).value = feeder.monthlyDeliveryPlan;

    for (let col = 1; col <= 7; col++) {
        const cell = worksheet.getCell(feederRowIndex, col);
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    }

    let dateColIndex = 9;
    let prevActual = 0;
    dates.forEach((date, i) => {
    const dateStr = formatDate(date);
    const reading = readingMap.get(dateStr);
    const nomination = feeder.dailyEnergyUptake * (i + 1);
    const actual = reading ? reading.cumulativeEnergyConsumption : prevActual;
    const variance = actual - nomination;

    // Nomination cell
    const nominationCell = worksheet.getCell(`${getColumnLetter(dateColIndex)}${feederRowIndex}`);
    nominationCell.value = nomination;
    nominationCell.border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
    };
    nominationCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Actual cell
    const actualCell = worksheet.getCell(`${getColumnLetter(dateColIndex + 1)}${feederRowIndex}`);
    actualCell.value = actual;
    actualCell.border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
    };
    actualCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Variance cell with color
    const varianceCell = worksheet.getCell(`${getColumnLetter(dateColIndex + 2)}${feederRowIndex}`);
    varianceCell.value = variance;
    varianceCell.border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
    };
    varianceCell.alignment = { horizontal: 'center', vertical: 'middle' };
    varianceCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: variance > 0 ? 'FFFF0000' : variance < 0 ? 'FF00FF00' : 'FFFFFFFF' } // Red for positive, green for negative, white for zero
    };

    prevActual = actual;
    dateColIndex += 4;
    });

    // --- 2. Compliance Checks: Only run on last day, but copy full row if failed ---
    const readingDates = readings.map(r => formatDate(r.date));
    const lastDateStr = readingDates.sort().slice(-1)[0];
    const lastReading = lastDateStr ? readingMap.get(lastDateStr) : undefined;

    let previousDayActual = 0;
    if (lastDateStr && lastReading) {
        const lastDateObj = new Date(lastReading.date);
        const prevDateObj = new Date(lastDateObj);
        prevDateObj.setUTCDate(lastDateObj.getUTCDate() - 1);
        const prevDateStr = formatDate(prevDateObj);
        const prevReading = readingMap.get(prevDateStr);
        previousDayActual = prevReading ? prevReading.cumulativeEnergyConsumption : 0;

        const dayIndex = dates.findIndex(d => formatDate(d) === lastDateStr) + 1;
        const nomination = feeder.dailyEnergyUptake * dayIndex;
        const actual = lastReading.cumulativeEnergyConsumption;
        const variance = actual - nomination;
        const dailyUptake = feeder.dailyEnergyUptake;

        const failedChecks: string[] = [];

        if (actual > 0) {
        if (dayIndex > 1 && actual <= previousDayActual) {
            failedChecks.push('Actual D-0 < Actual D-1');
            copyRowToAnalysisSheet(workbook, worksheet, feederRowIndex, 'Actual D-0 < Actual D-1');
        }
        if (actual < 0.7 * nomination) {
            failedChecks.push('< 70% Nom');
            copyRowToAnalysisSheet(workbook, worksheet, feederRowIndex, '< 70% Nom');
        } else if (actual > 1.3 * nomination) {
            failedChecks.push('> 130% Nom');
            copyRowToAnalysisSheet(workbook, worksheet, feederRowIndex, '> 130% Nom');
        }
        if (dayIndex > 1) {
            const dailyActual = actual - previousDayActual;
            if (dailyActual < 0.7 * dailyUptake) {
            failedChecks.push('< 70% Daily Uptake');
            copyRowToAnalysisSheet(workbook, worksheet, feederRowIndex, '< 70% Daily Uptake');
            } else if (dailyActual > 1.3 * dailyUptake) {
            failedChecks.push('> 130% Daily Uptake');
            copyRowToAnalysisSheet(workbook, worksheet, feederRowIndex, '> 130% Daily Uptake');
            }
        }
        if (variance >= 0) {
            copyRowToAnalysisSheet(workbook, worksheet, feederRowIndex, 'Positive Variance');
        }
        if (failedChecks.length === 0) {
            copyRowToAnalysisSheet(workbook, worksheet, feederRowIndex, 'No Flags');
        } else {
            failedChecksSummary.push({
            feederName: feeder.name,
            businessHub: businessHubName,
            region: regionName,
            date: lastDateStr,
            failedChecks: failedChecks
            });
        }
        }
    }

    rowIndex++;
    }
    }

    const summarySheet = workbook.getWorksheet('Failed Checks Summary');
    if (summarySheet) {
      let summaryRow = 5;
      
      summarySheet.getCell(`A${summaryRow}`).value = 'Region';
      summarySheet.getCell(`B${summaryRow}`).value = 'Business Hub';
      summarySheet.getCell(`C${summaryRow}`).value = 'Feeder Name';
      summarySheet.getCell(`D${summaryRow}`).value = 'Date';
      summarySheet.getCell(`E${summaryRow}`).value = 'Failed Checks';
      
      for (let col = 1; col <= 5; col++) {
        const cell = summarySheet.getCell(summaryRow, col);
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF2F2F2' }
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.alignment = { horizontal: 'center' };
      }
      
      summaryRow++;
      
      for (const check of failedChecksSummary) {
        summarySheet.getCell(`A${summaryRow}`).value = check.region;
        summarySheet.getCell(`B${summaryRow}`).value = check.businessHub;
        summarySheet.getCell(`C${summaryRow}`).value = check.feederName;
        summarySheet.getCell(`D${summaryRow}`).value = check.date;
        summarySheet.getCell(`E${summaryRow}`).value = check.failedChecks.join(', ');
        
        for (let col = 1; col <= 5; col++) {
          const cell = summarySheet.getCell(summaryRow, col);
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        }
        
        summaryRow++;
      }
      
      summarySheet.getColumn(1).width = 15;
      summarySheet.getColumn(2).width = 20;
      summarySheet.getColumn(3).width = 35;
      summarySheet.getColumn(4).width = 15;
      summarySheet.getColumn(5).width = 40;
    }

    worksheet.columns.forEach(col => {
      if (col && typeof col.eachCell === 'function') {
        col.eachCell({ includeEmpty: true }, cell => {
          cell.alignment = { vertical: 'middle', wrapText: true, ...cell.alignment };
        });
      }
    });

    // FILE DOWNLOAD
    // res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    // res.setHeader('Content-Disposition', `attachment; filename=Daily_Feeder_Report_${startDateStr}_to_${endDateStr}.xlsx`);
    // res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    // await workbook.xlsx.write(res);

    // Email Sending
    // 1. Generate the Excel buffer instead of streaming to response
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as Buffer;

    // res.end(); // Not needed after res.send
  } catch (error: any) {
    console.error('Error generating report:', error);
    res.status(500).json({ message: 'An error occurred while generating the report', error: error.message });
    return Buffer.alloc(0);
  }
};

const copyRowToAnalysisSheet = (workbook: Workbook, sourceWorksheet: any, rowIndex: number, targetSheetName: string): void => {
  const targetSheet = workbook.getWorksheet(targetSheetName);
  if (!targetSheet) return;

  // Only copy columns A-E for Failed Checks Summary, otherwise copy all columns
  const maxCol = targetSheetName === 'Failed Checks Summary' ? 5 : sourceWorksheet.columnCount;
  const targetRowIndex = targetSheet.rowCount + 1;

  for (let col = 1; col <= maxCol; col++) {
    const sourceCell = sourceWorksheet.getCell(rowIndex, col);
    const targetCell = targetSheet.getCell(targetRowIndex, col);

    targetCell.value = sourceCell.value;
    targetCell.style = JSON.parse(JSON.stringify(sourceCell.style));
  }
};

export const sendDailyAllFeedersReport = async (req: Request, res: Response): Promise<void> => {
    try {
        const reportBuffer: Buffer = await generateDailyAllFeedersReportBuffer(req, res);
        await sendEmailWithAttachment({
            to: "recipient@example.com",  // replace with actual recipient(s)
            subject: "Daily All Feeders Report",
            text: "Please find attached the daily feeders report.",
            attachmentBuffer: reportBuffer,
            filename: "DailyAllFeedersReport.xlsx",
        });

        res.status(200).json({ message: "Daily report sent successfully." });

    } catch (error) {
        console.error("Error sending daily report:", error);
        res.status(500).json({ error: "Failed to send daily report." });
    }
}


const generateFeederPerformanceWorkbook = async (
  region: string | undefined,
  businessHub: string | undefined,
  startDateStr: string,
  endDateStr: string
): Promise<Workbook> => {
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  const reportParams: IReportParams = {
    dateRange: { startDate, endDate }
  };
  if (region) reportParams.region = region;
  if (businessHub) reportParams.businessHub = businessHub;

  // Build feeder filter
  let feederFilter: any = {};
  if (region) {
    const regionDoc = await Region.findOne({ name: { $regex: new RegExp(`^${region}$`, 'i') } });
    if (!regionDoc) throw new Error(`Region '${region}' not found`);
    feederFilter.region = regionDoc._id;
  }

  if (businessHub) {
    const hubDoc = await BusinessHub.findOne({ name: { $regex: new RegExp(`^${businessHub}$`, 'i') } });
    if (!hubDoc) throw new Error(`Business Hub '${businessHub}' not found`);
    feederFilter.businessHub = hubDoc._id;
  }

  const feeders = await Feeder.find(feederFilter)
    .populate('businessHub', 'name')
    .populate('region', 'name');

  if (feeders.length === 0) throw new Error("No feeders found with the specified criteria");

  return await createReportFromTemplate(feeders, reportParams);
};


export const generateFeederPerformanceReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { region, businessHub, startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({ message: "Start and end dates are required" });
      return;
    }

    const workbook = await generateFeederPerformanceWorkbook(
      region as string | undefined,
      businessHub as string | undefined,
      startDate as string,
      endDate as string
    );

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=FeederPerformanceReport-${new Date().toISOString().split('T')[0]}.xlsx`);
    await workbook.xlsx.write(res);

  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to generate feeder performance report" });
  }
};

/**
 * Create report workbook from template and populate with data
 */
async function createReportFromTemplate(
  feeders: IFeeder[], 
  params: IReportParams
): Promise<Workbook> {
  // Load the template
  const workbook = new Workbook();
  await workbook.xlsx.readFile(TEMPLATE_PATH);
  
  // Get the main worksheet
  const worksheet = workbook.getWorksheet('Feeder Performance');
  
  if (!worksheet) {
    throw new Error('Template worksheet not found');
  }
  
  // Add region title in a merged cell - only if not already merged
  if (params.region) {
    // Check if already merged
    const isMerged = worksheet.getCell('A5').isMerged;
    if (!isMerged) {
      worksheet.mergeCells('A5:G5');
    }
    
    const regionCell = worksheet.getCell('A5');
    regionCell.value = `Region: ${params.region}`;
    regionCell.alignment = { horizontal: 'center', vertical: 'middle' };
    regionCell.font = { bold: true, size: 12 };
    
    // Add border to the region cell
    const border = { style: 'thin' as const, color: { argb: 'FF000000' } };
    regionCell.border = {
      top: border,
      left: border,
      bottom: border,
      right: border
    };
  }
  
  // Process dates in the date range
  const dates = getDatesInRange(params.dateRange);
  
  // Update headers with dates
  updateDateHeaders(worksheet, dates);
  
  // Populate feeder data
  await populateFeederData(worksheet, feeders, dates);
  
  return workbook;
}

/**
 * Get all dates in the specified range
 */
function getDatesInRange(dateRange: IReportDateRange): Date[] {
  const dates: Date[] = [];
  const currentDate = new Date(dateRange.startDate);
  
  while (currentDate <= dateRange.endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}

/**
 * Update worksheet headers with dates
 */
function updateDateHeaders(worksheet: Worksheet, dates: Date[]): void {
  // Start column index for dates (column I is the first date column - adding one column spacing)
  let columnIndex = 9; // I is the 9th column (0-indexed)
  
  // Define border style properly with type assertion
  const border = { style: 'thin' as const, color: { argb: 'FF000000' } };
  
  dates.forEach(date => {
    const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Set merged cell for date header - merge 3 columns
    const dateStartCol = getColumnLetter(columnIndex);
    const dateEndCol = getColumnLetter(columnIndex + 2);
    
    // Check if any of the cells in this range are already merged
    let canMerge = true;
    for (let i = columnIndex; i <= columnIndex + 2; i++) {
      if (worksheet.getCell(getColumnLetter(i) + '4').isMerged) {
        canMerge = false;
        break;
      }
    }
    
    // Only merge if none of the cells are already merged
    if (canMerge) {
      try {
        worksheet.mergeCells(`${dateStartCol}4:${dateEndCol}4`);
      } catch (error) {
        // If there's still an error, we'll just continue without merging
        console.warn(`Could not merge cells ${dateStartCol}4:${dateEndCol}4`, error);
      }
    }
    
    const dateCell = worksheet.getCell(`${dateStartCol}4`);
    dateCell.value = formattedDate;
    dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
    dateCell.font = { bold: true };
    
    // Add border to the date cell
    dateCell.border = {
      top: border,
      left: border,
      bottom: border,
      right: border
    };
    
    // Update the three sub-headers (Nomination, Actual, Variance)
    const nomCell = worksheet.getCell(`${getColumnLetter(columnIndex)}5`);
    nomCell.value = "Nomination";
    nomCell.border = {
      top: border,
      left: border,
      bottom: border,
      right: border
    };
    
    const actCell = worksheet.getCell(`${getColumnLetter(columnIndex + 1)}5`);
    actCell.value = "Actual";
    actCell.border = {
      top: border,
      left: border,
      bottom: border,
      right: border
    };
    
    const varCell = worksheet.getCell(`${getColumnLetter(columnIndex + 2)}5`);
    varCell.value = "Variance";
    varCell.border = {
      top: border,
      left: border,
      bottom: border,
      right: border
    };
    
    // Move to next date column set (each date has 3 columns plus 1 empty column for spacing)
    columnIndex += 4;
  });
}

/**
 * Populate worksheet with feeder data
 */
async function populateFeederData(
  worksheet: Worksheet, 
  feeders: IFeeder[], 
  dates: Date[]
): Promise<void> {
  // Start row for data (row 6 is the first data row after headers)
  let rowIndex = 6;
  
  // Define border style properly using type assertion
  const border = { style: 'thin' as const, color: { argb: 'FF000000' } };
  
  // Iterate through each feeder
  for (const feeder of feeders) {
    // Get readings for this feeder for all dates
    const feederReadings = await getFeederReadingsForDates((feeder._id as string).toString(), dates);
    
    // Populate static feeder info
    const cells = [
      worksheet.getCell(`A${rowIndex}`), // Index number
      worksheet.getCell(`B${rowIndex}`), // Business Hub name
      worksheet.getCell(`C${rowIndex}`), // Feeder name
      worksheet.getCell(`D${rowIndex}`), // Band
      worksheet.getCell(`E${rowIndex}`), // Previous Month Consumption
      worksheet.getCell(`F${rowIndex}`), // Monthly Delivery Plan
      worksheet.getCell(`G${rowIndex}`)  // Daily Energy Uptake
    ];
    
    cells[0].value = rowIndex - 5;
    cells[1].value = (feeder.businessHub as any)?.name || '';
    cells[2].value = feeder.name;
    cells[3].value = feeder.band;
    cells[4].value = feeder.previousMonthConsumption;
    cells[5].value = feeder.monthlyDeliveryPlan;
    cells[6].value = feeder.dailyEnergyUptake;
    
    // Add borders to all static cells
    cells.forEach(cell => {
      cell.border = {
        top: border,
        left: border,
        bottom: border,
        right: border
      };
    });
    
    // Start column for dates data (column I - adding one column spacing)
    let columnIndex = 9; // I is the 9th column (0-indexed)
    
    // For each date, populate the nomination, actual, and variance values
    for (const date of dates) {
      const dateStr = date.toISOString().split('T')[0];
      const reading = feederReadings.find(r => 
        r.date.toISOString().split('T')[0] === dateStr
      );
      
      // Calculate nomination (daily energy uptake from feeder)
      const nomination = feeder.dailyEnergyUptake;
      
      // Get actual consumption from reading (if exists)
      const actual = reading ? reading.cumulativeEnergyConsumption : 0;
      
      // Calculate variance (actual - nomination)
      const variance = actual - nomination;
      
      // Populate cells
      const nomCell = worksheet.getCell(getColumnLetter(columnIndex) + rowIndex);
      const actCell = worksheet.getCell(getColumnLetter(columnIndex + 1) + rowIndex);
      const varCell = worksheet.getCell(getColumnLetter(columnIndex + 2) + rowIndex);
      
      nomCell.value = nomination;
      actCell.value = actual;
      varCell.value = variance;
      
      // Add borders to all cells
      [nomCell, actCell, varCell].forEach(cell => {
        cell.border = {
          top: border,
          left: border,
          bottom: border,
          right: border
        };
      });
      
      // Apply conditional formatting for variance
      if (variance < 0) {
        varCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFF0000' } // Red for negative variance
        };
      } else if (variance > 0) {
        varCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF00FF00' } // Green for positive variance
        };
      }
      
      // Move to next date columns (with spacing)
      columnIndex += 4;
    }
    
    // Move to next row for next feeder
    rowIndex++;
  }
}

/**
 * Get feeder readings for a specific feeder and dates
 */
async function getFeederReadingsForDates(
  feederId: string, 
  dates: Date[]
): Promise<IFeederReading[]> {
  const startDate = dates[0];
  const endDate = dates[dates.length - 1];
  
  // Get all readings for the feeder in the date range
  const readings = await FeederReading.find({
    feeder: feederId,
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ date: 1 });
  
  return readings;
}

/**
 * Generate a monthly report for all feeders in a region or business hub
 */
export const generateMonthlyReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { region, businessHub, month, year } = req.query;

    if (!month || !year) {
      res.status(400).json({ message: "Month and year are required" });
      return;
    }

    const monthNum = parseInt(month as string); // e.g., 5 for May
    const yearNum = parseInt(year as string);

    const startDate = new Date(Date.UTC(yearNum, monthNum - 1, 1));
    const endDate = new Date(Date.UTC(yearNum, monthNum, 0));

    console.log("Start Date:", startDate.toISOString());
    console.log("End Date:", endDate.toISOString());

    const workbook = await generateFeederPerformanceWorkbook(
      region as string | undefined,
      businessHub as string | undefined,
      startDate.toISOString(),
      endDate.toISOString()
    );

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=MonthlyFeederReport-${year}-${month}.xlsx`);
    await workbook.xlsx.write(res);

  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to generate monthly report" });
  }
};


/**
 * Generate a report for specific feeders
 */
// NOT TESTED YET!!!!!!!!!!!!!!!!!!!!!!!!!
export const generateFeederSpecificReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { feederIds, startDate, endDate } = req.body;

    // Validate feederIds
    if (!feederIds || !Array.isArray(feederIds) || feederIds.length === 0) {
      res.status(400).json({ message: "Feeder IDs are required" });
      return;
    }

    // Validate startDate and endDate presence
    if (!startDate || !endDate) {
      res.status(400).json({ message: "Start and end dates are required" });
      return;
    }

    // Parse dates using UTC to avoid timezone issues
    const start = new Date(Date.parse(startDate));
    const end = new Date(Date.parse(endDate));

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({ message: "Invalid start or end date format" });
      return;
    }

    // Get feeders by IDs
    const feeders = await Feeder.find({ _id: { $in: feederIds } })
      .populate('businessHub', 'name')
      .populate('region', 'name');

    if (feeders.length === 0) {
      res.status(404).json({ message: "No feeders found with the specified IDs" });
      return;
    }

    // Build report parameters with UTC dates
    const reportParams: IReportParams = {
      dateRange: {
        startDate: new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())),
        endDate: new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()))
      }
    };

    // Generate report workbook
    const workbook = await createReportFromTemplate(feeders, reportParams);

    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=FeederReport-${new Date().toISOString().split('T')[0]}.xlsx`
    );

    // Write workbook to response stream
    await workbook.xlsx.write(res);

    // End response
    res.end();

  } catch (error) {
    console.error('Error generating feeder specific report:', error);
    res.status(500).json({ message: "Failed to generate feeder specific report" });
  }
};
