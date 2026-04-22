import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Calculate keyword match score
 * Checks how many keywords from ideal answer exist in student answer
 */
export function calculateKeywordMatchScore(
  keyPoints: string[],
  studentAnswer: string
): number {
  if (!keyPoints || keyPoints.length === 0) {
    console.log(`  ⚠️ No key points provided, defaulting to 100% keyword match`);
    return 1.0; // If no keywords defined, give full credit
  }

  const studentLower = studentAnswer.toLowerCase().trim();
  
  if (!studentLower || studentLower.length === 0) {
    console.log(`  ⚠️ Empty student answer, 0% keyword match`);
    return 0;
  }

  let matchCount = 0;
  const matchedKeywords: string[] = [];
  const missedKeywords: string[] = [];

  for (const keyword of keyPoints) {
    const keywordLower = keyword.toLowerCase().trim();
    
    // Try multiple matching strategies
    let matched = false;
    
    // Strategy 1: Exact phrase match
    if (studentLower.includes(keywordLower)) {
      matched = true;
    }
    
    // Strategy 2: Word boundary match (for single words)
    if (!matched && !keywordLower.includes(' ')) {
      const regex = new RegExp(`\\b${keywordLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      if (regex.test(studentLower)) {
        matched = true;
      }
    }
    
    // Strategy 3: Partial match (check if 70% of words in keyword are present)
    if (!matched) {
      const keywordWords = keywordLower.split(/\s+/).filter(w => w.length > 2);
      if (keywordWords.length > 0) {
        const matchedWords = keywordWords.filter(word => 
          studentLower.includes(word)
        );
        if (matchedWords.length >= Math.ceil(keywordWords.length * 0.7)) {
          matched = true;
        }
      }
    }
    
    if (matched) {
      matchCount++;
      matchedKeywords.push(keyword);
    } else {
      missedKeywords.push(keyword);
    }
  }

  const score = matchCount / keyPoints.length;
  console.log(`  📊 Keyword Match: ${matchCount}/${keyPoints.length} = ${(score * 100).toFixed(1)}%`);
  console.log(`  ✅ Matched: ${matchedKeywords.length > 0 ? matchedKeywords.slice(0, 3).join(', ') + (matchedKeywords.length > 3 ? '...' : '') : 'None'}`);
  if (missedKeywords.length > 0 && missedKeywords.length <= 3) {
    console.log(`  ❌ Missed: ${missedKeywords.join(', ')}`);
  }
  
  return score;
}

/**
 * Calculate context similarity using Gemini AI (40% weightage)
 * Uses semantic analysis to compare ideal answer with student answer
 */
export async function calculateContextSimilarity(
  idealAnswer: string,
  studentAnswer: string
): Promise<number> {
  try {
    const prompt = `
You are an expert educational evaluator. Compare the following two answers and provide a similarity score.

IDEAL ANSWER:
${idealAnswer}

STUDENT ANSWER:
${studentAnswer}

INSTRUCTIONS:
1. Analyze the semantic meaning and context of both answers
2. Consider:
   - Conceptual understanding
   - Accuracy of information
   - Completeness of explanation
   - Relevance to the question
3. Return a similarity score between 0.0 and 1.0
4. Return ONLY a JSON object with the score, no other text

Return JSON in this exact format:
{
  "similarity": 0.85
}
`;

    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse JSON response
    const jsonMatch = responseText.match(/\{\s*"similarity"\s*:\s*([\d.]+)\s*\}/);
    if (!jsonMatch) {
      console.warn("Failed to parse similarity score, using fallback");
      return 0.5; // Fallback score
    }

    const similarity = parseFloat(jsonMatch[1]);
    const clampedSimilarity = Math.max(0, Math.min(1, similarity));
    
    console.log(`  🧠 Context Similarity: ${(clampedSimilarity * 100).toFixed(1)}%`);
    return clampedSimilarity;
  } catch (error) {
    console.error("Error calculating context similarity:", error);
    return 0.5; // Fallback score on error
  }
}

/**
 * Evaluate a single question
 * Uses tier-based marking scheme (Context > Keywords)
 */
export async function evaluateQuestion(
  idealAnswer: string,
  keyPoints: string[],
  maxMarks: number,
  studentAnswer: string
): Promise<{
  marksAwarded: number;
  keywordMatchPercent: number;
  contextSimilarityPercent: number;
  remark: string;
}> {
  console.log(`\n📝 Evaluating question (Max: ${maxMarks} marks)...`);

  // Calculate keyword match score
  const keywordScore = calculateKeywordMatchScore(keyPoints, studentAnswer);
  const keywordMatchPercent = Math.round(keywordScore * 100);

  // Calculate context similarity
  const contextScore = await calculateContextSimilarity(idealAnswer, studentAnswer);
  const contextSimilarityPercent = Math.round(contextScore * 100);

  console.log(`  📊 Keyword Match: ${keywordMatchPercent}%`);
  console.log(`  🧠 Context Similarity: ${contextSimilarityPercent}%`);

  // =======================
  // 🧮 MARKING SCHEME (Context-Heavy with Keyword Flexibility)
  // =======================
  let percentage: number;
  let remark: string;

  // High context similarity gets bonus even with lower keywords
  if (contextScore >= 0.85) {
    if (keywordMatchPercent >= 60) {
      percentage = 100;
      remark = "Excellent — perfectly explained with all key points covered.";
    } else if (keywordMatchPercent >= 40) {
      percentage = 90;
      remark = "Excellent — strong conceptual understanding, minor keywords missing.";
    } else if (keywordMatchPercent >= 20) {
      percentage = 80;
      remark = "Very good — excellent understanding but needs more key terms.";
    } else {
      percentage = 70;
      remark = "Good — strong conceptual grasp, include more key points.";
    }
  } else if (contextScore >= 0.75) {
    if (keywordMatchPercent >= 50) {
      percentage = 83;
      remark = "Very good — strong understanding with most key points covered.";
    } else if (keywordMatchPercent >= 30) {
      percentage = 70;
      remark = "Good — solid understanding, add more key points.";
    } else {
      percentage = 60;
      remark = "Satisfactory — decent understanding but lacks key terminology.";
    }
  } else if (contextScore >= 0.65) {
    if (keywordMatchPercent >= 40) {
      percentage = 67;
      remark = "Good — decent understanding with adequate key points.";
    } else if (keywordMatchPercent >= 25) {
      percentage = 55;
      remark = "Satisfactory — reasonable understanding, needs more detail.";
    } else {
      percentage = 45;
      remark = "Below average — basic understanding with few key points.";
    }
  } else if (contextScore >= 0.50) {
    if (keywordMatchPercent >= 30) {
      percentage = 50;
      remark = "Satisfactory — basic understanding but missing important details.";
    } else if (keywordMatchPercent >= 15) {
      percentage = 40;
      remark = "Below average — limited understanding and few key points.";
    } else {
      percentage = 30;
      remark = "Poor — weak understanding with minimal key points.";
    }
  } else if (contextScore >= 0.35) {
    if (keywordMatchPercent >= 20) {
      percentage = 33;
      remark = "Poor — limited understanding with many key points missing.";
    } else {
      percentage = 20;
      remark = "Poor — weak understanding and missing most key points.";
    }
  } else if (contextScore >= 0.25) {
    if (keywordMatchPercent >= 10) {
      percentage = 17;
      remark = "Very poor — weak understanding with most key points missing.";
    } else {
      percentage = 10;
      remark = "Very poor — minimal understanding and no key points.";
    }
  } else {
    percentage = 0;
    remark = "Incorrect — answer does not address the question adequately.";
  }

  const marksAwarded = Math.round((percentage / 100) * maxMarks);

  console.log(`  ✨ Final Score: ${percentage}% = ${marksAwarded}/${maxMarks} marks`);
  console.log(`  💬 Remark: ${remark}`);

  return {
    marksAwarded,
    keywordMatchPercent,
    contextSimilarityPercent,
    remark,
  };
}
