import { NextRequest, NextResponse } from 'next/server';

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
      pdfText
    } = body ?? {};

    if (!fileBase64 && !fileBase64s && !pdfText) {
      return NextResponse.json(
        { success: false, message: 'Missing file data (fileBase64, fileBase64s or pdfText).' },
        { status: 400 }
      );
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
      if (lowerName.includes('sem-2') || lowerName.includes('sem2') || lowerName.includes('semester2') || lowerName.includes('semester-2') || lowerName.includes('1-2') || lowerName.includes('1_2') || lowerName.includes('1 2')) {
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
        3. For each subject, extract the "code" (e.g. 8BC01), "name" (e.g. ENGINEERING GRAPHICS), "gpa" (grade secured like A, O, S, A+, B+, B, C, D, F, or a number like 9.0), "credits" (credits for that subject like 3, 1.5, etc.) and "result" (P for pass or F for fail). If mid1, mid2 or semester_marks are not found on the certificate, use "-".
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
            content: `${promptText}\n\nHere is the raw text extracted from the student marksheet PDF:\n${pdfText}`
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
      3. For each subject, extract the "code" (e.g. 8BC01), "name" (e.g. ENGINEERING GRAPHICS), "gpa" (grade secured like A, O, S, A+, B+, B, C, D, F, or a number like 9.0), "credits" (credits for that subject like 3, 1.5, etc.) and "result" (P for pass or F for fail). If mid1, mid2 or semester_marks are not found on the certificate, use "-".
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
