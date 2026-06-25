import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      fileBase64, 
      fileName, 
      mimeType, 
      engine = 'gemini', 
      groqModel = 'meta-llama/llama-4-scout-17b-16e-instruct' 
    } = body ?? {};

    if (!fileBase64) {
      return NextResponse.json(
        { success: false, message: 'Missing file data (fileBase64).' },
        { status: 400 }
      );
    }

    // PDF validation for Groq
    if (engine === 'groq' && mimeType === 'application/pdf') {
      return NextResponse.json(
        { 
          success: false, 
          message: `PDF parsing is not supported by the Groq model "${groqModel}". Please upload an image marksheet (PNG/JPG) to use Groq, or select Google Gemini to process PDF files.` 
        },
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
        Analyze this student marksheet/report card image. Extract all academic records and return a valid JSON object matching this schema exactly: 
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
        3. Return ONLY the JSON object. Do not wrap it in markdown code blocks.
      `;

      const response = await fetch(groqUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeKey}`
        },
        body: JSON.stringify({
          model: groqModel,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: promptText
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType || 'image/jpeg'};base64,${fileBase64}`
                  }
                }
              ]
            }
          ],
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
        parsedData = JSON.parse(content);
      } catch (e) {
        console.error('Failed to parse Groq output as JSON:', content);
        throw new Error('Groq AI output was not in valid JSON format.');
      }

      return NextResponse.json({
        success: true,
        source: `Groq ${groqModel} API`,
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
      3. Return ONLY the JSON object. Do not wrap it in markdown code blocks.
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
