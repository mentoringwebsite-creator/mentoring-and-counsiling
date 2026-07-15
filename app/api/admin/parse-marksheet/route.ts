import { NextRequest, NextResponse } from 'next/server';

const nameMapping: Record<string, string> = {
  // Abbreviations & Mappings
  'MAC': 'MATRIX ALGEBRA AND CALCULUS',
  'M-I': 'MATRIX ALGEBRA AND CALCULUS',
  'EELS': 'ESSENTIAL ENGLISH LANGUAGE SKILLS',
  'PSC': 'PROBLEM SOLVING USING C',
  'EG': 'ENGINEERING GRAPHICS',
  'OC LAB': 'ORAL COMMUNICATION LAB - I',
  'PSC LAB': 'PROBLEM SOLVING USING C LAB',
  'EP': 'ENGINEERING PHYSICS',
  'EP LAB': 'ENGINEERING PHYSICS LAB',
  'IP': 'INDUCTION PROGRAM',
  
  // Semester 1 & 2
  '9HC07': 'ENGINEERING PHYSICS',
  '9FC01': 'PROBLEM SOLVING USING C',
  '9HC11': 'MATRIX ALGEBRA AND CALCULUS',
  '9HC01': 'ESSENTIAL ENGLISH LANGUAGE SKILLS',
  '9BC01': 'ENGINEERING GRAPHICS',
  '9HC61': 'ORAL COMMUNICATION LAB - I',
  '9HC66': 'ENGINEERING PHYSICS LAB',
  '9FC61': 'PROBLEM SOLVING USING C LAB',
  
  '9HC04': 'ENGINEERING CHEMISTRY',
  '9EC01': 'DATA STRUCTURES',
  '9HC12': 'ADVANCED CALCULUS',
  '9AC42': 'ELECTRICAL CIRCUITS & NETWORKS ANALYSIS',
  '9HC62': 'ORAL COMMUNICATION LAB - II',
  '9HC64': 'ENGINEERING CHEMISTRY LAB',
  '9EC61': 'DATA STRUCTURES USING LAB',
  '9BC61': 'WORKSHOP/MANUFACTURING PROCESSES LAB',
  
  // Semester 3 & 4
  '9CC01': 'ELECTRONIC DEVICES AND CIRCUITS',
  '9CC02': 'SIGNALS AND SYSTEMS',
  '9CC03': 'PROBABILITY THEORY AND STOCHASTIC PROCESS',
  '9HC14': 'COMPLEX VARIABLE AND TRANSFORM TECHNIQUES',
  '9ZC01': 'BUSINESS ECONOMICS AND FINANCIAL ANALYSIS',
  '9HC03': 'UNIVERSAL HUMAN VALUES',
  '9HC63': 'SOFT SKILLS LAB',
  '9CC71': 'ELECTRONIC DEVICES AND CIRCUITS LAB',
  '9AC72': 'ELECTRICAL CIRCUITS & NETWORKS ANALYSISLAB',
  
  '9CC04': 'ANALOG CIRCUITS',
  '9CC05': 'DIGITAL LOGIC DESIGN',
  '9CC06': 'ANALOG& DIGITAL COMMUNICATIONS',
  '9C407': 'ELECTROMAGNETIC WAVES AND TRANSMISSION LINES',
  '9HC16': 'QUANTITATIVE APARTITUDE AND LOGICAL REASONING',
  '9HC05': 'ENVIRONMENTAL SCIENCE',
  '9CC72': 'ANALOG CIRCUITS LAB',
  '9C473': 'BASIC SIMULATION AND DIGITAL LOGIC DESIGN LAB',
  '9CC74': 'ANALOG& DIGITAL COMMUNICATION LAB',
  '9C461': 'TECHNICAL SEMINAR',

  // Semester 5 & 6
  '9CC08': 'DIGITAL SIGNAL PROCESSING',
  '9CC09': 'IC APPLICATIONS',
  '9C510': 'ANTENNAS AND WAVE PROPAGATIONS',
  '9PE51': 'PROFESSIONAL ELECTIVE- I',
  '9AC07': 'LINEAR CONTROL SYSTEMS',
  '9EC41': 'ARTIFICIAL INTELLIGENCE',
  '9CC75': 'DIGITAL SIGNAL PROCESSING LAB',
  '9CC76': 'IC APPLICATIONS LAB',
  '9C578': 'ANTENNA SIMULATION LAB',
  '9C591': 'SUMMER INDUSTRY INTERNSHIP-I',

  '9C611': 'MICROWAVE AND OPTICAL COMMUNICATIONS',
  '9C612': 'VLSI TECHNOLOGY AND DESIGN',
  '9CC15': 'MICROPROCESSORS AND MICROCONTROLLERS',
  '9PE61': 'PROFESSIONAL ELECTIVE- II',
  '9OE61': 'OPEN ELECTIVE- I',
  '9FC78': 'CYBER SECURITY',
  '9C679': 'MICROWAVE AND OPTICAL COMMUNICATIONS LAB',
  '9C677': 'VLSI TECHNOLOGY AND DESIGN LAB',
  '9CC85': 'MICROPROCESSORS AND MICROCONTROLLERS LAB',
  '9C662': 'COMPREHENSIVE VIVA VOCE',

  // Semester 7 & 8
  '9C713': 'INTERNET OF THINGS AND APPLICATIONS',
  '9C714': 'ADVANCED COMMUNICATIONS AND NETWORKS',
  '9EC05': 'COMPUTER NETWORKS',
  '9PE71': 'PROFESSIONAL ELECTIVE- III',
  '9PE72': 'PROFESSIONAL ELECTIVE -IV',
  '9OE71': 'OPEN ELECTIVE - II',
  '9C780': 'INTERNET OF THINGS AND APPLICATIONS LAB',
  '9C781': 'ADVANCED COMMUNICATIONS AND NETWORKS LAB',
  '9C792': 'SUMMER INDUSTRY INTERNSHIP - II',

  '9PE81': 'PROFESSIONAL ELECTIVE -V',
  '9OE81': 'OPEN ELECTIVE -III',
  '9C893': 'PROJECT'
};

