import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is missing from environment variables");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export interface ExtractedQuestion {
  questionNumber: string;
  questionText: string;
  marks: number;
  questionType: "essay" | "short" | "mcq" | "true_false" | "numerical";
}

export interface GeneratedAnswer {
  answerText: string;
  keyPoints: string[];
}

/**
 * Extract questions from question paper text using Gemini AI
 */
export async function extractQuestionsFromText(
  questionPaperText: string,
  syllabusContext?: string
): Promise<ExtractedQuestion[]> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `
You are an expert educational assistant. Analyze the following question paper and extract all questions in a structured format.

${syllabusContext ? `SYLLABUS CONTEXT:\n${syllabusContext}\n\n` : ""}

QUESTION PAPER:
${questionPaperText}

INSTRUCTIONS:
1. Extract ALL questions from the paper
2. Identify question numbers (e.g., "1", "2a", "3(i)", etc.)
3. Extract the complete question text
4. **IMPORTANT**: Identify marks allocated for each question. Look for patterns like:
   - "(10 marks)" or "[10M]" or "10 marks" or "(10)"
   - If marks not explicitly stated, estimate based on question complexity:
     * Short answer/definition: 2-5 marks
     * Medium explanation: 5-10 marks
     * Long essay/detailed: 10-20 marks
5. Determine question type: essay, short, mcq, true_false, or numerical
6. **CRITICAL**: ALWAYS provide a marks value (never null or undefined)
7. Return ONLY valid JSON array, no markdown formatting

Return JSON in this exact format:
[
  {
    "questionNumber": "1",
    "questionText": "Explain the concept...",
    "marks": 10,
    "questionType": "essay"
  }
]
`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse JSON response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Failed to parse questions from AI response");
    }

    const questions: ExtractedQuestion[] = JSON.parse(jsonMatch[0]);
    
    // Validate and fix marks for each question
    const validatedQuestions = questions.map((q) => ({
      ...q,
      marks: typeof q.marks === 'number' && q.marks > 0 ? q.marks : 5, // Default to 5 if invalid
    }));
    
    return validatedQuestions;
  } catch (error) {
    console.error("Error extracting questions:", error);
    throw new Error("Failed to extract questions from question paper");
  }
}

/**
 * Generate ideal answer for a question using Gemini AI
 */
export async function generateIdealAnswer(
  question: ExtractedQuestion,
  syllabusContext?: string
): Promise<GeneratedAnswer> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `
You are an expert educational assistant. Generate a comprehensive ideal answer for the following question.

${syllabusContext ? `SYLLABUS CONTEXT:\n${syllabusContext}\n\n` : ""}

QUESTION (${question.marks} marks):
${question.questionText}

INSTRUCTIONS:
1. Provide a complete, well-structured answer appropriate for ${question.marks} marks
2. Include all key concepts and details
3. Extract 5-10 key points that should be present in a student's answer for evaluation
4. Return ONLY valid JSON, no markdown formatting

Return JSON in this exact format:
{
  "answerText": "Complete detailed answer here...",
  "keyPoints": [
    "First key concept or point",
    "Second key concept or point",
    "Third key concept or point"
  ]
}
`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse answer from AI response");
    }

    const answer: GeneratedAnswer = JSON.parse(jsonMatch[0]);
    return answer;
  } catch (error) {
    console.error("Error generating answer:", error);
    throw new Error("Failed to generate ideal answer");
  }
}

/**
 * Process entire question paper: extract questions and generate answers
 * This function expects the PDF text to be already extracted
 */
export async function processQuestionPaper(
  questionPaperText: string
): Promise<{
  questions: Array<{
    question: ExtractedQuestion;
    idealAnswer: GeneratedAnswer;
  }>;
}> {
  try {
    console.log("PDF text length:", questionPaperText.length);

    // Step 1: Extract questions
    console.log("Extracting questions from paper...");
    const extractedQuestions = await extractQuestionsFromText(questionPaperText);
    console.log(`Found ${extractedQuestions.length} questions`);

    // Step 2: Generate answers for each question
    console.log("Generating ideal answers...");
    const questionsWithAnswers = await Promise.all(
      extractedQuestions.map(async (question) => {
        const idealAnswer = await generateIdealAnswer(question);
        return {
          question,
          idealAnswer,
        };
      })
    );

    return {
      questions: questionsWithAnswers,
    };
  } catch (error) {
    console.error("Error processing question paper:", error);
    throw error;
  }
}
