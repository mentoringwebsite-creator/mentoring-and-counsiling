import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileBase64, fileName, mimeType } = body ?? {};

    if (!fileBase64) {
      return NextResponse.json(
        { success: false, message: 'Missing file data (fileBase64).' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const clientApiKey = request.headers.get('x-gemini-key');
    const activeKey = apiKey || clientApiKey;

    if (!activeKey) {
      // Return a simulated high-quality mock parse of the marksheet for demo purposes
      console.log('No Gemini API key found. Returning simulated parse data.');
      
      // Let's create a realistic mock parse based on the fileName or simple default
      const lowerName = (fileName || '').toLowerCase();
      let semester = 1;
      if (lowerName.includes('sem-2') || lowerName.includes('sem2') || lowerName.includes('semester2') || lowerName.includes('semester-2')) {
        semester = 2;
      } else if (lowerName.includes('sem-3') || lowerName.includes('sem3') || lowerName.includes('semester3')) {
        semester = 3;
      } else if (lowerName.includes('sem-4') || lowerName.includes('sem4')) {
        semester = 4;
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

      // Add a simulated small delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      return NextResponse.json({
        success: true,
        source: 'Simulated AI Parser (No API Key)',
        data: mockData
      });
    }

    // Call the Google Gemini API using fetch
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${activeKey}`;

    const promptText = `
      Analyze this student marksheet/report card image or document. Extract all academic records and return a valid JSON object matching this schema exactly: 
      {
        "sgpa": 8.12, 
        "cgpa": 8.12, 
        "backlogs": 0, 
        "subjects": [
          {
            "name": "C Programming", 
            "semester": 1, 
            "mid1": "18", 
            "mid2": "19", 
            "semester_marks": "84", 
            "gpa": "9.0"
          }
        ]
      }
      
      Requirements:
      1. semester must be a number from 1 to 8.
      2. mid1, mid2, semester_marks, and gpa must be strings. If a mark is missing, use "-".
      3. Return ONLY the JSON object. Do not wrap it in markdown code blocks or html.
    `;

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || 'image/jpeg',
                  data: fileBase64
                }
              },
              {
                text: promptText
              }
            ]
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
      parsedData = JSON.parse(parsedText);
    } catch (e) {
      console.error('Failed to parse Gemini output as JSON:', parsedText);
      throw new Error('AI output was not in valid JSON format.');
    }

    return NextResponse.json({
      success: true,
      source: 'Gemini AI Vision API',
      data: parsedData
    });

  } catch (err: any) {
    console.error('parse-marksheet API error:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Failed to parse marksheet.' },
      { status: 550 }
    );
  }
}