function getCredits(code: string, name: string): number {
  const cleanCode = code.toUpperCase().trim();
  const cleanName = name.toUpperCase().trim();
  
  if (cleanCode === '9HC18' || cleanName.includes('INDUCTION') || cleanCode === '9HC05' || cleanName.includes('GENDER') || cleanCode === '9EC41' || cleanName.includes('ARTIFICIAL') || cleanCode === '9FC78' || cleanName.includes('CYBER') || cleanName.includes('ENVIRONMENT')) {
    return 0; // Audit courses
  }
  
  if (cleanCode === '9C893') return 10;
  if (cleanCode === '9BC61') return 2.5;
  if (cleanCode === '9HC63' || cleanCode === '9CC75' || cleanCode === '9C679' || cleanCode === '9C473') return 2;
  if (cleanCode === '9HC61' || cleanCode === '9C591' || cleanCode === '9C662' || cleanCode === '9C780' || cleanCode === '9C781' || cleanCode === '9C792' || cleanCode === '9C461') return 1;

  if (cleanName.includes('LAB') || cleanName.includes('PRACTICAL') || cleanCode.endsWith('71') || cleanCode.endsWith('72') || cleanCode.endsWith('63') || cleanCode.endsWith('61') || cleanCode.endsWith('65') || cleanCode.endsWith('66') || cleanCode.endsWith('64') || cleanCode.endsWith('74') || cleanCode.endsWith('75') || cleanCode.endsWith('76') || cleanCode.endsWith('77') || cleanCode.endsWith('78') || cleanCode.endsWith('79') || cleanCode.endsWith('80') || cleanCode.endsWith('81') || cleanCode.endsWith('85')) {
    return 1.5; // Labs are usually 1.5 credits
  }
  
  if (cleanCode === '9HC01' || cleanName.includes('ENGLISH') || cleanName.includes('EELS')) {
    return 2;
  }
  
  return 3; // Standard theory is 3 credits
}

function finalizeParsedData(parsedData: any, targetSemester?: string) {
  if (!parsedData) return parsedData;
  if (Array.isArray(parsedData.subjects)) {
    const targetSemNum = (targetSemester && !isNaN(parseInt(targetSemester))) ? parseInt(targetSemester) : undefined;
    const semSgpa = parsedData.sgpa?.toString() || '';
    const semCgpa = parsedData.cgpa?.toString() || '';
    parsedData.subjects = parsedData.subjects.map((sub: any) => ({
      ...sub,
      ...(targetSemNum !== undefined ? { semester: targetSemNum } : {}),
      sgpa: semSgpa,
      cgpa: semCgpa
    }));
  }
  return parsedData;
}

function parseLedgerText(text: string, targetRoll: string, targetSemester?: string) {
  const lines = text.split('\n');
  
  // Find subject headers
  const subjectHeaders: Array<{ code: string; abbrev: string; name: string }> = [];
  
  // Find any line containing at least 3 subject codes (matching \b\d[A-Z0-9]{4}\b)
  const headerLine = lines.find(line => {
    const matches = line.match(/\b\d[A-Z0-9]{4}\b/g) || [];
    return matches.length >= 3;
  });
  
  if (headerLine) {
    const matches = headerLine.match(/\b\d[A-Z0-9]{4}(?:_INT|_EXT|_TOT)?\b/gi) || [];
    const uniqueCodes = Array.from(new Set(matches.map(c => c.substring(0, 5).toUpperCase())));
    
    uniqueCodes.forEach(code => {
      const abbrev = code;
      const name = nameMapping[abbrev] || abbrev;
      subjectHeaders.push({ code, abbrev, name });
    });
  }

  const targetSemNum = targetSemester && !isNaN(parseInt(targetSemester)) ? parseInt(targetSemester) : 1;

  if (subjectHeaders.length === 0) {
    subjectHeaders.push(
      { code: '9HC11', name: 'MATRIX ALGEBRA AND CALCULUS', abbrev: 'MAC' },
      { code: '9HC01', name: 'ESSENTIAL ENGLISH LANGUAGE SKILLS', abbrev: 'EELS' },
      { code: '9HC06', name: 'APPLIED PHYSICS', abbrev: 'AP' },
      { code: '9FC01', name: 'PROBLEM SOLVING USING C', abbrev: 'PSC' },
      { code: '9BC01', name: 'ENGINEERING GRAPHICS', abbrev: 'EG' },
      { code: '9HC61', name: 'ORAL COMMUNICATION LAB - I', abbrev: 'OC LAB' },
      { code: '9HC65', name: 'APPLIED PHYSICS LAB', abbrev: 'AP LAB' },
      { code: '9FC61', name: 'PROBLEM SOLVING USING C LAB', abbrev: 'PSC LAB' },
      { code: '9HC18', name: 'INDUCTION PROGRAM', abbrev: 'IP' }
    );
  }

  // Find target student row
  const studentLine = lines.find(line => line.toLowerCase().includes(targetRoll.toLowerCase()));
  if (!studentLine) {
    return null;
  }

  // Tokenize the student line (clean pipe separators first)
  const cleanLine = studentLine.replace(/\|/g, ' ');
  const tokens = cleanLine.trim().split(/\s+/);
  
  // Find where the marks/grades start (the first token after student name which is numeric)
  const rollIndex = tokens.findIndex(t => t.toLowerCase() === targetRoll.toLowerCase());
  if (rollIndex === -1) return null;

  let marksStartIndex = rollIndex + 2; 
  while (marksStartIndex < tokens.length && isNaN(parseInt(tokens[marksStartIndex]))) {
    marksStartIndex++;
  }

  if (marksStartIndex >= tokens.length) return null;

  const subjects: any[] = [];
  let tokenIdx = marksStartIndex;

  for (let h = 0; h < subjectHeaders.length; h++) {
    const header = subjectHeaders[h];
    
    const nextToken = tokens[tokenIdx];
    const nextNextToken = tokens[tokenIdx + 1];
    const gradeToken = tokens[tokenIdx + 2];
    
    if (gradeToken && gradeToken.includes('(')) {
      const match = gradeToken.match(/^(\d+)\(([^)]+)\)$/);
      if (match) {
        const grade = match[2];
        const mid1 = nextToken || '-';
        const semester_marks = nextNextToken || '-';
        const subCredits = getCredits(header.code, header.name);

        subjects.push({
          code: header.code,
          name: header.name,
          semester: targetSemNum,
          mid1,
          mid2: '-',
          semester_marks,
          gpa: grade,
          credits: subCredits,
          result: grade === 'F' ? 'F' : 'P'
        });
        
        tokenIdx += 3;
        continue;
      }
    }

    // Single-column subject (takes 1 token)
    const grade = nextToken || 'P';
    const cleanGrade = grade.trim().toUpperCase();
    const isValidGrade = /^(O|S|A\+?|B\+?|C|D|F|P|PASS|FAIL|AB)(\*?)$/i.test(cleanGrade);
    
    if (!isValidGrade) {
      // Encountered non-grade token like total marks, credits, SGPA.
      // We have hit the end of the subject marks columns. Break!
      break;
    }

    subjects.push({
      code: header.code,
      name: header.name,
      semester: targetSemNum,
      mid1: '-',
      mid2: '-',
      semester_marks: '-',
      gpa: cleanGrade,
      credits: 0,
      result: (cleanGrade === 'F' || cleanGrade === 'FAIL') ? 'F' : 'P'
    });
    tokenIdx += 1;
  }

  let sgpa = 0;
  let cgpa = 0;
  let backlogs = 0;
  let total_credits_parsed = '';

  const decimals: number[] = [];
  const integers: number[] = [];

  // Scan student row tokens from right to left
  for (let i = tokens.length - 1; i >= 0; i--) {
    const token = tokens[i];
    if (token.includes('.') && !isNaN(parseFloat(token))) {
      decimals.push(parseFloat(token));
    } else if (!isNaN(parseInt(token)) && !token.includes('(')) {
      integers.push(parseInt(token));
    }
  }

  if (decimals.length >= 2) {
    cgpa = decimals[0]; // last token is CGPA (in 1-2 onwards)
    sgpa = decimals[1]; // second to last token is SGPA
  } else if (decimals.length === 1) {
    sgpa = decimals[0];
    cgpa = decimals[0];
  }

  if (integers.length >= 2) {
    total_credits_parsed = integers[0].toString();
    backlogs = integers[1];
  }

  // Add sgpa and cgpa to every parsed subject
  subjects.forEach(sub => {
    sub.sgpa = sgpa.toString();
    sub.cgpa = cgpa.toString();
  });

  return {
    sgpa,
    cgpa,
    backlogs,
    subjects
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      fileBase64, 
      fileBase64s,
      fileName, 
      mimeType, 
      engine = 'gemini', 
      groqModel = 'meta-llama/llama-4-scout-17b-16e-instruct',
      pdfText,
      studentName,
      rollNumber,
      targetSemester
    } = body ?? {};

    if (!fileBase64 && !fileBase64s && !pdfText) {
      return NextResponse.json(
        { success: false, message: 'Missing file data (fileBase64, fileBase64s or pdfText).' },
        { status: 400 }
      );
    }

    if (pdfText && rollNumber) {
      const offlineResult = parseLedgerText(pdfText, rollNumber, targetSemester);
      if (offlineResult && offlineResult.subjects && offlineResult.subjects.length > 0) {
        console.log('Successfully extracted results offline via ledger text parser.');
        return NextResponse.json({
          success: true,
          source: 'Local Roster PDF Text Extractor',
          data: offlineResult
        });
      }
    }
    if (pdfText) {
      const rollMatches = pdfText.match(/\b\d{2}311[A-Z0-9]{5}\b/gi) || [];
      const uniqueRolls = new Set(rollMatches.map((r: string) => r.toLowerCase()));
      const isLedger = uniqueRolls.size >= 3;

      if (isLedger && rollNumber) {
        const hasRoll = pdfText.toLowerCase().includes(rollNumber.toLowerCase());
        if (!hasRoll) {
          return NextResponse.json(
            { 
              success: false, 
              message: `This PDF file is a class results ledger, but your student's Roll Number (${rollNumber.toUpperCase()}) was not found in it. Please upload the correct PDF department ledger page containing this student's grades.` 
            },
            { status: 400 }
          );
        }
      }
    }

    let finalPdfText = pdfText;
    if (pdfText && pdfText.length > 2000) {
      const lines = pdfText.split('\n');
      const firstLines = lines.slice(0, 10);
      const matchingLines = lines.filter((line: string) => 
        (rollNumber && line.toLowerCase().includes(rollNumber.toLowerCase())) || 
        (studentName && line.toLowerCase().includes(studentName.toLowerCase()))
      );
      finalPdfText = [
        ...firstLines,
        '--- [TRUNCATED FOR BREVITY] ---',
        ...matchingLines
      ].join('\n');
    }

    const serverGeminiKey = process.env.GEMINI_API_KEY;
    const serverGroqKey = process.env.GROQ_API_KEY;
    const clientGeminiKey = request.headers.get('x-gemini-key');
    const clientGroqKey = request.headers.get('x-groq-key');

    const activeKey = engine === 'groq' 
      ? (serverGroqKey || clientGroqKey)
      : (serverGeminiKey || clientGeminiKey);

    if (!activeKey) {
      console.log(`No active API key found for engine "${engine}". Returning simulated parse data.`);
      
      const lowerName = (fileName || '').toLowerCase();
      let semester = 1;
      if (targetSemester && !isNaN(parseInt(targetSemester))) {
        semester = parseInt(targetSemester);
      } else if (lowerName.includes('sem-2') || lowerName.includes('sem2') || lowerName.includes('semester2') || lowerName.includes('semester-2') || lowerName.includes('1-2') || lowerName.includes('1_2') || lowerName.includes('1 2')) {
        semester = 2;
      } else if (lowerName.includes('sem-3') || lowerName.includes('sem3') || lowerName.includes('semester3') || lowerName.includes('semester-3') || lowerName.includes('2-1') || lowerName.includes('2_1') || lowerName.includes('2 1')) {
        semester = 3;
      } else if (lowerName.includes('sem-4') || lowerName.includes('sem4') || lowerName.includes('semester4') || lowerName.includes('semester-4') || lowerName.includes('2-2') || lowerName.includes('2_2') || lowerName.includes('2 2')) {
        semester = 4;
      } else if (lowerName.includes('sem-5') || lowerName.includes('sem5') || lowerName.includes('semester5') || lowerName.includes('semester-5') || lowerName.includes('3-1') || lowerName.includes('3_1') || lowerName.includes('3 1')) {
        semester = 5;
      } else if (lowerName.includes('sem-6') || lowerName.includes('sem6') || lowerName.includes('semester6') || lowerName.includes('semester-6') || lowerName.includes('3-2') || lowerName.includes('3_2') || lowerName.includes('3 2')) {
        semester = 6;
      } else if (lowerName.includes('sem-7') || lowerName.includes('sem7') || lowerName.includes('semester7') || lowerName.includes('semester-7') || lowerName.includes('4-1') || lowerName.includes('4_1') || lowerName.includes('4 1')) {
        semester = 7;
      } else if (lowerName.includes('sem-8') || lowerName.includes('sem8') || lowerName.includes('semester8') || lowerName.includes('semester-8') || lowerName.includes('4-2') || lowerName.includes('4_2') || lowerName.includes('4 2')) {
        semester = 8;
      }

      const mockData = {
        sgpa: 8.50,
        cgpa: 8.35,
        backlogs: 0,
        subjects: [
          { name: 'C PROGRAMMING', semester, mid1: '18', mid2: '19', semester_marks: '84', gpa: '9.0' },
          { name: 'C LAB', semester, mid1: '20', mid2: '20', semester_marks: '95', gpa: '10.0' },
          { name: 'PHYSICS', semester, mid1: '17', mid2: '18', semester_marks: '76', gpa: '8.0' },
          { name: 'ENGLISH', semester, mid1: '16', mid2: '18', semester_marks: '74', gpa: '8.0' },
          { name: 'MATH-I', semester, mid1: '19', mid2: '20', semester_marks: '88', gpa: '9.0' },
          { name: 'DATABASE MANAGEMENT SYSTEMS', semester, mid1: '18', mid2: '17', semester_marks: '80', gpa: '8.0' }
        ]
      };

      await new Promise((resolve) => setTimeout(resolve, 2000));

      return NextResponse.json({
        success: true,
        source: `Simulated AI Parser (${engine.toUpperCase()} - No API Key)`,
        data: mockData
      });
    }

    // ==================== ENGINE: GROQ ====================
    if (engine === 'groq') {
      const groqUrl = 'https://api.groq.com/openai/v1/chat/completions';
      
      const promptText = `
        Analyze this student marksheet/report card image or text. Extract all academic records and return a valid JSON object matching this schema exactly: 
        {
          "sgpa": 8.12, 
          "cgpa": 8.12, 
          "backlogs": 0, 
          "memo_no": "S375090",
          "serial_no": "2501094146006",
          "exam_date": "JANUARY 2024",
          "issue_date": "18.05.2024",
          "father_name": "MANSUR",
          "hall_ticket_no": "23311A04X2",
          "branch": "ELECTRONICS & COMMUNICATION ENGINEERING",
          "total_credits": 18,
          "pass_status": "PASS",
          "subjects": [
            {
              "code": "8BC01",
              "name": "ENGINEERING GRAPHICS", 
              "semester": 1, 
              "mid1": "-", 
              "mid2": "-", 
              "semester_marks": "-", 
              "gpa": "A",
              "credits": 3,
              "result": "P"
            }
          ]
        }
        
        Requirements:
        ${rollNumber ? `CRITICAL LEDGER RULE: If this image/document is a tabular class ledger containing multiple students' records (where columns are subjects and rows are students), you MUST search for the row matching Roll Number: "${rollNumber}" or Name: "${studentName || ''}" and extract the academic data specifically and exclusively for this student. Do not return other students' records.` : ''}
        1. semester must be a number from 1 to 8. You MUST map the year and semester of the marksheet to a number from 1 to 8:
           - I Year I Semester / Year 1 Sem 1 / 1-1 / I B.Tech I Semester -> 1
           - I Year II Semester / Year 1 Sem 2 / 1-2 / I B.Tech II Semester -> 2
           - II Year I Semester / Year 2 Sem 1 / 2-1 / II B.Tech I Semester -> 3
           - II Year II Semester / Year 2 Sem 2 / 2-2 / II B.Tech II Semester -> 4
           - III Year I Semester / Year 3 Sem 1 / 3-1 / III B.Tech I Semester -> 5
           - III Year II Semester / Year 3 Sem 2 / 3-2 / III B.Tech II Semester -> 6
           - IV Year I Semester / Year 4 Sem 1 / 4-1 / IV B.Tech I Semester -> 7
           - IV Year II Semester / Year 4 Sem 2 / 4-2 / IV B.Tech II Semester -> 8
        2. Extract "memo_no", "serial_no", "exam_date" (month and year of exam), "issue_date" (date of issue), "father_name" (or FATHER'S / MOTHER'S NAME), "hall_ticket_no" (or roll number), "branch" (e.g. ELECTRONICS & COMMUNICATION ENGINEERING), "total_credits" (number of passed credits or total credits for the semester) and "pass_status" (PASS or FAIL result status).
        3. For each subject, extract the "code" (e.g. 8BC01 or 9HC11), "name" (e.g. ENGINEERING GRAPHICS or MATRIX ALGEBRA AND CALCULUS), "gpa" (grade secured like A, O, S, A+, B+, B, C, D, F, or a number like 9.0), "credits" (credits for that subject like 3, 1.5, etc.) and "result" (P for pass or F for fail). If mid1, mid2 or semester_marks are not found on the certificate, use "-".
           NOTE FOR TABULAR LEDGERS: The subject codes and abbreviations are listed as headers (e.g. "9HC11 MAC" has code "9HC11" and name "MAC" or "MATRIX ALGEBRA AND CALCULUS"). The student's cell for that column contains their grade (e.g. "40(C)" or "68(B+)" means grade/gpa is "C" or "B+", and internal/external marks may be listed in sub-columns: "INT 40" is internal/mid1, "EXT 60" is semester_marks/external).
        4. For "sgpa" and "cgpa" at the root level, return the values corresponding to the LATEST semester found in the marksheet (e.g. if the marksheet contains semesters 1, 2, and 3, return the Semester 3 SGPA and CGPA).
        5. For "backlogs" at the root level, return the total number of active backlogs across all semesters.
        6. Return ONLY the JSON object. Do not wrap it in markdown code blocks.
      `;

      let messages = [];
      let activeModel = groqModel;

      if (pdfText) {
        // If it's text-only, we map to llama-3.1-8b-instant which is extremely fast and prevents timeouts
        if (groqModel.includes('vision') || groqModel.includes('scout')) {
          activeModel = 'llama-3.1-8b-instant';
        }
        messages = [
          {
            role: 'user',
            content: `${promptText}\n\nHere is the raw text extracted from the student marksheet PDF:\n${finalPdfText}`
          }
        ];
      } else {
        const imageContent: any[] = [
          {
            type: 'text',
            text: promptText
          }
        ];

        if (fileBase64s && fileBase64s.length > 0) {
          fileBase64s.forEach((b64: string) => {
            imageContent.push({
              type: 'image_url',
              image_url: {
                url: `data:${mimeType || 'image/jpeg'};base64,${b64}`
              }
            });
          });
        } else if (fileBase64) {
          imageContent.push({
            type: 'image_url',
            image_url: {
              url: `data:${mimeType || 'image/jpeg'};base64,${fileBase64}`
            }
          });
        }

        messages = [
          {
            role: 'user',
            content: imageContent
          }
        ];
      }

      const response = await fetch(groqUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeKey}`
        },
        body: JSON.stringify({
          model: activeModel,
          messages,
          response_format: {
            type: 'json_object'
          },
          temperature: 0.1
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API returned error code ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      const content = result.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('Groq API returned an empty completion response.');
      }

      let parsedData;
      try {
        let cleanedContent = content.trim();
        if (cleanedContent.startsWith('```')) {
          cleanedContent = cleanedContent.replace(/^```(?:json)?\n?/i, '');
          cleanedContent = cleanedContent.replace(/\n?```$/, '');
        }
        cleanedContent = cleanedContent.trim();
        parsedData = JSON.parse(cleanedContent);
      } catch (e) {
        console.error('Failed to parse Groq output as JSON:', content);
        throw new Error('Groq AI output was not in valid JSON format.');
      }

      parsedData = finalizeParsedData(parsedData, targetSemester);

      return NextResponse.json({
        success: true,
        source: `Groq ${activeModel} API`,
        data: parsedData
      });
    }

    // ==================== ENGINE: GEMINI (Default) ====================
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${activeKey}`;

    const promptText = `
      Analyze this student marksheet/report card image or document. Extract all academic records and return a valid JSON object matching this schema exactly: 
      {
        "sgpa": 8.12, 
        "cgpa": 8.12, 
        "backlogs": 0, 
        "memo_no": "S375090",
        "serial_no": "2501094146006",
        "exam_date": "JANUARY 2024",
        "issue_date": "18.05.2024",
        "father_name": "MANSUR",
        "hall_ticket_no": "23311A04X2",
        "branch": "ELECTRONICS & COMMUNICATION ENGINEERING",
        "total_credits": 18,
        "pass_status": "PASS",
        "subjects": [
          {
            "code": "8BC01",
            "name": "ENGINEERING GRAPHICS", 
            "semester": 1, 
            "mid1": "-", 
            "mid2": "-", 
            "semester_marks": "-", 
            "gpa": "A",
            "credits": 3,
            "result": "P"
          }
        ]
      }
      
      Requirements:
      ${rollNumber ? `CRITICAL LEDGER RULE: If this image/document is a tabular class ledger containing multiple students' records (where columns are subjects and rows are students), you MUST search for the row matching Roll Number: "${rollNumber}" or Name: "${studentName || ''}" and extract the academic data specifically and exclusively for this student. Do not return other students' records.` : ''}
      1. semester must be a number from 1 to 8. You MUST map the year and semester of the marksheet to a number from 1 to 8:
         - I Year I Semester / Year 1 Sem 1 / 1-1 / I B.Tech I Semester -> 1
         - I Year II Semester / Year 1 Sem 2 / 1-2 / I B.Tech II Semester -> 2
         - II Year I Semester / Year 2 Sem 1 / 2-1 / II B.Tech I Semester -> 3
         - II Year II Semester / Year 2 Sem 2 / 2-2 / II B.Tech II Semester -> 4
         - III Year I Semester / Year 3 Sem 1 / 3-1 / III B.Tech I Semester -> 5
         - III Year II Semester / Year 3 Sem 2 / 3-2 / III B.Tech II Semester -> 6
         - IV Year I Semester / Year 4 Sem 1 / 4-1 / IV B.Tech I Semester -> 7
         - IV Year II Semester / Year 4 Sem 2 / 4-2 / IV B.Tech II Semester -> 8
      2. Extract "memo_no", "serial_no", "exam_date" (month and year of exam), "issue_date" (date of issue), "father_name" (or FATHER'S / MOTHER'S NAME), "hall_ticket_no" (or roll number), "branch" (e.g. ELECTRONICS & COMMUNICATION ENGINEERING), "total_credits" (number of passed credits or total credits for the semester) and "pass_status" (PASS or FAIL result status).
      3. For each subject, extract the "code" (e.g. 8BC01 or 9HC11), "name" (e.g. ENGINEERING GRAPHICS or MATRIX ALGEBRA AND CALCULUS), "gpa" (grade secured like A, O, S, A+, B+, B, C, D, F, or a number like 9.0), "credits" (credits for that subject like 3, 1.5, etc.) and "result" (P for pass or F for fail). If mid1, mid2 or semester_marks are not found on the certificate, use "-".
         NOTE FOR TABULAR LEDGERS: The subject codes and abbreviations are listed as headers (e.g. "9HC11 MAC" has code "9HC11" and name "MAC" or "MATRIX ALGEBRA AND CALCULUS"). The student's cell for that column contains their grade (e.g. "40(C)" or "68(B+)" means grade/gpa is "C" or "B+", and internal/external marks may be listed in sub-columns: "INT 40" is internal/mid1, "EXT 60" is semester_marks/external).
      4. For "sgpa" and "cgpa" at the root level, return the values corresponding to the LATEST semester found in the marksheet (e.g. if the marksheet contains semesters 1, 2, and 3, return the Semester 3 SGPA and CGPA).
      5. For "backlogs" at the root level, return the total number of active backlogs across all semesters.
      6. Return ONLY the JSON object. Do not wrap it in markdown code blocks.
    `;

    const parts: any[] = [];
    if (fileBase64s && fileBase64s.length > 0) {
      fileBase64s.forEach((b64: string) => {
        parts.push({
          inlineData: {
            mimeType: mimeType || 'image/jpeg',
            data: b64
          }
        });
      });
    } else if (fileBase64) {
      parts.push({
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: fileBase64
        }
      });
    }
    parts.push({ text: promptText });

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: parts
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API returned error code ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    const parsedText = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!parsedText) {
      throw new Error('Gemini API returned an empty response.');
    }

    let parsedData;
    try {
      let cleanedText = parsedText.trim();
      if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```(?:json)?\n?/i, '');
        cleanedText = cleanedText.replace(/\n?```$/, '');
      }
      cleanedText = cleanedText.trim();
      parsedData = JSON.parse(cleanedText);
    } catch (e) {
      console.error('Failed to parse Gemini output as JSON:', parsedText);
      throw new Error('Gemini AI output was not in valid JSON format.');
    }

    parsedData = finalizeParsedData(parsedData, targetSemester);

    return NextResponse.json({
      success: true,
      source: 'Gemini 1.5 Flash Vision API',
      data: parsedData
    });

  } catch (err: any) {
    console.error('parse-marksheet API error:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Failed to parse marksheet.' },
      { status: 500 }
    );
  }
}
